/**************************************************
 *  APLIKASI INPUT BUKTI SETOR PARKIR
 *  Multi Upload + Auto Compress + Folder per Tanggal
 **************************************************/

/*** ====== KONFIGURASI (WAJIB DIISI) ====== ***/
const PARENT_FOLDER_ID = "1qOYfal6rdEq8ikLBL1sSClFJiKv_TL78";
const SPREADSHEET_ID   = "1qqWkywd768E9PwnRaT9Z492ZbldqSKeYBYvb_MmG7c4";
const SHEET_NAME       = "Bukti Setor Parkir";          // Nama sheet (dibuat otomatis kalau belum ada)
const TIMEZONE         = "Asia/Jakarta";
/*** ======================================== ***/


/** Menampilkan halaman Web App */
function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("Input Bukti Setor Parkir")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/** Ambil / buat sheet + header otomatis */
function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // Buat header jika sheet masih kosong
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Waktu Input",
      "Tanggal",
      "Area Parkir",
      "Nama File",
      "Link File",
      "Link Folder"
    ]);
    sheet.getRange(1, 1, 1, 6)
         .setFontWeight("bold")
         .setBackground("#e8eaed");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(2, 100);
    sheet.setColumnWidth(3, 150);
    sheet.setColumnWidth(4, 280);
    sheet.setColumnWidth(5, 280);
    sheet.setColumnWidth(6, 280);
  }

  return sheet;
}


/** Ambil / buat folder berdasarkan tanggal (YYYY-MM-DD) */
function getFolderTanggal_(tanggal) {
  const parent = DriveApp.getFolderById(PARENT_FOLDER_ID);
  const folders = parent.getFoldersByName(tanggal);
  return folders.hasNext() ? folders.next() : parent.createFolder(tanggal);
}


/**
 * FUNGSI UTAMA — dipanggil dari HTML via google.script.run
 * data = { tanggal, areaParkir, fileName, imageData }
 */
function simpanBukti(data) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000); // cegah tabrakan saat upload beruntun

    // --- Validasi ---
    if (!data)              throw new Error("Data kosong.");
    if (!data.tanggal)      throw new Error("Tanggal belum diisi.");
    if (!data.areaParkir)   throw new Error("Area parkir belum dipilih.");
    if (!data.imageData)    throw new Error("Gambar tidak terkirim.");

    // --- Konversi Base64 -> Blob ---
    const potong = String(data.imageData).split(",");
    const base64 = potong.length > 1 ? potong[1] : potong[0];
    const namaFile = data.fileName || ("Bukti_" + new Date().getTime() + ".jpg");

    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64),
      "image/jpeg",
      namaFile
    );

    // --- Simpan ke folder tanggal ---
    const folder = getFolderTanggal_(data.tanggal);
    const file = folder.createFile(blob);

    // Set akses link (dibungkus try, agar tidak error di akun Workspace tertentu)
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (eShare) {
      // abaikan, file tetap tersimpan
    }

    // --- Catat ke Google Sheet ---
    const sheet = getSheet_();
    const waktu = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");

    sheet.appendRow([
      waktu,               // A - Waktu Input
      data.tanggal,        // B - Tanggal
      data.areaParkir,     // C - Area Parkir
      file.getName(),      // D - Nama File
      file.getUrl(),       // E - Link File
      folder.getUrl()      // F - Link Folder
    ]);

    return {
      status: "success",
      message: "Tersimpan",
      namaFile: file.getName(),
      fileUrl: file.getUrl(),
      folderUrl: folder.getUrl()
    };

  } catch (err) {
    return { status: "error", message: err.message || String(err) };

  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}


/**
 * JALANKAN INI SEKALI untuk mengecek konfigurasi sudah benar.
 * Lihat hasilnya di menu "Log Eksekusi".
 */
function testKonfigurasi() {
  try {
    const folder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    Logger.log("✅ Folder OK  : " + folder.getName());
  } catch (e) {
    Logger.log("❌ FOLDER ID SALAH: " + e.message);
  }

  try {
    const sheet = getSheet_();
    Logger.log("✅ Sheet OK   : " + sheet.getName() + " (baris terisi: " + sheet.getLastRow() + ")");
  } catch (e) {
    Logger.log("❌ SPREADSHEET ID SALAH: " + e.message);
  }
}
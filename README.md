# slipparkirRO4

Repositori ini terhubung ke project Google Apps Script melalui `clasp`.

## Sinkronisasi otomatis

Setiap push ke branch `main` akan menjalankan GitHub Actions dan mengirim file
Apps Script ke project yang terdaftar di `.clasp.json`.

Sebelum deployment otomatis aktif, buat dua secret repository:

- `CLASPRC_JSON`: isi file kredensial clasp dari komputer yang sudah login ke Google.
- `DEPLOYMENT_ID`: bagian setelah `/macros/s/` dan sebelum `/exec` pada URL Web App.

Contoh URL:

```text
https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

Setup kredensialnya:

```bash
npx @google/clasp login
gh secret set CLASPRC_JSON < ~/.clasprc.json
```

Jangan commit `~/.clasprc.json` atau token Google ke repository.
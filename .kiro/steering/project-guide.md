# Panduan Project — Life Dashboard

## Gambaran Umum

Life Dashboard adalah halaman web statis yang berfungsi sebagai personal dashboard harian. Dibuat sebagai tugas RevoU Coding Camp oleh Rusyda Mulayyana. Tidak memerlukan server, backend, atau proses build — cukup buka `index.html` langsung di browser.

## Struktur File

```
/
├── index.html          # Satu-satunya halaman HTML
├── css/
│   └── style.css       # Satu-satunya file CSS (custom styles & CSS variables)
├── js/
│   └── app.js          # Satu-satunya file JavaScript (semua logika aplikasi)
└── .kiro/
    └── steering/
        └── project-guide.md
```

> **Aturan folder:** hanya boleh ada 1 file di dalam `css/` dan 1 file di dalam `js/`. Jangan buat file tambahan di kedua folder tersebut.

---

## Stack Teknologi

| Layer      | Teknologi                                      |
|------------|------------------------------------------------|
| Struktur   | HTML5                                          |
| Styling    | Tailwind CSS (CDN) + `css/style.css`           |
| Logika     | Vanilla JavaScript (`js/app.js`)               |
| Penyimpanan| Browser LocalStorage API (client-side only)    |
| Font       | Plus Jakarta Sans + Poppins (Google Fonts CDN) |

### Larangan keras

- ❌ Jangan install package (npm, yarn, pip, dll.)
- ❌ Jangan tambahkan framework (React, Vue, Angular, dll.)
- ❌ Jangan tambahkan library JavaScript eksternal selain yang sudah ada
- ❌ Jangan buat backend atau server
- ❌ Jangan ubah struktur folder `css/` dan `js/`

---

## Fitur yang Ada

### 1. Greeting & Clock (`index.html` + `app.js` — Section 3 & 4)
- Jam live (update tiap detik via `setInterval`)
- Tanggal lengkap (hari, tanggal, bulan, tahun)
- Sapaan otomatis berdasarkan waktu: Good morning / afternoon / evening / night
- Custom name — disimpan di LocalStorage key `dashboard_name`

### 2. Focus Timer (`app.js` — Section 5)
- Timer Pomodoro dengan durasi yang bisa diubah (1–120 menit, default 25)
- SVG progress ring dengan gradient orange → pink → purple
- Tombol Start, Pause, Reset
- Notifikasi toast + audio beep (Web Audio API) saat sesi selesai
- Status teks dinamis (Ready / Focusing / Paused / Complete)

### 3. To-Do List (`app.js` — Section 6 & 7)
- Tambah, edit (via modal), centang selesai, hapus task
- Cegah duplikat — perbandingan case-insensitive
- Sort: Default / A–Z / Done Last
- Disimpan di LocalStorage key `dashboard_tasks`
- Empty state dengan ikon clipboard SVG

### 4. Quick Links (`app.js` — Section 8)
- Tambah link dengan nama, URL, dan ikon kustom (upload gambar → base64)
- Default links: Google, YouTube, GitHub, LinkedIn (Rusyda Mulayyana)
- Brand icon SVG bawaan untuk: Google, YouTube, GitHub, LinkedIn
- Fallback emoji untuk domain lain
- Layout: vertical scroll list, maksimum tampil ~3.5 baris (hint scrollable)
- Upload ikon: kotak 1:1 di sebelah kiri input field
- Disimpan di LocalStorage key `dashboard_links`

### 5. Light / Dark Mode (`app.js` — Section 2)
- Default: **dark mode**
- Toggle switch di header (bukan tombol biasa)
- Disimpan di LocalStorage key `dashboard_theme`
- Semua warna dikontrol via CSS custom properties di `:root` dan `html.light`

---

## Sistem Warna & CSS

Semua warna dikelola lewat CSS custom properties di `css/style.css`:

```css
/* Dark mode (default, di :root) */
--bg-base, --glass-bg, --glass-border, --text-primary, --text-muted
--input-bg, --input-border, --task-bg, --task-border, --modal-bg ...

/* Light mode (di html.light) */
/* Override semua variabel di atas dengan nilai yang lebih terang */
```

Palet aksen: **Purple `#a855f7` · Blue `#3b82f6` · Pink `#ec4899` · Orange `#f97316`**

Gaya visual: **Futuristic 3D Neon Glass UI** — `backdrop-filter: blur`, border transparan, neon glow, gradient teks.

---

## LocalStorage Keys

| Key                  | Isi                              |
|----------------------|----------------------------------|
| `dashboard_theme`    | `"dark"` atau `"light"`          |
| `dashboard_name`     | String nama pengguna             |
| `dashboard_tasks`    | Array objek task `{id, text, done}` |
| `dashboard_links`    | Array objek link `{id, name, url, icon}` |

---

## Migrasi Data (LocalStorage)

`initDefaultLinks()` di `app.js` menangani migrasi untuk returning user:
- Cek apakah LinkedIn sudah ada → tambahkan jika belum
- Cek apakah Google ada dan posisinya sebelum YouTube → perbaiki urutannya jika tidak

Pola yang sama harus diikuti jika ada perubahan default links di masa depan.

---

## Cara Menjalankan

```
Buka index.html langsung di browser (double-click atau drag ke browser)
```

Tidak perlu `npm install`, `npm run dev`, atau server apapun.

---

## Konvensi Kode

- Semua JavaScript menggunakan `"use strict"`
- Fungsi dikelompokkan per section dengan komentar `/* SECTION N — NAMA */`
- Sanitasi input: `sanitise()` untuk teks, `escapeHTML()` dan `escapeAttr()` untuk mencegah XSS
- ID unik dibuat dengan `uid()` (timestamp base36 + random)
- Baca LocalStorage: `lsGet(key, fallback)` — Tulis: `lsSet(key, value)`

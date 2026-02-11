# MBG Nutrition Support 🥗

Sistem Pendukung Program **Makan Bergizi Gratis (MBG)** berbasis web (PWA). Aplikasi ini dirancang untuk membantu orang tua memantau kecukupan gizi harian anak dengan mengintegrasikan data makan siang dari sekolah dan memberikan rekomendasi makan malam di rumah.

## ✨ Fitur Utama
1. **Rekomendasi Menu Malam**: Kalkulator gizi otomatis berdasarkan data fisik anak (BB/TB/Usia) dan input menu MBG siang hari.
2. **Jadwal Menu MBG**: Informasi jadwal menu makan siang sekolah harian beserta rincian kalorinya.
3. **Konsultasi Gizi**: Akses cepat untuk berinteraksi dengan ahli gizi/dokter gizi (Simulasi).
4. **Edukasi Gizi**: Kumpulan fakta, berita, dan tips gizi seimbang yang dikemas menarik untuk orang tua.

## 🛠️ Teknologi
- **Frontend**: React 19 & Vite 6
- **Styling**: Tailwind CSS 4
- **Ikon**: Lucide React
- **Data**: Local JSON Dataset (Kaggle TKPI)
- **PWA**: Vite PWA Plugin (Offline Support)

## 🚀 Cara Menjalankan
1. Clone repositori ini.
2. Pastikan file dataset gizi berada di `public/data/nutrisi.json`.
3. Instal dependensi:
   ```bash
   npm install
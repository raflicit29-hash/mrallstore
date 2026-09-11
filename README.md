# MR ALL IN Store — V1
Demo website + admin dashboard.

## Yang sudah berfungsi
- Katalog responsive desktop/mobile
- Kategori & pencarian
- Harga normal + harga promo
- Stok
- Label Flash Sale
- Countdown demo
- Admin CRUD produk
- Upload gambar dari perangkat (tersimpan sebagai data URL pada demo)
- Pengaturan WhatsApp/alamat
- Data bertahan di browser via localStorage

## Catatan penting untuk produksi
V1 ini adalah demo yang langsung bisa dibuka tanpa backend. Jangan pakai localStorage sebagai sistem toko produksi.

Tahap produksi yang disarankan:
1. Supabase Database untuk products/categories/settings/promotions.
2. Supabase Storage untuk foto produk.
3. Supabase Auth Magic Link.
4. Batasi admin dengan email `raflicit29@gmail.com`.
5. Row Level Security (RLS): publik hanya boleh membaca produk aktif; hanya akun admin yang boleh insert/update/delete.
6. Promo memiliki start_at/end_at sehingga harga promo otomatis aktif/nonaktif berdasarkan waktu server.
7. Stok dikurangi melalui transaksi/aturan backend, bukan hanya JavaScript browser.

## Jalankan
Buka `index.html` untuk toko dan `admin.html` untuk dashboard demo.

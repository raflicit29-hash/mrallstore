# MR ALL IN V7

Upgrade dari V6: status barang publik, edit/hapus produk, Magic Link admin, dan Flash Sale menggunakan schema existing (`price`, `old_price`, `promo_start`, `promo_end`).

## WAJIB sekali di Supabase SQL Editor
Jalankan `v7_status.sql` sebelum memakai dropdown status.

Data produk/kategori lama tetap tersimpan. V7 tidak menghapus data Supabase.

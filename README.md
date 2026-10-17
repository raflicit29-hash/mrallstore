# MR ALL IN V7

Upgrade dari V6: status barang publik, edit/hapus produk, Magic Link admin, dan Flash Sale memakai skema yang sudah ada (price, old_price, promo_start, promo_end).

## Persiapan database
Jalankan `v7_status.sql` sebelum memakai dropdown status.

Data produk/kategori lama tetap tersimpan. V7 tidak menghapus data Supabase.

## Sinkron stok Business → Store
1. Jalankan `supabase/migrations/002_business_inventory_sync.sql` satu kali pada SQL Editor Supabase project yang sama.
2. Di MR ALL IN Business, buka **Cloud → Publikasikan stok ke MR ALL IN Store**.
3. Gunakan akun admin Store `raflicit29@gmail.com` yang sudah terdaftar di Supabase Auth untuk Cloud Business.
4. Muat daftar stok, centang barang yang boleh terlihat di website, lalu sinkronkan.
5. Ulangi sinkron setelah transaksi/perubahan harga. Pembaruan tidak otomatis realtime.

Yang dikirim hanya nama, kategori, harga jual, stok, dan status. Data modal, supplier, profit, saldo, utang, konsumen, dan snapshot internal tidak dikirim.

**PRD: App 2 Dapur Nia**

Product Requirements Document · Draf eksekusi Sesi 3

**1\. Ringkasan Eksekutif**

Dapur Nia adalah usaha katering harian milik Dina. Pesanan masuk melalui pesan pribadi dan dicatat di buku tulis. Pencatatan manual membuat pesanan terlewat, sisa porsi tidak diketahui, total tagihan dapat salah, dan pesanan nol porsi tetap tersimpan. Aplikasi dibangun untuk mengelola menu, pelanggan, pesanan, pembayaran, dan laporan harian dalam satu alur data.

Pada Sesi 3, aplikasi dibangun dalam konteks satu peran untuk latihan CRUD. Pemisahan hak pemilik, staf, dan pelanggan belum diterapkan pada sesi ini.

| Keterangan | Isian |
| :---- | :---- |
| Nama aplikasi | App 2 Dapur Nia |
| Status | Draf eksekusi Sesi 3 |
| Basis data | Cloud Firestore |
| Platform publikasi | Netlify |

**Masalah yang Diselesaikan**

| No | Masalah | Akibat |
| :---- | :---- | :---- |
| 1 | Pesanan tercatat manual dan sering terlewat | Laporan penjualan tidak dapat dipakai. |
| 2 | Sisa porsi tidak diketahui | Pesanan melebihi kapasitas. |
| 3 | Total tagihan dapat bernilai minus | Pendapatan pada laporan menjadi tidak masuk akal. |
| 4 | Pesanan nol porsi tetap tersimpan | Data pesanan tidak sah masuk ke laporan. |

**2\. Pengguna dan Peran**

PRD sumber memiliki tiga peran. Implementasi Sesi 3 menyederhanakan akses menjadi satu peran agar peserta fokus pada CRUD dan aturan data.

| Peran sumber | Kewenangan sumber | Status pada Sesi 3 |
| :---- | :---- | :---- |
| Pemilik · Dina | Seluruh fitur dan laporan | Digabung ke satu peran latihan |
| Staf · Rani | Melihat pesanan dan mengonfirmasi pembayaran | Digabung ke satu peran latihan |
| Pelanggan · Umum | Memilih menu dan membuat pesanan | Digabung ke satu peran latihan |

**3\. Lingkup Produk**

Aplikasi web responsif untuk layar telepon genggam. Peserta membuka aplikasi melalui peramban dan mengelola data melalui UI CRUD.

**3.1 Modul**

| Modul | Menu | Tujuan |
| :---- | :---- | :---- |
| Menu | Daftar dan formulir menu | Mengelola menu, harga, stok, dan ketersediaan. |
| Pelanggan | Daftar dan formulir pelanggan | Mengelola nama, nomor WhatsApp, dan alamat. |
| Pesanan | Daftar, detail, dan formulir pesanan | Mengelola item, total, status, dan bukti bayar. |
| Laporan | Porsi terjual dan uang masuk | Membaca ringkasan penjualan pada tanggal tertentu. |

**3.2 Fitur v1**

| Termasuk | Tidak termasuk |
| :---- | :---- |
| CRUD menu, pelanggan, dan pesanan; validasi; status; laporan dasar | Pembayaran daring otomatis; pelacakan kurir; aplikasi toko aplikasi; langganan bulanan |

**4\. Kebutuhan Fungsional**

Nama koleksi dan field pada bagian ini mengikuti Skema-Firestore-Dapur-Nia. Setiap acceptance criteria menjadi bahan uji pada Praktik 2\.

**4.1 Modul Menu**

Pengguna melihat daftar menu harian beserta harga, sisa porsi, dan status ketersediaan.

User story: Sebagai pengelola, saya ingin menambah, melihat, mengubah, dan menghapus menu, sehingga kapasitas katering dapat diperbarui.

| No | Acceptance criteria |
| :---- | :---- |
| 1 | Given formulir menu berisi nama, harga, dan sisa porsi yang sah, When pengguna menyimpan, Then satu dokumen menu tersimpan. |
| 2 | Given sisa porsi bernilai nol, When daftar menu dibuka, Then menu tetap tampil dengan status habis. |
| 3 | Given harga negatif atau sisa porsi negatif, When data dikirim, Then permintaan ditolak dan data tidak berubah. |

**4.2 Modul Pelanggan**

Pengguna melihat data pelanggan dan alamat pengiriman yang tersimpan pada dokumen pelanggan.

User story: Sebagai pengelola, saya ingin mengelola data pelanggan, sehingga pesanan memiliki informasi pengiriman yang jelas.

| No | Acceptance criteria |
| :---- | :---- |
| 1 | Given nama, nomor WhatsApp, dan alamat terisi, When pengguna menyimpan, Then data pelanggan tersimpan. |
| 2 | Given nomor WhatsApp sudah digunakan, When data baru dikirim, Then permintaan ditolak. |
| 3 | Given nama atau alamat kosong, When data dikirim, Then formulir menampilkan pesan perbaikan. |

**4.3 Modul Pesanan**

Pengguna membuat pesanan berdasarkan menu, jumlah porsi, data pelanggan, total tagihan, waktu pemesanan, dan status.

User story: Sebagai pengelola, saya ingin mengelola pesanan, sehingga pesanan dapat diproses dari pembayaran sampai selesai.

| No | Acceptance criteria |
| :---- | :---- |
| 1 | Given item menu dan jumlah porsi sah, When pesanan disimpan, Then total dihitung dari harga saat pemesanan dan ongkos kirim. |
| 2 | Given jumlah porsi nol atau sisa porsi tidak mencukupi, When pesanan dikirim, Then permintaan ditolak. |
| 3 | Given status pesanan berada pada satu tahap, When pengguna mengubahnya, Then status tidak boleh melompat atau mundur. |

**4.4 Modul Laporan**

Pengguna memilih tanggal dan melihat jumlah porsi terjual per menu serta total uang masuk. Pesanan dibatalkan tidak dihitung.

User story: Sebagai pengelola, saya ingin melihat laporan harian, sehingga kebutuhan belanja dan uang masuk dapat diperiksa.

| No | Acceptance criteria |
| :---- | :---- |
| 1 | Given tanggal dipilih, When laporan dimuat, Then jumlah porsi per menu dan total uang masuk tampil. |
| 2 | Given ada pesanan berstatus dibatalkan, When laporan dihitung, Then pesanan tersebut tidak ikut dihitung. |
| 3 | Given belum ada pesanan pada tanggal tersebut, When laporan dibuka, Then aplikasi menampilkan \*empty state\*. |

**5\. Identitas Visual dan Prinsip Antarmuka**

Tampilan mengikuti referensi UI yang dipilih peserta, dengan prioritas keterbacaan pada layar telepon genggam.

| Elemen | Ketentuan |
| :---- | :---- |
| Warna | Gunakan warna merek pada PRD proyek. Status habis, berhasil, dan galat harus memiliki pembeda yang jelas. |
| Tipografi | Pilih satu font antarmuka dan fallback sans-serif. |
| Formulir | Letakkan label di atas field dan pesan galat di dekat field. |
| State | Bedakan \*loading\*, \*empty\*, dan \*error\*. |
| Tombol | Gunakan label tindakan yang menyebut hasil, seperti Simpan Menu atau Hapus Pesanan. |

**6\. Kebutuhan Non-Fungsional**

* Aplikasi dapat dibuka melalui peramban pada layar telepon genggam.  
* Data tersimpan di Firestore dan dapat dibaca kembali setelah halaman dimuat ulang.  
* Pesan galat menjelaskan masalah dan tindakan berikutnya tanpa menampilkan rincian teknis.  
* Sesi 3 memakai satu peran. \*Authentication\* dan \*authorization\* antarperan ditunda.  
* Kunci rahasia dan kredensial layanan tidak disimpan di repository.

**7\. Teknologi yang Digunakan**

| Lapisan | Teknologi | Catatan |
| :---- | :---- | :---- |
| Antarmuka | React | Dibangun bertahap melalui Antigravity. |
| Basis data | Cloud Firestore | Menggunakan koleksi, dokumen, dan \*field\*. |
| Publikasi | Netlify | Repository diterbitkan menjadi URL publik. |

**8\. Pengujian**

Peserta menguji setiap acceptance criteria melalui UI, konsol Firestore, dan URL publik. Uji tembus berpasangan memakai enam masukan tidak sah: field kosong, tipe salah, teks terlalu panjang, nilai negatif, nilai di luar batas, dan perubahan status tidak sah. Hasil dicatat bersama jalur pengiriman dan kondisi data akhir.

**9\. Batas Lingkup Pekerjaan**

| Tidak termasuk v1 | Alasan |
| :---- | :---- |
| Pembayaran daring otomatis | Transfer manual masih menjadi alur latihan. |
| Pelacakan posisi kurir | Tidak diperlukan untuk CRUD dasar. |
| Aplikasi toko aplikasi | Aplikasi dibuka melalui peramban. |
| Authentication dan authorization antarperan | Dibahas pada sesi berikutnya. |
| Konsistensi stok lintas transaksi secara penuh | Memerlukan transaksi atau lapisan peladen yang dibahas sebagai pengayaan. |

Setelah PRD dipakai pada praktik, nama koleksi, field, alur inti, dan tiga invariant tidak diubah tanpa persetujuan mentor.

**10\. Kamus Istilah**

| Istilah | Arti |
| :---- | :---- |
| CRUD | Operasi membuat, membaca, mengubah, dan menghapus data. |
| Koleksi | Kelompok dokumen Firestore yang berkaitan. |
| Dokumen | Satu unit data di dalam koleksi. |
| \*Field\* | Nama dan nilai atribut di dalam dokumen. |
| \*Security rules\* | Aturan Firestore yang menentukan permintaan yang boleh diterima atau ditolak. |
| \*Invariant\* | Aturan yang harus tetap benar sebelum dan sesudah operasi. |
| \*Loading state\* | Tampilan saat aplikasi menunggu proses. |
| \*Empty state\* | Tampilan saat pembacaan berhasil tetapi belum ada data. |
| \*Error state\* | Tampilan saat proses gagal atau ditolak. |
| \*Deploy\* | Proses menerbitkan aplikasi ke URL publik. |


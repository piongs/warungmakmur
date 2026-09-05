-- =====================================================================
-- SEED DATA - PRODUK WARUNG (contoh data realistis untuk demo/portofolio)
-- Jalankan SETELAH schema.sql, di Neon SQL Editor atau psql:
--   psql "$DATABASE_URL" -f seed_products.sql
-- Aman dijalankan berkali-kali (pakai ON CONFLICT DO NOTHING pada kode unik).
-- =====================================================================

-- Tambah kategori tambahan (kategori dasar sudah ada dari schema.sql)
insert into categories (name) values
  ('Mie Instan'),
  ('Snack'),
  ('Bumbu Dapur'),
  ('Kebutuhan Rumah Tangga')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- SEMBAKO
-- ---------------------------------------------------------------------
insert into products (code, name, category_id, selling_price, cost_price, stock, minimum_stock, unit) values
('SMB001','Beras Pandan Wangi 5kg',(select id from categories where name='Sembako'),68000,63000,20,5,'karung'),
('SMB002','Beras Pandan Wangi 1kg',(select id from categories where name='Sembako'),14000,12500,40,10,'kg'),
('SMB003','Gula Pasir 1kg',(select id from categories where name='Sembako'),16000,14500,35,10,'kg'),
('SMB004','Gula Pasir 1/2kg',(select id from categories where name='Sembako'),8500,7500,30,10,'pcs'),
('SMB005','Minyak Goreng Bimoli 1L',(select id from categories where name='Sembako'),18000,16000,30,8,'pouch'),
('SMB006','Minyak Goreng Bimoli 2L',(select id from categories where name='Sembako'),34000,31000,20,5,'pouch'),
('SMB007','Minyak Goreng Curah 1kg',(select id from categories where name='Sembako'),15000,13500,25,8,'kg'),
('SMB008','Telur Ayam 1kg',(select id from categories where name='Sembako'),29000,27000,25,8,'kg'),
('SMB009','Telur Ayam 1/2kg',(select id from categories where name='Sembako'),15000,14000,20,8,'kg'),
('SMB010','Tepung Terigu Segitiga Biru 1kg',(select id from categories where name='Sembako'),13000,11500,20,5,'kg'),
('SMB011','Tepung Beras Rose Brand 500g',(select id from categories where name='Sembako'),9000,7800,15,5,'pcs'),
('SMB012','Garam Dapur Beryodium 250g',(select id from categories where name='Sembako'),3000,2200,30,10,'pcs'),
('SMB013','Kecap Manis Bango 135ml',(select id from categories where name='Sembako'),8500,7300,20,5,'botol'),
('SMB014','Saus Sambal ABC 140ml',(select id from categories where name='Sembako'),9000,7700,20,5,'botol'),

-- ---------------------------------------------------------------------
-- MIE INSTAN
-- ---------------------------------------------------------------------
('MIE001','Indomie Goreng',(select id from categories where name='Mie Instan'),3500,3000,80,20,'pcs'),
('MIE002','Indomie Ayam Bawang',(select id from categories where name='Mie Instan'),3500,3000,80,20,'pcs'),
('MIE003','Indomie Soto',(select id from categories where name='Mie Instan'),3500,3000,60,20,'pcs'),
('MIE004','Indomie Kari Ayam',(select id from categories where name='Mie Instan'),3500,3000,50,15,'pcs'),
('MIE005','Mie Sedaap Goreng',(select id from categories where name='Mie Instan'),3300,2800,70,20,'pcs'),
('MIE006','Mie Sedaap Korean Spicy Chicken',(select id from categories where name='Mie Instan'),4000,3400,40,10,'pcs'),
('MIE007','Mie Sedaap Ayam Bawang',(select id from categories where name='Mie Instan'),3300,2800,50,15,'pcs'),
('MIE008','Sarimi Ayam Bawang',(select id from categories where name='Mie Instan'),3000,2500,40,10,'pcs'),
('MIE009','Supermi Ayam Bawang',(select id from categories where name='Mie Instan'),3000,2500,35,10,'pcs'),
('MIE010','Pop Mie Ayam Cup',(select id from categories where name='Mie Instan'),6000,5200,30,10,'cup'),

-- ---------------------------------------------------------------------
-- MINUMAN
-- ---------------------------------------------------------------------
('MIN001','Aqua Botol 600ml',(select id from categories where name='Minuman'),4000,3300,60,15,'botol'),
('MIN002','Aqua Gelas 240ml',(select id from categories where name='Minuman'),600,450,100,30,'cup'),
('MIN003','Le Minerale 600ml',(select id from categories where name='Minuman'),4000,3300,40,10,'botol'),
('MIN004','Teh Botol Sosro 450ml',(select id from categories where name='Minuman'),5500,4700,40,10,'botol'),
('MIN005','Teh Pucuk Harum 350ml',(select id from categories where name='Minuman'),4500,3800,40,10,'botol'),
('MIN006','Mizone Fresh Lychee 500ml',(select id from categories where name='Minuman'),8000,6800,30,8,'botol'),
('MIN007','Pocari Sweat 500ml',(select id from categories where name='Minuman'),9000,7700,25,8,'botol'),
('MIN008','Coca-Cola 390ml',(select id from categories where name='Minuman'),6500,5500,30,8,'botol'),
('MIN009','Sprite 390ml',(select id from categories where name='Minuman'),6500,5500,25,8,'botol'),
('MIN010','Fanta Strawberry 390ml',(select id from categories where name='Minuman'),6500,5500,25,8,'botol'),
('MIN011','Susu Ultra Milk Coklat 250ml',(select id from categories where name='Minuman'),6000,5100,30,10,'kotak'),
('MIN012','Susu Indomilk UHT Full Cream 250ml',(select id from categories where name='Minuman'),6500,5600,25,10,'kotak'),
('MIN013','Susu Kental Manis Frisian Flag 385g',(select id from categories where name='Minuman'),13000,11500,20,5,'kaleng'),
('MIN014','Kopi Kapal Api Sachet',(select id from categories where name='Minuman'),1500,1100,60,15,'sachet'),
('MIN015','Kopi Good Day Sachet',(select id from categories where name='Minuman'),2000,1600,50,15,'sachet'),
('MIN016','Susu Kopi ABC Sachet',(select id from categories where name='Minuman'),1500,1150,40,15,'sachet'),
('MIN017','Nutrisari Jeruk Sachet',(select id from categories where name='Minuman'),1000,750,50,15,'sachet'),
('MIN018','Milo Sachet',(select id from categories where name='Minuman'),2000,1600,40,15,'sachet'),
('MIN019','Extra Joss Sachet',(select id from categories where name='Minuman'),2000,1600,30,10,'sachet'),
('MIN020','You C1000 Botol',(select id from categories where name='Minuman'),9500,8200,15,5,'botol'),

-- ---------------------------------------------------------------------
-- SNACK
-- ---------------------------------------------------------------------
('SNK001','Chitato Sapi Panggang',(select id from categories where name='Snack'),10500,9200,25,8,'pcs'),
('SNK002','Taro Net Original',(select id from categories where name='Snack'),7000,6000,25,8,'pcs'),
('SNK003','Chiki Balls',(select id from categories where name='Snack'),2500,2000,40,10,'pcs'),
('SNK004','Qtela Singkong Balado',(select id from categories where name='Snack'),6500,5600,20,8,'pcs'),
('SNK005','Better Cheese',(select id from categories where name='Snack'),6500,5600,20,8,'pcs'),
('SNK006','SilverQueen Chunky Bar',(select id from categories where name='Snack'),13000,11200,20,5,'pcs'),
('SNK007','Beng-Beng',(select id from categories where name='Snack'),2000,1600,50,15,'pcs'),
('SNK008','Kacang Garuda Kulit',(select id from categories where name='Snack'),8500,7300,20,8,'pcs'),
('SNK009','Roma Kelapa',(select id from categories where name='Snack'),8500,7300,20,8,'pack'),
('SNK010','Oreo Original',(select id from categories where name='Snack'),6000,5100,25,8,'pack'),
('SNK011','Tango Wafer Coklat',(select id from categories where name='Snack'),6000,5100,25,8,'pack'),
('SNK012','Chocolatos Sachet',(select id from categories where name='Snack'),2000,1600,40,10,'sachet'),
('SNK013','Permen Kopiko',(select id from categories where name='Snack'),3000,2400,50,15,'pack'),
('SNK014','Permen Relaxa',(select id from categories where name='Snack'),3000,2400,30,10,'pack'),
('SNK015','Wafer Tango Long',(select id from categories where name='Snack'),2000,1600,35,10,'pcs'),

-- ---------------------------------------------------------------------
-- ROKOK
-- ---------------------------------------------------------------------
('ROK001','Sampoerna Mild',(select id from categories where name='Rokok'),32000,29500,20,5,'bungkus'),
('ROK002','Gudang Garam Filter Merah',(select id from categories where name='Rokok'),29000,26500,20,5,'bungkus'),
('ROK003','Djarum Super',(select id from categories where name='Rokok'),29000,26500,20,5,'bungkus'),
('ROK004','Marlboro Merah',(select id from categories where name='Rokok'),38000,35000,15,5,'bungkus'),
('ROK005','LA Lights',(select id from categories where name='Rokok'),29000,26500,15,5,'bungkus'),
('ROK006','Dji Sam Soe Magnum',(select id from categories where name='Rokok'),33000,30000,15,5,'bungkus'),
('ROK007','Surya 16',(select id from categories where name='Rokok'),27000,24500,15,5,'bungkus'),

-- ---------------------------------------------------------------------
-- GORENGAN (dibuat fresh harian)
-- ---------------------------------------------------------------------
('GRG001','Tahu Isi',(select id from categories where name='Gorengan'),2000,1200,30,10,'pcs'),
('GRG002','Bakwan Sayur',(select id from categories where name='Gorengan'),2000,1200,30,10,'pcs'),
('GRG003','Tempe Goreng',(select id from categories where name='Gorengan'),1500,900,30,10,'pcs'),
('GRG004','Risoles Ragout',(select id from categories where name='Gorengan'),2500,1500,25,10,'pcs'),
('GRG005','Pisang Goreng',(select id from categories where name='Gorengan'),2000,1200,25,10,'pcs'),
('GRG006','Combro',(select id from categories where name='Gorengan'),2000,1200,20,8,'pcs'),
('GRG007','Cireng Bumbu Rujak',(select id from categories where name='Gorengan'),2000,1200,20,8,'pcs'),
('GRG008','Martabak Mini Telur',(select id from categories where name='Gorengan'),3000,2000,15,8,'pcs'),

-- ---------------------------------------------------------------------
-- MAKANAN
-- ---------------------------------------------------------------------
('MKN001','Roti Tawar Sari Roti',(select id from categories where name='Makanan'),16000,14000,15,5,'pcs'),
('MKN002','Roti Sobek Coklat Sari Roti',(select id from categories where name='Makanan'),13000,11200,15,5,'pcs'),
('MKN003','Biskuit Roma Malkist Coklat',(select id from categories where name='Makanan'),6500,5600,20,8,'pack'),
('MKN004','Biskuit Marie Regal',(select id from categories where name='Makanan'),6000,5100,20,8,'pack'),
('MKN005','Better Sandwich Coklat',(select id from categories where name='Makanan'),2000,1600,30,10,'pcs'),
('MKN006','Telur Gulung isi 10',(select id from categories where name='Makanan'),5000,3800,15,5,'pcs'),

-- ---------------------------------------------------------------------
-- KEBUTUHAN RUMAH TANGGA
-- ---------------------------------------------------------------------
('RT001','Sabun Mandi Lifebuoy',(select id from categories where name='Kebutuhan Rumah Tangga'),4000,3300,25,8,'pcs'),
('RT002','Shampo Sunsilk Sachet',(select id from categories where name='Kebutuhan Rumah Tangga'),1000,750,50,15,'sachet'),
('RT003','Pasta Gigi Pepsodent 75g',(select id from categories where name='Kebutuhan Rumah Tangga'),9000,7700,20,8,'pcs'),
('RT004','Sabun Cuci Piring Sunlight 400ml',(select id from categories where name='Kebutuhan Rumah Tangga'),9500,8200,20,8,'pouch'),
('RT005','Deterjen Rinso Sachet',(select id from categories where name='Kebutuhan Rumah Tangga'),1500,1150,40,15,'sachet'),
('RT006','Deterjen Daia Sachet',(select id from categories where name='Kebutuhan Rumah Tangga'),1500,1150,40,15,'sachet'),
('RT007','Baterai ABC AA isi 2',(select id from categories where name='Kebutuhan Rumah Tangga'),6000,5000,15,5,'pack'),
('RT008','Korek Api Gas',(select id from categories where name='Kebutuhan Rumah Tangga'),3000,2200,25,8,'pcs'),
('RT009','Tisu Paseo Isi 250',(select id from categories where name='Kebutuhan Rumah Tangga'),8000,6800,15,5,'pack'),
('RT010','Pembalut Charm Malam',(select id from categories where name='Kebutuhan Rumah Tangga'),12000,10200,15,5,'pack'),
('RT011','Popok Bayi Pampers Satuan',(select id from categories where name='Kebutuhan Rumah Tangga'),3000,2400,30,10,'pcs'),
('RT012','Pewangi Molto Sachet',(select id from categories where name='Kebutuhan Rumah Tangga'),1500,1150,30,10,'sachet'),

-- ---------------------------------------------------------------------
-- BUMBU DAPUR
-- ---------------------------------------------------------------------
('BMB001','Bawang Merah 1kg',(select id from categories where name='Bumbu Dapur'),32000,28000,15,5,'kg'),
('BMB002','Bawang Putih 1kg',(select id from categories where name='Bumbu Dapur'),30000,26000,15,5,'kg'),
('BMB003','Cabai Merah Keriting 1kg',(select id from categories where name='Bumbu Dapur'),45000,40000,10,5,'kg'),
('BMB004','Cabai Rawit 1kg',(select id from categories where name='Bumbu Dapur'),55000,48000,10,5,'kg'),
('BMB005','Royco Ayam Sachet',(select id from categories where name='Bumbu Dapur'),500,350,60,20,'sachet'),
('BMB006','Masako Sapi Sachet',(select id from categories where name='Bumbu Dapur'),500,350,60,20,'sachet'),
('BMB007','Micin Ajinomoto 250g',(select id from categories where name='Bumbu Dapur'),6000,5000,20,8,'pcs'),
('BMB008','Kecap Manis ABC Sachet',(select id from categories where name='Bumbu Dapur'),1000,750,30,10,'sachet'),
('BMB009','Saus Tiram Saori 135ml',(select id from categories where name='Bumbu Dapur'),9000,7700,15,5,'botol'),
('BMB010','Merica Bubuk Sachet',(select id from categories where name='Bumbu Dapur'),1000,750,30,10,'sachet')

on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- Catat stok awal semua produk baru di atas sebagai stock_movements tipe IN
-- (supaya laporan stok & riwayat pergerakan tidak kosong)
-- ---------------------------------------------------------------------
insert into stock_movements (product_id, type, qty, stock_after, note)
select id, 'IN', stock, stock, 'Stok awal (seed data demo)'
from products
where stock > 0
  and id not in (select distinct product_id from stock_movements);

-- =====================================================================
-- Selesai. Total produk yang ditambahkan: 102 item.
-- Cek dengan: select count(*) from products;
-- =====================================================================

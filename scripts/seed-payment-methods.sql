-- ============================================================
-- Script: Seed Payment Methods + Migrate Orders for Xendit
-- Run this on Neon Console or via psql
-- ============================================================

-- 1. Add Xendit columns to orders table (if not exists)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS xendit_payment_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS xendit_payment_method_id VARCHAR(255);

-- 2. Seed payment methods
INSERT INTO payment_methods (code, name, type, provider, is_redirect, sort_order, is_active) VALUES
  ('CASH',        'Cash',             'CASH',            'MANUAL', false, 1,  true),
  ('QRIS',        'QRIS',             'QR_CODE',         'XENDIT', false, 2,  true),
  ('OVO',         'OVO',              'EWALLET',         'XENDIT', true,  3,  true),
  ('DANA',        'DANA',             'EWALLET',         'XENDIT', true,  4,  true),
  ('SHOPEEPAY',   'ShopeePay',        'EWALLET',         'XENDIT', true,  5,  true),
  ('BRI_VA',      'Transfer BRI',     'VIRTUAL_ACCOUNT', 'XENDIT', false, 6,  true),
  ('BCA_VA',      'Transfer BCA',     'VIRTUAL_ACCOUNT', 'XENDIT', false, 7,  true),
  ('MANDIRI_VA',  'Transfer Mandiri', 'VIRTUAL_ACCOUNT', 'XENDIT', false, 8,  true),
  ('BNI_VA',      'Transfer BNI',     'VIRTUAL_ACCOUNT', 'XENDIT', false, 9,  true)
ON CONFLICT (code) DO NOTHING;

-- 3. Seed payment instructions for Virtual Account methods
INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT pm.id, 'Langkah 1', 'Buka aplikasi BRI Mobile atau Internet Banking BRI', 1
FROM payment_methods pm WHERE pm.code = 'BRI_VA'
ON CONFLICT DO NOTHING;

INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT pm.id, 'Langkah 2', 'Pilih menu Transfer > Virtual Account', 2
FROM payment_methods pm WHERE pm.code = 'BRI_VA'
ON CONFLICT DO NOTHING;

INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT pm.id, 'Langkah 3', 'Masukkan nomor Virtual Account yang tertera di atas', 3
FROM payment_methods pm WHERE pm.code = 'BRI_VA'
ON CONFLICT DO NOTHING;

INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT pm.id, 'Langkah 4', 'Konfirmasi jumlah dan lakukan pembayaran', 4
FROM payment_methods pm WHERE pm.code = 'BRI_VA'
ON CONFLICT DO NOTHING;

-- BCA VA Instructions
INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT pm.id, 'Langkah 1', 'Buka aplikasi myBCA atau m-BCA', 1
FROM payment_methods pm WHERE pm.code = 'BCA_VA'
ON CONFLICT DO NOTHING;

INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT pm.id, 'Langkah 2', 'Pilih menu Transfer Dana > BCA Virtual Account', 2
FROM payment_methods pm WHERE pm.code = 'BCA_VA'
ON CONFLICT DO NOTHING;

INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT pm.id, 'Langkah 3', 'Masukkan nomor Virtual Account yang tertera', 3
FROM payment_methods pm WHERE pm.code = 'BCA_VA'
ON CONFLICT DO NOTHING;

INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT pm.id, 'Langkah 4', 'Periksa detail dan konfirmasi pembayaran', 4
FROM payment_methods pm WHERE pm.code = 'BCA_VA'
ON CONFLICT DO NOTHING;

-- Mandiri VA Instructions
INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT pm.id, 'Langkah 1', 'Buka aplikasi Livin by Mandiri', 1
FROM payment_methods pm WHERE pm.code = 'MANDIRI_VA'
ON CONFLICT DO NOTHING;

INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT pm.id, 'Langkah 2', 'Pilih Bayar > Multipayment', 2
FROM payment_methods pm WHERE pm.code = 'MANDIRI_VA'
ON CONFLICT DO NOTHING;

INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT pm.id, 'Langkah 3', 'Cari dan pilih Xendit, masukkan nomor Virtual Account', 3
FROM payment_methods pm WHERE pm.code = 'MANDIRI_VA'
ON CONFLICT DO NOTHING;

INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT pm.id, 'Langkah 4', 'Konfirmasi dan selesaikan pembayaran', 4
FROM payment_methods pm WHERE pm.code = 'MANDIRI_VA'
ON CONFLICT DO NOTHING;

-- BNI VA Instructions
INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT pm.id, 'Langkah 1', 'Buka aplikasi BNI Mobile Banking', 1
FROM payment_methods pm WHERE pm.code = 'BNI_VA'
ON CONFLICT DO NOTHING;

INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT pm.id, 'Langkah 2', 'Pilih Transfer > Virtual Account Billing', 2
FROM payment_methods pm WHERE pm.code = 'BNI_VA'
ON CONFLICT DO NOTHING;

INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT pm.id, 'Langkah 3', 'Masukkan nomor Virtual Account yang tertera', 3
FROM payment_methods pm WHERE pm.code = 'BNI_VA'
ON CONFLICT DO NOTHING;

INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT pm.id, 'Langkah 4', 'Periksa detail tagihan dan konfirmasi', 4
FROM payment_methods pm WHERE pm.code = 'BNI_VA'
ON CONFLICT DO NOTHING;

-- Verify
SELECT code, name, type, provider, is_active FROM payment_methods ORDER BY sort_order;

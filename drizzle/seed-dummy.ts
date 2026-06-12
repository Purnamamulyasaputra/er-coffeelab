import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function seedDummyData() {
  console.log("🌱 Memulai proses seeding data dummy komprehensif...");

  try {
    // 1. Ambil data master yang sudah ada untuk referensi foreign key
    const branches = await sql`SELECT id FROM branches ORDER BY id LIMIT 5`;
    const customers = await sql`SELECT id FROM customers ORDER BY id LIMIT 2`;
    const employees = await sql`SELECT id FROM employees ORDER BY id LIMIT 5`;
    const products = await sql`SELECT id FROM products ORDER BY id LIMIT 4`;
    const ingredients = await sql`SELECT id FROM ingredients ORDER BY id LIMIT 10`;
    const suppliers = await sql`SELECT id FROM suppliers ORDER BY id LIMIT 2`;
    const orders = await sql`SELECT id FROM orders ORDER BY id LIMIT 3`;
    const orderItems = await sql`SELECT id FROM order_items ORDER BY id LIMIT 5`;
    const paymentMethods = await sql`SELECT id FROM payment_methods ORDER BY id LIMIT 1`;
    const loyaltyTiers = await sql`SELECT id FROM loyalty_tiers ORDER BY id LIMIT 1`;
    const custoOpts = await sql`SELECT id, name FROM product_customization_options ORDER BY id LIMIT 3`;
    const custoGroups = await sql`SELECT id, name FROM product_customization_groups ORDER BY id LIMIT 2`;

    const b1 = branches[0]?.id;
    const c1 = customers[0]?.id, c2 = customers[1]?.id;
    const e1 = employees[0]?.id;
    const p1 = products[0]?.id, p2 = products[1]?.id;
    const s1 = suppliers[0]?.id;
    const o1 = orders[0]?.id;
    const oi1 = orderItems[0]?.id, oi2 = orderItems[1]?.id;
    const pm1 = paymentMethods[0]?.id;
    const opt1 = custoOpts[0];
    const grp1 = custoGroups[0];

    // Helpers
    const checkEmpty = async (table: string) => {
      const tpl = [`SELECT COUNT(*) as c FROM "${table}"`] as any;
      tpl.raw = tpl;
      const res = await sql(tpl);
      return Number(res[0].c) === 0;
    };

    // 1. notification_templates
    if (await checkEmpty('notification_templates')) {
      await sql`INSERT INTO notification_templates (event_trigger, channel, message_content, is_active) VALUES
        ('USER_REGISTERED', 'EMAIL', 'Halo {name}, selamat datang di ER COFFELAB! Nikmati kopi terbaik kami.', true),
        ('ORDER_CONFIRMED', 'PUSH', 'Pesanan #{order_id} dikonfirmasi. Estimasi selesai: {eta} menit.', true),
        ('PROMO_BLAST', 'PUSH', 'Promo spesial hari ini! Diskon 20% untuk semua menu kopi.', true),
        ('BIRTHDAY_REWARD', 'EMAIL', 'Selamat ulang tahun, {name}! Ada hadiah spesial untukmu.', true)`;
      console.log('✅ notification_templates');
    }

    // 2. static_pages
    if (await checkEmpty('static_pages')) {
      await sql`INSERT INTO static_pages (slug, title, content) VALUES
        ('about-us', 'Tentang Kami', 'ER COFFELAB adalah kedai kopi premium dengan 5 cabang. Berdiri sejak 2020, kami berkomitmen menyajikan kopi single origin terbaik Indonesia.'),
        ('faq', 'FAQ', 'Pertanyaan umum mengenai layanan ER COFFELAB. Termasuk cara order, metode pembayaran, dan kebijakan pengembalian.'),
        ('privacy-policy', 'Kebijakan Privasi', 'Data pribadi Anda dilindungi sesuai undang-undang perlindungan data yang berlaku di Indonesia.')`;
      console.log('✅ static_pages');
    }

    // 3. merchandise
    if (await checkEmpty('merchandise')) {
      await sql`INSERT INTO merchandise (name, description, image_url, price, personalizable, badge, status, sort_order) VALUES
        ('Mug ER COFFELAB 350ml', 'Mug keramik premium dengan logo', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400', 85000, false, 'BEST_SELLER', 'ACTIVE', 1),
        ('Tote Bag Canvas', 'Tas kanvas eksklusif desain', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 65000, true, null, 'ACTIVE', 2),
        ('Tumbler Stainless 500ml', 'Tumbler anti-tumpah 6 jam', 'https://images.unsplash.com/photo-1611270418597-a6c77f4b7271?w=400', 125000, false, 'NEW', 'ACTIVE', 3)`;
      console.log('✅ merchandise');
    }

    // 4. banners
    if (await checkEmpty('banners')) {
      await sql`INSERT INTO banners (title, image_url, link_destination, placement, sort_order, status, start_date, end_date) VALUES
        ('Promo Ramadan Spesial', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800', '/promo/ramadan', 'HOME_TOP', 1, 'ACTIVE', NOW(), NOW() + INTERVAL '30 days'),
        ('Menu Baru: Matcha Series', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800', '/menu', 'HOME_TOP', 2, 'ACTIVE', NOW(), NOW() + INTERVAL '60 days'),
        ('Weekend Special Buy 1 Get 1', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800', '/promo/weekend', 'HOME_MIDDLE', 3, 'ACTIVE', NOW(), NOW() + INTERVAL '14 days')`;
      console.log('✅ banners');
    }

    // 5. campaigns & 6. vouchers
    if (await checkEmpty('campaigns')) {
      const camp = await sql`INSERT INTO campaigns (name, description, image_url, status, start_date, end_date) VALUES
        ('Welcome Bonus', 'Bonus pelanggan baru', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 'ACTIVE', NOW() - INTERVAL '90 days', NOW() + INTERVAL '365 days'),
        ('Birthday Reward', 'Hadiah ulang tahun', 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400', 'ACTIVE', NOW() - INTERVAL '90 days', NOW() + INTERVAL '365 days') RETURNING id`;
      console.log('✅ campaigns');
      
      if (await checkEmpty('vouchers')) {
        await sql`INSERT INTO vouchers (campaign_id, code, discount_type, discount_value, max_discount, min_transaction, usage_quota, used_count, target_audience, status, start_date, end_date) VALUES
          (${camp[0]?.id}, 'WELCOME10', 'PERCENTAGE', 10, 15000, 20000, 100, 0, 'ALL', 'ACTIVE', NOW(), NOW() + INTERVAL '365 days'),
          (null, 'FLAT20K', 'FIXED', 20000, 20000, 50000, 50, 0, 'ALL', 'ACTIVE', NOW(), NOW() + INTERVAL '90 days')`;
        console.log('✅ vouchers');
      }
    }

    // 7. payment_instructions
    if (pm1 && await checkEmpty('payment_instructions')) {
      await sql`INSERT INTO payment_instructions (payment_method_id, title, content, sort_order) VALUES
        (${pm1}, 'Langkah 1', 'Scan QR Code yang ditampilkan kasir menggunakan aplikasi dompet digital Anda', 1),
        (${pm1}, 'Langkah 2', 'Masukkan nominal pembayaran sesuai total tagihan', 2),
        (${pm1}, 'Langkah 3', 'Konfirmasi pembayaran dan tunjukkan bukti transfer kepada kasir', 3)`;
      console.log('✅ payment_instructions');
    }

    // 8. branch_option_stock
    if (await checkEmpty('branch_option_stock') && custoOpts.length > 0) {
      for (const br of branches.slice(0, 3)) {
        for (const opt of custoOpts) {
          await sql`INSERT INTO branch_option_stock (branch_id, option_id, stock_status) VALUES (${br.id}, ${opt.id}, 'AVAILABLE')`;
        }
      }
      console.log('✅ branch_option_stock');
    }

    // 9. product_recipes
    if (await checkEmpty('product_recipes') && products.length > 0 && ingredients.length > 3) {
      const rows = [
        [p1, ingredients[0].id, 18, 'gram'],
        [p1, ingredients[1].id, 200, 'ml'],
        [p2 ?? p1, ingredients[0].id, 18, 'gram'],
        [p2 ?? p1, ingredients[3].id, 150, 'ml'],
      ];
      for (const [pid, iid, qty, unit] of rows) {
        await sql`INSERT INTO product_recipes (product_id, ingredient_id, quantity_used, unit) VALUES (${pid}, ${iid}, ${qty}, ${unit})`;
      }
      console.log('✅ product_recipes');
    }

    // 10. stock_movements
    if (await checkEmpty('stock_movements') && ingredients.length > 0) {
      for (let i = 0; i < Math.min(5, ingredients.length); i++) {
        const br = branches[i % branches.length];
        await sql`INSERT INTO stock_movements (branch_id, ingredient_id, type, quantity, unit, stock_before, stock_after, reference_type, notes, employee_id) VALUES 
          (${br.id}, ${ingredients[i].id}, 'IN', ${(i + 1) * 10}, 'kg', 0, ${(i + 1) * 10}, 'PURCHASE', 'Penerimaan stok awal', ${e1})`;
      }
      console.log('✅ stock_movements');
    }

    // 11. purchase_orders & 12. purchase_order_items
    let po1Id: any = null;
    if (await checkEmpty('purchase_orders') && s1 && b1) {
      const poRes = await sql`INSERT INTO purchase_orders (po_number, branch_id, supplier_id, status, total_amount, ordered_by, notes) VALUES
        ('PO-2026-001', ${b1}, ${s1}, 'RECEIVED', 1500000, ${e1 ?? 1}, 'Pembelian bahan baku bulanan'),
        ('PO-2026-002', ${b1}, ${s1}, 'ORDERED', 750000, ${e1 ?? 1}, 'Pembelian kopi arabika tambahan')
        RETURNING id`;
      po1Id = poRes[0]?.id;
      console.log('✅ purchase_orders');

      if (await checkEmpty('purchase_order_items') && po1Id && ingredients.length > 1) {
        await sql`INSERT INTO purchase_order_items (purchase_order_id, ingredient_id, quantity_ordered, quantity_received, unit, unit_price, subtotal) VALUES
          (${po1Id}, ${ingredients[0].id}, 10, 10, 'kg', 150000, 1500000),
          (${po1Id}, ${ingredients[1].id}, 5, 5, 'kg', 150000, 750000)`;
        console.log('✅ purchase_order_items');
      }
    }

    // 13. stock_opnames & 14. stock_opname_items
    if (await checkEmpty('stock_opnames') && b1 && e1) {
      const soRes = await sql`INSERT INTO stock_opnames (branch_id, employee_id, status, notes) VALUES 
        (${b1}, ${e1}, 'COMPLETED', 'Opname bulanan Juni 2026') RETURNING id`;
      console.log('✅ stock_opnames');

      if (await checkEmpty('stock_opname_items') && ingredients.length > 0) {
        const so1Id = soRes[0]?.id;
        for (let i = 0; i < Math.min(5, ingredients.length); i++) {
          const sys = (i + 1) * 5;
          const act = sys - (i % 2);
          await sql`INSERT INTO stock_opname_items (stock_opname_id, ingredient_id, system_stock, actual_stock, difference, unit, notes) VALUES 
            (${so1Id}, ${ingredients[i].id}, ${sys}, ${act}, ${act - sys}, 'kg', '')`;
        }
        console.log('✅ stock_opname_items');
      }
    }

    // 15. carts, 16. cart_items, 17. cart_item_options
    if (await checkEmpty('carts') && c1 && b1) {
      const cartRes = await sql`INSERT INTO carts (customer_id, branch_id) VALUES (${c1}, ${b1}) RETURNING id`;
      const cart1Id = cartRes[0]?.id;
      console.log('✅ carts');

      if (await checkEmpty('cart_items') && p1) {
        const ciRes = await sql`INSERT INTO cart_items (cart_id, product_id, quantity, unit_price, notes) VALUES 
          (${cart1Id}, ${p1}, 2, 25000, 'Kurangi gula') RETURNING id`;
        const ci1Id = ciRes[0]?.id;
        console.log('✅ cart_items');

        if (await checkEmpty('cart_item_options') && opt1) {
          await sql`INSERT INTO cart_item_options (cart_item_id, option_id, additional_price) VALUES (${ci1Id}, ${opt1.id}, 5000)`;
          console.log('✅ cart_item_options');
        }
      }
    }

    // 18. customer_favorites
    if (await checkEmpty('customer_favorites') && c1 && products.length > 0) {
      for (const pr of products.slice(0, 3)) {
        await sql`INSERT INTO customer_favorites (customer_id, product_id) VALUES (${c1}, ${pr.id})`;
      }
      console.log('✅ customer_favorites');
    }

    // 19. daily_checkins
    if (await checkEmpty('daily_checkins') && c1) {
      for (let i = 0; i < 5; i++) {
        await sql`INSERT INTO daily_checkins (customer_id, day_sequence, points_awarded, checkin_date) VALUES 
          (${i % 2 === 0 ? c1 : (c2 ?? c1)}, ${(i % 7) + 1}, 10, CURRENT_DATE - INTERVAL '${i} days')`;
      }
      console.log('✅ daily_checkins');
    }

    // 20. employee_attendances
    if (await checkEmpty('employee_attendances') && employees.length > 0 && branches.length > 0) {
      for (let i = 0; i < 5; i++) {
        const emp = employees[i % employees.length];
        const br = branches[i % branches.length];
        await sql`INSERT INTO employee_attendances (employee_id, branch_id, clock_in, clock_out, total_hours, notes) VALUES 
          (${emp.id}, ${br.id}, NOW()-INTERVAL '${i+1} days 8 hours', NOW()-INTERVAL '${i+1} days', 8.0, 'Hadir tepat waktu')`;
      }
      console.log('✅ employee_attendances');
    }

    // 21. loyalty_transactions
    if (await checkEmpty('loyalty_transactions') && c1) {
      await sql`INSERT INTO loyalty_transactions (customer_id, order_id, type, points, balance_after, description) VALUES 
        (${c1}, ${o1 ?? null}, 'EARN', 50, 50, 'Poin dari pembelian order pertama'),
        (${c1}, null, 'EARN', 20, 70, 'Bonus daily check-in'),
        (${c2 ?? c1}, null, 'EARN', 100, 100, 'Welcome bonus member baru')`;
      console.log('✅ loyalty_transactions');
    }

    // 22. order_item_options
    if (await checkEmpty('order_item_options') && oi1 && opt1) {
      const groupName = grp1?.name ?? 'Ukuran';
      await sql`INSERT INTO order_item_options (order_item_id, option_id, option_group_name, option_name, additional_price) VALUES 
        (${oi1}, ${opt1.id}, ${groupName}, ${opt1.name}, 5000)`;
      console.log('✅ order_item_options');
    }

    // 23. refunds
    if (await checkEmpty('refunds') && o1) {
      const shift = await sql`SELECT id FROM shifts LIMIT 1`;
      await sql`INSERT INTO refunds (order_id, shift_id, refund_type, refund_amount, reason, refund_method, approved_by, employee_id, status) VALUES 
        (${o1}, ${shift[0]?.id ?? null}, 'PARTIAL', 25000, 'Produk tidak sesuai pesanan', 'CASH', 1, ${e1 ?? 1}, 'APPROVED')`;
      console.log('✅ refunds');
    }

    // 24. voucher_redemptions
    if (await checkEmpty('voucher_redemptions') && o1 && c1) {
      const vList = await sql`SELECT id FROM vouchers LIMIT 1`;
      if (vList.length > 0) {
        await sql`INSERT INTO voucher_redemptions (voucher_id, customer_id, order_id, discount_applied) VALUES 
          (${vList[0].id}, ${c1}, ${o1}, 15000)`;
        console.log('✅ voucher_redemptions');
      }
    }

    // 25. notification_logs
    if (await checkEmpty('notification_logs') && c1) {
      const templates = await sql`SELECT id FROM notification_templates LIMIT 1`;
      const tmpl = templates[0]?.id ?? null;
      await sql`INSERT INTO notification_logs (template_id, invoice_code, recipient, channel, request_payload, response_payload, status) VALUES 
        (${tmpl}, null, 'customer@er-coffelab.com', 'EMAIL', '{}', '{}', 'SENT')`;
      console.log('✅ notification_logs');
    }

    console.log("\n🎉 Seeding data dummy selesai! Anda bisa menjalankan script ini kapan saja tanpa error.");
  } catch (error: any) {
    console.error("❌ Terjadi kesalahan saat seeding data dummy:", error.message);
  }
}

seedDummyData();

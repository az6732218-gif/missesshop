// Misses Styles — متجر + لوحة تحكم كاملة. بدون مكتبات خارجية (Node 22.5+)
const http = require("node:http"), fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");
const E = process.env, PUB = path.join(__dirname, "public"), UP = E.UPLOAD_DIR || path.join(PUB, "uploads");
fs.mkdirSync(UP, { recursive: true });
const db = new DatabaseSync(E.DB_FILE || path.join(__dirname, "shop.db"));
db.exec(`
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,price INTEGER NOT NULL,discount INTEGER DEFAULT 0,category TEXT NOT NULL,img TEXT NOT NULL,sizes TEXT DEFAULT '',colors TEXT DEFAULT '',active INTEGER DEFAULT 1,soldout INTEGER DEFAULT 0,season TEXT DEFAULT '',badge TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT,created TEXT DEFAULT CURRENT_TIMESTAMP,name TEXT,phone TEXT,governorate TEXT,address TEXT,notes TEXT,payment TEXT,ref TEXT,items TEXT,subtotal INTEGER,coupon TEXT DEFAULT '',discount INTEGER DEFAULT 0,shipping INTEGER,total INTEGER,status TEXT DEFAULT 'جديد',note TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY,v TEXT);
CREATE TABLE IF NOT EXISTS offers(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT,category TEXT DEFAULT '',percent INTEGER,ends TEXT DEFAULT '',active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS coupons(code TEXT PRIMARY KEY,percent INTEGER,active INTEGER DEFAULT 1);`);
try { db.exec("ALTER TABLE products ADD COLUMN season TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE products ADD COLUMN badge TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN note TEXT DEFAULT ''"); } catch {}
if (!db.prepare("SELECT COUNT(*) c FROM products").get().c) {
  const ins = db.prepare("INSERT INTO products(name,price,category,img,sizes,colors,season) VALUES(?,?,?,?,?,?,?)"), L = "S,M,L,XL", N = "38,40,42,44";
  [["فستان سهرة",850,"فساتين",L,"وردي,أسود",""],["فستان كاجوال صيفي",420,"فساتين",L,"بيج,أبيض","summer"],["بلوزة قطن",250,"بلوزات",L,"أبيض,وردي","summer"],["بلوزة ستان",310,"بلوزات",L,"عنابي,بيج",""],["بنطلون كلاسيك",480,"بناطيل",N,"بني,أسود","winter"],["بنطلون واسع كتان",390,"بناطيل",N,"بيج","summer"],["إيشارب صوف",150,"إكسسوارات","","وردي,رمادي","winter"],["شنطة يد",600,"إكسسوارات","","بني",""],["كارديجان صوف",520,"جاكيتات",L,"بيج,رمادي","winter"],["بالطو شتوي",1200,"جاكيتات",L,"بني,أسود","winter"]]
    .forEach((p, i) => ins.run(p[0], p[1], p[2], `images/p${i + 1}.svg`, p[3], p[4], p[5]));
}
// [المفتاح، الوصف، النوع، المجموعة، الافتراضي]
const SCHEMA = [
  ["brand_name", "اسم الموقع (عنوان التبويب)", "text", "النصوص", "Misses Styles | ملابس حريمي"],
  ["announcement", "شريط إعلان أعلى الموقع (فاضي = مخفي)", "text", "النصوص", ""],
  ["hero_tag", "الجملة تحت اللوجو في الصفحة الرئيسية", "text", "النصوص", "Fashion that makes you shine"],
  ["hero_button", "كلمة زرار الصفحة الرئيسية", "text", "النصوص", "تسوقي الآن"],
  ["shop_title", "عنوان قسم المنتجات", "text", "النصوص", "منتجاتنا"],
  ["shop_sub", "العنوان الفرعي للمنتجات", "text", "النصوص", "اختاري اللي يناسبك"],
  ["about_title", "عنوان قسم عن البراند", "text", "النصوص", "عن Misses Styles"],
  ["about_text", "نص عن البراند", "area", "النصوص", "Misses Styles براند ملابس حريمي هدفه إنك تبقي دايمًا مميزة. بنختار خاماتنا بعناية وتصميماتنا بتجمع بين الشياكة والراحة، من الكاجوال لحد السهرة."],
  ["footer_title", "عنوان الفوتر", "text", "النصوص", "Thank You ♥"],
  ["footer_text", "نص الفوتر", "text", "النصوص", "for your purchase — © 2026 Misses Styles"],
  ["logo", "اللوجو", "img", "الصور والفيديو", "images/logo.png"],
  ["hero_video", "فيديو الصفحة الرئيسية (mp4 — فاضي = بدون فيديو)", "video", "الصور والفيديو", "media/hero.mp4"],
  ["hero_poster", "صورة تظهر قبل تحميل الفيديو (اختياري)", "img0", "الصور والفيديو", "media/poster.jpg"],
  ["hero_logo_white", "اللوجو أبيض فوق الفيديو؟", "bool", "الصور والفيديو", "1"],
  ["hero_overlay", "تعتيم الفيديو من 0 لـ 60 (عشان اللوجو يبان)", "pct", "الصور والفيديو", "20"],
  ["seasons_title", "عنوان قسم المواسم", "text", "ركن الصيف والشتاء", "تسوقي حسب الموسم"],
  ["seasons_sub", "العنوان الفرعي للمواسم", "text", "ركن الصيف والشتاء", "كوليكشن لكل جو"],
  ["summer_title", "عنوان ركن الصيف", "text", "ركن الصيف والشتاء", "ركن الصيف"],
  ["summer_sub", "وصف ركن الصيف", "text", "ركن الصيف والشتاء", "خفيفة وبألوان مبهجة للأيام الحلوة"],
  ["summer_image", "صورة ركن الصيف (اختياري)", "img0", "ركن الصيف والشتاء", ""],
  ["winter_title", "عنوان ركن الشتاء", "text", "ركن الصيف والشتاء", "ركن الشتاء"],
  ["winter_sub", "وصف ركن الشتاء", "text", "ركن الصيف والشتاء", "دفا وأناقة لأيام البرد"],
  ["winter_image", "صورة ركن الشتاء (اختياري)", "img0", "ركن الصيف والشتاء", ""],
  ["since_badge", "الشارة (مثلًا: منذ 2018)", "text", 'قسم "منذ 2018"', "منذ 2018"],
  ["since_title", "العنوان", "text", 'قسم "منذ 2018"', "من 2018 ونحن بنهتم بأناقتك وراحتك"],
  ["since_text", "النص", "area", 'قسم "منذ 2018"', "بدأنا Misses Styles سنة 2018 بحلم بسيط: إن كل ست تلاقي لبسها المميز وتحس بالراحة فيه. ومن يومها ونحن في خدمة عميلاتنا، بنختار كل قطعة بعناية وبنهتم بأدق التفاصيل عشان تطلعي بإطلالة تشبهك، من أول ما تطلبي لحد ما توصلك."],
  ["v1_title", "الميزة 1 — العنوان", "text", 'قسم "منذ 2018"', "أناقة"],
  ["v1_text", "الميزة 1 — الوصف", "text", 'قسم "منذ 2018"', "موديلات مختارة بعناية بتواكب الموضة وتناسب كل مناسبة."],
  ["v2_title", "الميزة 2 — العنوان", "text", 'قسم "منذ 2018"', "راحة"],
  ["v2_text", "الميزة 2 — الوصف", "text", 'قسم "منذ 2018"', "خامات مريحة وقصّات مظبوطة تفضلي لابساها طول اليوم."],
  ["v3_title", "الميزة 3 — العنوان", "text", 'قسم "منذ 2018"', "خدمة تفرق"],
  ["v3_text", "الميزة 3 — الوصف", "text", 'قسم "منذ 2018"', "بنتابع معاكي خطوة بخطوة وبنرد على استفساراتك على واتساب."],
  ["contact_title", "عنوان قسم التواصل", "text", "النصوص", "تواصل معنا"],
  ["contact_sub", "العنوان الفرعي للتواصل", "text", "النصوص", "يسعدنا خدمتك"],
  ["no_offer_text", "رسالة لما مفيش عروض (فاضي = مخفية) مثلًا: مفيش خصومات دلوقتي", "text", "العروض", ""],
  ["show_since", "إظهار قسم \"منذ 2018\"", "bool", "إظهار وإخفاء الأقسام", "1"],
  ["show_seasons", "إظهار ركن الصيف والشتاء", "bool", "إظهار وإخفاء الأقسام", "1"],
  ["show_about", "إظهار قسم عن البراند", "bool", "إظهار وإخفاء الأقسام", "1"],
  ["pay_cod_on", "تفعيل الدفع عند الاستلام", "bool", "طرق الدفع", "1"],
  ["pay_vodafone_on", "تفعيل فودافون كاش", "bool", "طرق الدفع", "1"],
  ["pay_instapay_on", "تفعيل إنستا باي", "bool", "طرق الدفع", "1"],
  ["pay_note", "ملاحظة تظهر تحت طرق الدفع (اختياري)", "text", "طرق الدفع", ""],
  ["whatsapp", "رقم الواتساب (بكود الدولة 20...)", "text", "التواصل", E.WHATSAPP || "201200442226"],
  ["phone", "رقم التليفون", "text", "التواصل", "050-3505222"],
  ["instagram", "يوزر انستجرام", "text", "التواصل", "_miss_es1"],
  ["facebook_name", "اسم صفحة فيسبوك", "text", "التواصل", "Misses Styles"],
  ["facebook_url", "لينك فيسبوك (https://...)", "url", "التواصل", "https://www.facebook.com/share/1A2AaF62R8/"],
  ["vodafone", "رقم فودافون كاش", "text", "الدفع والشحن", E.VODAFONE_CASH_NUMBER || "01XXXXXXXXX"],
  ["instapay", "عنوان إنستا باي", "text", "الدفع والشحن", E.INSTAPAY_ADDRESS || "yourname@instapay"],
  ["shipping_fee", "مصاريف الشحن (جنيه)", "num", "الدفع والشحن", E.SHIPPING_FEE || "0"],
  ["free_shipping_over", "شحن مجاني لو الطلب أكبر من (0 = غير مفعّل)", "num", "الدفع والشحن", "0"],
  ["accent", "اللون الأساسي (الأزرار)", "color", "الألوان", "#9c6265"],
  ["soft", "لون الخلفيات الفاتحة", "color", "الألوان", "#f8e5df"],
  ["bg", "لون خلفية الموقع", "color", "الألوان", "#fbf5f7"],
  ["text", "لون النصوص", "color", "الألوان", "#53413d"],
  ["band", "لون الفوتر", "color", "الألوان", "#dfaaa6"],
];
const KINDS = { text: 160, area: 600, img: 300, img0: 300, video: 300, url: 300, num: 8, pct: 3, bool: 1, color: 7 };
const okVal = (t, v) => ({ color: /^#[0-9a-f]{6}$/i, num: /^\d{1,6}$/, pct: /^(100|[1-9]?\d)$/, bool: /^[01]$/ }[t]?.test(v)) ?? (t === "img" ? /^(images|media|uploads)\/[\w.\-]+$/.test(v) || /^https:\/\/\S+$/.test(v) : t === "img0" ? v === "" || /^(images|media|uploads)\/[\w.\-]+$/.test(v) || /^https:\/\/\S+$/.test(v) : t === "video" ? v === "" || /^(media|uploads)\/[\w.\-]+\.(mp4|webm)$/.test(v) : t === "url" ? v === "" || /^https:\/\/\S+$/.test(v) : true);
const site = () => { const o = {}; for (const s of SCHEMA) o[s[0]] = s[4]; for (const r of db.prepare("SELECT k,v FROM settings").all()) if (r.k in o) o[r.k] = r.v; return o; };
const setKV = db.prepare("INSERT INTO settings(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v");
const getKV = k => db.prepare("SELECT v FROM settings WHERE k=?").get(k)?.v;
const STATUSES = ["جديد", "تم التحويل", "قيد التجهيز", "تم الشحن", "تم التسليم", "ملغي"];
const PAYMENTS = { cod: "الدفع عند الاستلام", vodafone: "فودافون كاش", instapay: "إنستا باي" };
const sessions = new Map(), hits = new Map();
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".mp4": "video/mp4", ".webm": "video/webm" };

const clientIp = req => (E.TRUST_PROXY && (req.headers["x-forwarded-for"] || "").split(",")[0].trim()) || req.socket.remoteAddress;
const send = (res, code, data) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(data)); };
const body = (req, max = 50000) => new Promise((ok, no) => { let b = ""; req.on("data", c => { b += c; if (b.length > max) { no(new Error("big")); req.destroy(); } }); req.on("end", () => { try { ok(JSON.parse(b || "{}")); } catch { no(new Error("bad json")); } }); });
const raw = (req, max) => new Promise((ok, no) => { const c = []; let n = 0; req.on("data", d => { n += d.length; if (n > max) { no(new Error("big")); req.destroy(); } else c.push(d); }); req.on("end", () => ok(Buffer.concat(c))); req.on("error", no); });
const clean = (v, n) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
const lst = (v, n, m) => [...new Set(String(v || "").split(/[,،]/).map(x => clean(x, m).replace(/\|/g, "/")).filter(Boolean))].slice(0, n).join(",");
const hash = s => crypto.createHash("sha256").update(s).digest();
const safeEq = (a, b) => crypto.timingSafeEqual(hash(a), hash(b));
const mkHash = p => { const s = crypto.randomBytes(16).toString("hex"); return s + ":" + crypto.scryptSync(p, s, 32).toString("hex"); };
const passOk = p => { const [s, x] = getKV("admin_hash").split(":"); return crypto.timingSafeEqual(crypto.scryptSync(p, s, 32), Buffer.from(x, "hex")); };
const ADMIN_PATH = "/" + (E.ADMIN_PATH || "admin").replace(/[^\w-]/g, "");
{
  const hadHash = !!getKV("admin_hash"), hadUser = !!getKV("admin_user"), reset = !!(E.RESET_ADMIN_PASSWORD && E.ADMIN_PASSWORD);
  if (!hadHash || !hadUser || reset) {
    const user = E.ADMIN_USER || getKV("admin_user") || "AHMED";
    setKV.run("admin_user", user);
    let pw = E.ADMIN_PASSWORD, gen = false;
    if (!hadHash || reset) { if (!pw) { pw = crypto.randomBytes(9).toString("base64url"); gen = true; } setKV.run("admin_hash", mkHash(pw)); }
    console.log(`\n>>> بيانات دخول لوحة التحكم — اليوزر: ${user}${gen ? "  |  الباسورد: " + pw : ""}\n>>> غيّريهم من تبويب الأمان بعد أول دخول، وما تبعتيهمش لحد.\n`);
  }
}
const isAdmin = req => (sessions.get((req.headers.authorization || "").replace("Bearer ", "")) || 0) > Date.now();
const limited = (ip, key, max, ms) => { const k = key + ip, now = Date.now(), a = (hits.get(k) || []).filter(t => now - t < ms); a.push(now); hits.set(k, a); return a.length > max; };
const shipFor = (s, sub) => { const f = +s.shipping_fee || 0, o = +s.free_shipping_over || 0; return o > 0 && sub >= o ? 0 : f; };
const offersNow = () => { const t = new Date().toISOString().slice(0, 10); return db.prepare("SELECT * FROM offers WHERE active=1").all().filter(o => !o.ends || o.ends >= t); };
const discOf = (p, offs) => Math.max(p.discount || 0, ...offs.filter(o => !o.category || o.category === p.category).map(o => o.percent));
const priceOf = (p, d) => Math.round(p.price * (100 - d) / 100);
const pub = (p, offs) => { const d = discOf(p, offs); return { id: p.id, name: p.name, price: priceOf(p, d), old_price: d > 0 ? p.price : 0, discount: d, category: p.category, img: p.img, sizes: p.sizes ? p.sizes.split(",") : [], colors: p.colors ? p.colors.split(",") : [], soldout: !!p.soldout, season: p.season || "", badge: p.badge || "" }; };
const magic = (b, kind) => kind === "video" ? (b.slice(4, 8).toString() === "ftyp" ? ".mp4" : b.readUInt32BE(0) === 0x1a45dfa3 ? ".webm" : null) : b[0] === 0x89 && b[1] === 0x50 ? ".png" : b[0] === 0xff && b[1] === 0xd8 ? ".jpg" : b.slice(0, 4).toString() === "RIFF" && b.slice(8, 12).toString() === "WEBP" ? ".webp" : null;
const prod = async req => {
  const b = await body(req), name = clean(b.name, 80), cat = clean(b.category, 40), price = parseInt(b.price), disc = parseInt(b.discount) || 0, img = clean(b.img, 300);
  if (!name || !cat || !(price > 0) || disc < 0 || disc > 95 || !okVal("img", img) || !["", "summer", "winter"].includes(b.season || "")) return null;
  return [name, price, disc, cat, img, lst(b.sizes, 12, 12), lst(b.colors, 12, 20), b.active === false ? 0 : 1, b.soldout ? 1 : 0, b.season || "", clean(b.badge, 20)];
};
const COLS = "name=?,price=?,discount=?,category=?,img=?,sizes=?,colors=?,active=?,soldout=?,season=?,badge=?";

async function api(req, res, url) {
  const ip = clientIp(req), m = req.method, p = url.pathname;
  if (p.startsWith("/api/admin/")) res.setHeader("Cache-Control", "no-store");
  if (m === "GET" && p === "/api/products") { const o = offersNow(); return send(res, 200, db.prepare("SELECT * FROM products WHERE active=1 ORDER BY id").all().map(x => pub(x, o))); }
  if (m === "GET" && p === "/api/site") return send(res, 200, { ...site(), offers: offersNow().map(o => ({ title: o.title, category: o.category, percent: o.percent })) });
  if (m === "POST" && p === "/api/coupon") {
    if (limited(ip, "cp", 20, 600000)) return send(res, 429, { error: "محاولات كتير" });
    const c = db.prepare("SELECT percent FROM coupons WHERE code=? AND active=1").get(clean((await body(req)).code, 30).toUpperCase());
    return c ? send(res, 200, { percent: c.percent }) : send(res, 404, { error: "كود الخصم غير صحيح" });
  }
  if (m === "POST" && p === "/api/orders") {
    if (limited(ip, "ord", 5, 600000)) return send(res, 429, { error: "محاولات كتير، جربي بعد شوية" });
    const b = await body(req), name = clean(b.name, 80), phone = clean(b.phone, 20), gov = clean(b.governorate, 40), address = clean(b.address, 300), s = site();
    if (!name || !/^[0-9+\s-]{8,16}$/.test(phone) || !gov || address.length < 6) return send(res, 400, { error: "من فضلك أكملي البيانات بشكل صحيح" });
    if (!PAYMENTS[b.payment] || s["pay_" + b.payment + "_on"] === "0") return send(res, 400, { error: "اختاري طريقة دفع" });
    const ref = clean(b.ref, 60);
    if (b.payment !== "cod" && ref.length < 4) return send(res, 400, { error: "اكتبي رقم التحويل أو الرقم اللي حولتي منه" });
    const offs = offersNow(), get = db.prepare("SELECT * FROM products WHERE id=? AND active=1 AND soldout=0"), items = []; let sub = 0;
    for (const it of Array.isArray(b.items) ? b.items.slice(0, 50) : []) {
      const pr = get.get(Number(it.id)), q = Math.min(Math.max(parseInt(it.qty) || 0, 0), 20); if (!pr || !q) continue;
      const sz = pr.sizes ? pr.sizes.split(",") : [], cl = pr.colors ? pr.colors.split(",") : [], size = clean(it.size, 12), color = clean(it.color, 20);
      if ((sz.length ? !sz.includes(size) : size) || (cl.length ? !cl.includes(color) : color)) return send(res, 400, { error: `المقاس أو اللون غير متاح: ${pr.name}` });
      const price = priceOf(pr, discOf(pr, offs)); items.push({ id: pr.id, name: pr.name, price, qty: q, size, color }); sub += price * q;
    }
    if (!items.length) return send(res, 400, { error: "السلة فاضية أو المنتجات غير متاحة" });
    let cp = null; if (b.coupon) { cp = db.prepare("SELECT * FROM coupons WHERE code=? AND active=1").get(clean(b.coupon, 30).toUpperCase()); if (!cp) return send(res, 400, { error: "كود الخصم غير صحيح" }); }
    const dsc = cp ? Math.round(sub * cp.percent / 100) : 0, ship = shipFor(s, sub - dsc), total = sub - dsc + ship;
    const r = db.prepare("INSERT INTO orders(name,phone,governorate,address,notes,payment,ref,items,subtotal,coupon,discount,shipping,total) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)").run(name, phone, gov, address, clean(b.notes, 300), b.payment, ref, JSON.stringify(items), sub, cp ? cp.code : "", dsc, ship, total);
    return send(res, 201, { id: Number(r.lastInsertRowid), total, items, payment: PAYMENTS[b.payment] });
  }
  if (m === "POST" && p === "/api/admin/login") {
    if (limited("", "loginAll", 30, 600000) || limited(ip, "login", 8, 600000)) return send(res, 429, { error: "محاولات كتير" });
    const lb = await body(req), uOk = safeEq(String(lb.username || "").trim().toLowerCase(), String(getKV("admin_user")).toLowerCase()), pOk = passOk(String(lb.password || ""));
    if (!(uOk && pOk)) { await new Promise(x => setTimeout(x, 700)); return send(res, 401, { error: "اليوزر أو الباسورد غلط" }); }
    const t = crypto.randomBytes(24).toString("hex"); sessions.set(t, Date.now() + 8 * 3600e3); return send(res, 200, { token: t });
  }
  if (!p.startsWith("/api/admin/")) return send(res, 404, { error: "not found" });
  if (!isAdmin(req)) return send(res, 401, { error: "سجلي الدخول" });
  if (m === "POST" && p === "/api/admin/logout") { sessions.delete((req.headers.authorization || "").replace("Bearer ", "")); return send(res, 200, { ok: true }); }
  let mt;
  if (m === "GET" && p === "/api/admin/orders") return send(res, 200, { statuses: STATUSES, payments: PAYMENTS, orders: db.prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 500").all().map(o => ({ ...o, items: JSON.parse(o.items) })) });
  if ((mt = p.match(/^\/api\/admin\/orders\/(\d+)$/))) {
    if (m === "PATCH") {
      const b = await body(req), id = Number(mt[1]);
      if (b.status !== undefined) { if (!STATUSES.includes(b.status)) return send(res, 400, { error: "حالة غير صحيحة" }); db.prepare("UPDATE orders SET status=? WHERE id=?").run(b.status, id); }
      if (b.note !== undefined) db.prepare("UPDATE orders SET note=? WHERE id=?").run(clean(b.note, 300), id);
      return send(res, 200, { ok: true });
    }
    if (m === "DELETE") { db.prepare("DELETE FROM orders WHERE id=?").run(Number(mt[1])); return send(res, 200, { ok: true }); }
  }
  if (m === "GET" && p === "/api/admin/products") return send(res, 200, db.prepare("SELECT * FROM products ORDER BY id").all());
  if (m === "POST" && p === "/api/admin/products") { const v = await prod(req); if (!v) return send(res, 400, { error: "بيانات ناقصة أو غلط" }); db.prepare("INSERT INTO products(name,price,discount,category,img,sizes,colors,active,soldout,season,badge) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(...v); return send(res, 201, { ok: true }); }
  if ((mt = p.match(/^\/api\/admin\/products\/(\d+)$/))) {
    if (m === "PUT") { const v = await prod(req); if (!v) return send(res, 400, { error: "بيانات ناقصة أو غلط" }); db.prepare(`UPDATE products SET ${COLS} WHERE id=?`).run(...v, Number(mt[1])); return send(res, 200, { ok: true }); }
    if (m === "DELETE") { db.prepare("DELETE FROM products WHERE id=?").run(Number(mt[1])); return send(res, 200, { ok: true }); }
  }
  if (m === "GET" && p === "/api/admin/offers") return send(res, 200, { offers: db.prepare("SELECT * FROM offers ORDER BY id DESC").all(), coupons: db.prepare("SELECT * FROM coupons").all(), categories: db.prepare("SELECT DISTINCT category FROM products").all().map(r => r.category) });
  if (m === "POST" && p === "/api/admin/offers") {
    const b = await body(req), pc = parseInt(b.percent), ends = clean(b.ends, 10);
    if (!clean(b.title, 80) || !(pc > 0 && pc <= 95) || (ends && !/^\d{4}-\d{2}-\d{2}$/.test(ends))) return send(res, 400, { error: "بيانات العرض ناقصة أو غلط" });
    db.prepare("INSERT INTO offers(title,category,percent,ends) VALUES(?,?,?,?)").run(clean(b.title, 80), clean(b.category, 40), pc, ends); return send(res, 201, { ok: true });
  }
  if ((mt = p.match(/^\/api\/admin\/offers\/(\d+)$/))) {
    if (m === "PATCH") { db.prepare("UPDATE offers SET active=? WHERE id=?").run((await body(req)).active ? 1 : 0, Number(mt[1])); return send(res, 200, { ok: true }); }
    if (m === "DELETE") { db.prepare("DELETE FROM offers WHERE id=?").run(Number(mt[1])); return send(res, 200, { ok: true }); }
  }
  if (m === "POST" && p === "/api/admin/coupons") {
    const b = await body(req), code = clean(b.code, 20).toUpperCase(), pc = parseInt(b.percent);
    if (!/^[A-Z0-9_-]{3,20}$/.test(code) || !(pc > 0 && pc <= 95)) return send(res, 400, { error: "الكود حروف إنجليزي/أرقام (3 على الأقل) والنسبة من 1 لـ 95" });
    db.prepare("INSERT INTO coupons(code,percent) VALUES(?,?) ON CONFLICT(code) DO UPDATE SET percent=excluded.percent,active=1").run(code, pc); return send(res, 201, { ok: true });
  }
  if ((mt = p.match(/^\/api\/admin\/coupons\/([A-Za-z0-9_-]+)$/))) {
    if (m === "PATCH") { db.prepare("UPDATE coupons SET active=? WHERE code=?").run((await body(req)).active ? 1 : 0, mt[1]); return send(res, 200, { ok: true }); }
    if (m === "DELETE") { db.prepare("DELETE FROM coupons WHERE code=?").run(mt[1]); return send(res, 200, { ok: true }); }
  }
  if (m === "POST" && p === "/api/admin/bulk") {
    const b = await body(req), pc = Number(b.percent), cat = clean(b.category, 40), se = ["", "summer", "winter"].includes(b.season || "") ? (b.season || "") : null;
    if (se === null || !["price_pct", "discount_set", "discount_clear"].includes(b.action)) return send(res, 400, { error: "بيانات غير صحيحة" });
    const rows = db.prepare("SELECT id,price FROM products WHERE (?='' OR category=?) AND (?='' OR season=?)").all(cat, cat, se, se);
    if (b.action === "price_pct") { if (!pc || pc < -90 || pc > 300) return send(res, 400, { error: "النسبة من -90 لـ 300 (غير صفر)" }); const up = db.prepare("UPDATE products SET price=? WHERE id=?"); for (const x of rows) up.run(Math.max(1, Math.round(x.price * (100 + pc) / 100)), x.id); }
    else if (b.action === "discount_set") { if (!(pc > 0 && pc <= 95)) return send(res, 400, { error: "نسبة الخصم من 1 لـ 95" }); const up = db.prepare("UPDATE products SET discount=? WHERE id=?"); for (const x of rows) up.run(Math.round(pc), x.id); }
    else { const up = db.prepare("UPDATE products SET discount=0 WHERE id=?"); for (const x of rows) up.run(x.id); }
    return send(res, 200, { changed: rows.length });
  }
  if (m === "GET" && p === "/api/admin/settings") return send(res, 200, { schema: SCHEMA.map(s => s.slice(0, 4)), values: site() });
  if (m === "PUT" && p === "/api/admin/settings") {
    const b = (await body(req)).values || {}, bad = [];
    for (const [k, label, t] of SCHEMA) { if (!(k in b)) continue; const v = clean(b[k], KINDS[t]); if (okVal(t, v)) setKV.run(k, v); else bad.push(label); }
    return bad.length ? send(res, 400, { error: "قيم غير صحيحة: " + bad.join("، ") }) : send(res, 200, { ok: true });
  }
  if (m === "POST" && p === "/api/admin/upload") {
    const kind = url.searchParams.get("kind") === "video" ? "video" : "image";
    let buf; try { buf = await raw(req, kind === "video" ? 25e6 : 4e6); } catch { return send(res, 413, { error: kind === "video" ? "الفيديو أكبر من 25MB — صغّريه الأول" : "الصورة أكبر من 4MB" }); }
    const ext = buf.length > 12 && magic(buf, kind); if (!ext) return send(res, 400, { error: kind === "video" ? "الملف لازم mp4 أو webm" : "الصورة لازم png أو jpg أو webp" });
    const name = crypto.randomBytes(8).toString("hex") + ext; fs.writeFileSync(path.join(UP, name), buf); return send(res, 201, { path: "uploads/" + name });
  }
  if (m === "POST" && p === "/api/admin/password") {
    const b = await body(req), n = String(b.new || ""), un = String(b.username || "").trim();
    if (!passOk(String(b.current || ""))) return send(res, 401, { error: "الباسورد الحالي غلط" });
    if (!n && !un) return send(res, 400, { error: "اكتبي يوزر جديد أو باسورد جديد" });
    if (un && !/^[A-Za-z0-9_.-]{4,30}$/.test(un)) return send(res, 400, { error: "اليوزر من 4 لـ 30 حرف إنجليزي أو أرقام أو _ . -" });
    if (n && (n.length < 10 || n.toLowerCase() === (un || getKV("admin_user")).toLowerCase())) return send(res, 400, { error: "الباسورد لازم 10 حروف على الأقل ومش زي اليوزر" });
    if (un) setKV.run("admin_user", un); if (n) setKV.run("admin_hash", mkHash(n)); sessions.clear(); return send(res, 200, { ok: true });
  }
  send(res, 404, { error: "not found" });
}

http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("Referrer-Policy", "same-origin"); res.setHeader("X-Frame-Options", "SAMEORIGIN");
  try {
    const url = new URL(req.url, "http://x");
    if (url.pathname.startsWith("/api/")) return await api(req, res, url);
    let f = decodeURIComponent(url.pathname); if (f === "/") f = "/index.html"; if (f === ADMIN_PATH || f === ADMIN_PATH + "/") f = "/admin.html"; else if (f === "/admin.html") f = "/__none__";
    const file = f.startsWith("/uploads/") ? path.join(UP, path.basename(f)) : path.normalize(path.join(PUB, f));
    if ((!f.startsWith("/uploads/") && !file.startsWith(PUB + path.sep)) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end("Not found"); }
    const size = fs.statSync(file).size, h = { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Accept-Ranges": "bytes", "Cache-Control": f.startsWith("/uploads/") ? "public,max-age=31536000,immutable" : "no-cache", ...(f === "/admin.html" ? { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" } : {}) };
    const rg = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
    if (rg) { // دعم Range عشان الفيديو يشتغل على iPhone
      let s = rg[1] === "" ? Math.max(size - Number(rg[2]), 0) : Number(rg[1]), e = rg[1] === "" || rg[2] === "" ? size - 1 : Math.min(Number(rg[2]), size - 1);
      if (s > e || s >= size) { res.writeHead(416, { "Content-Range": `bytes */${size}` }); return res.end(); }
      res.writeHead(206, { ...h, "Content-Range": `bytes ${s}-${e}/${size}`, "Content-Length": e - s + 1 }); return fs.createReadStream(file, { start: s, end: e }).pipe(res);
    }
    res.writeHead(200, { ...h, "Content-Length": size }); fs.createReadStream(file).pipe(res);
  } catch (e) { if (!res.headersSent) send(res, 400, { error: "طلب غير صحيح" }); }
}).listen(E.PORT || 3000, () => console.log(`Misses Styles شغال على http://localhost:${E.PORT || 3000}  |  لوحة التحكم: ${ADMIN_PATH}`));

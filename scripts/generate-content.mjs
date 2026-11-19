/**
 * generate-content.mjs — deterministic content generator (§12).
 * Emits src/content/*.json. Hand-authored base data; deterministic fill.
 * Run: node scripts/generate-content.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'src', 'content');
mkdirSync(out, { recursive: true });

const G = ['A', 'B', 'C'];

/* ---------- shade palette ---------- */
const SHADES = [
  { ar: 'أزرق كحلي', en: 'Navy', hex: '#1E3050' },
  { ar: 'كريمي', en: 'Cream', hex: '#EDE6D9' },
  { ar: 'أسود', en: 'Black', hex: '#0C0B09' },
  { ar: 'أبيض', en: 'White', hex: '#F7F3EC' },
  { ar: 'ورد فاتح', en: 'Blush', hex: '#E8D5C4' },
  { ar: 'أخضر فاتح', en: 'Sage', hex: '#7A8A6B' },
  { ar: 'ترابي', en: 'Terracotta', hex: '#8C3B2E' },
  { ar: 'ذهبي', en: 'Gold', hex: '#C8A45C' },
  { ar: 'رمادي', en: 'Grey', hex: '#6E6A63' },
  { ar: 'عتم', en: 'Burgundy', hex: '#5B2333' },
  { ar: 'زيتوني', en: 'Olive', hex: '#6B7340' },
  { ar: 'تركوازي', en: 'Teal', hex: '#2F5D5E' },
  { ar: 'وردي', en: 'Rose', hex: '#C97B70' },
  { ar: 'إيكرو', en: 'Ecru', hex: '#D8C9A3' },
  { ar: 'أزرق غامق', en: 'Deep Blue', hex: '#27406B' },
  { ar: 'جملي', en: 'Camel', hex: '#B08D57' },
];

function pick(rnd, arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
  }
  return out;
}

/* mulberry32 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ---------- composition metadata ---------- */
const COMP = {
  'poly crepe': { gsm: 180, width: 150, construction: { ar: 'سُداة بسيطة · معاملة كريب', en: 'Plain weave · crepe-finished' }, water: 55, carbon: 6.5, cost: 55 },
  chiffon: { gsm: 62, width: 140, construction: { ar: 'سُداة بسيطة · خفيف', en: 'Plain weave · lightweight' }, water: 48, carbon: 5.2, cost: 62 },
  satin: { gsm: 120, width: 150, construction: { ar: 'سَتْن 4-نهايات', en: 'Satin weave · 4-end' }, water: 60, carbon: 7.1, cost: 70 },
  viscose: { gsm: 170, width: 150, construction: { ar: 'سُداة بسيطة/مُشْطَبة', en: 'Plain / twill weave' }, water: 78, carbon: 4.8, cost: 50 },
  'cotton voile': { gsm: 80, width: 140, construction: { ar: 'سُداة بسيطة · غازد', en: 'Plain weave · gassed' }, water: 85, carbon: 3.2, cost: 45 },
  'cotton lycra jersey': { gsm: 165, width: 160, construction: { ar: 'حياكة سَدى · 4 خيوط', en: 'Weft knit · 4-thread' }, water: 90, carbon: 3.8, cost: 48 },
  'single knit': { gsm: 150, width: 160, construction: { ar: 'حياكة سَدى أحادي', en: 'Weft knit · single' }, water: 88, carbon: 3.6, cost: 44 },
  scuba: { gsm: 220, width: 150, construction: { ar: 'حياكة مزدوج · سكبا', en: 'Double knit · scuba' }, water: 95, carbon: 5.0, cost: 58 },
  'viscose jersey': { gsm: 160, width: 160, construction: { ar: 'حياكة سَدى · فيسكوز', en: 'Weft knit · viscose' }, water: 80, carbon: 4.6, cost: 47 },
  'poly mesh': { gsm: 140, width: 160, construction: { ar: 'حياكة شبكي', en: 'Mesh knit' }, water: 60, carbon: 6.8, cost: 52 },
  'raschel lace': { gsm: 90, width: 145, construction: { ar: 'دانتيل رايشل · شِبَك أرضي', en: 'Raschel lace · ground net' }, water: 50, carbon: 6.0, cost: 68 },
  tulle: { gsm: 40, width: 150, construction: { ar: 'شبكة رايشل', en: 'Raschel net' }, water: 45, carbon: 5.5, cost: 40 },
  'linen blend': { gsm: 185, width: 140, construction: { ar: 'سُداة بسيطة · سلب', en: 'Plain weave · slub' }, water: 70, carbon: 3.0, cost: 54 },
  brocade: { gsm: 240, width: 140, construction: { ar: 'جاكاردا · أرضية سَتْن', en: 'Jacquard · satin ground' }, water: 88, carbon: 7.4, cost: 80 },
  cotton: { gsm: 120, width: 150, construction: { ar: 'سُداة بسيطة', en: 'Plain weave' }, water: 92, carbon: 3.4, cost: 42 },
  poly: { gsm: 150, width: 150, construction: { ar: 'سُداة بسيطة/مُشْطَبة', en: 'Plain / twill weave' }, water: 62, carbon: 6.9, cost: 46 },
};

/* ---------- 20 fabric groups × 3 grades = 60 ---------- */
// [slugBase, nameAr, nameEn, composition, category, finishAr, finishEn]
const GROUPS = [
  ["crepe-georgette","كريب جورجيت","Crepe Georgette","poly crepe","womens-apparel","صبغة قطعة","Piece dyed"],
  ["georgette-chiffon","جورجيت شيفون","Georgette Chiffon","chiffon","womens-apparel","صبغة قطعة","Piece dyed"],
  ["viscose-chiffon","شيفون فيسكوز","Viscose Chiffon","chiffon","womens-apparel","صبغة قطعة","Piece dyed"],
  ["silk-touch-satin","ساتان لمسة حرير","Silk-Touch Satin","satin","womens-apparel","صبغة قطعة","Piece dyed"],
  ["cotton-voile","فوال قطني","Cotton Voile","cotton voile","womens-apparel","أبيض مغازة","Gas-finished"],
  ["viscose-crepe","كريب فيسكوز","Viscose Crepe","viscose","womens-apparel","صبغة قطعة","Piece dyed"],
  ["printed-chiffon","شيفون مطبوع","Printed Chiffon","chiffon","womens-apparel","مطبوع","Printed"],
  ["jacquard-brocade","بروكايد جاكاردا","Jacquard Brocade","brocade","womens-apparel","مطرّز نسيجاً","Woven-figured"],
  ["cotton-poplin","بوبلين قطني","Cotton Poplin","cotton","shirting","مغازة","Gas-finished"],
  ["twill-shirting","تويل Shirting","Twill Shirting","poly","shirting","صبغة قطعة","Piece dyed"],
  ["cotton-lycra-jersey","جيرسي قطني لايكا","Cotton Lycra Jersey","cotton lycra jersey","jersey-knit","مغازة","Gas-finished"],
  ["scuba-knit","سكبا نت","Scuba Knit","scuba","jersey-knit","صبغة قطعة","Piece dyed"],
  ["french-lace","دانتيل فرنسي","French Lace","raschel lace","lace-tulle","أرضية مفتوحة","Open ground"],
  ["tulle-net","تول شبكة","Tulle Net","tulle","lace-tulle","مغازة","Gas-finished"],
  ["linen-blend","خلطة كتان","Linen Blend","linen blend","home-textiles","صبغة قطعة","Piece dyed"],
  ["curtain-crepe","كريب ستائر","Curtain Crepe","poly crepe","home-textiles","صبغة قطعة","Piece dyed"],
  ["twill-lining","بطانة تويل","Twill Lining","viscose","linings","نصف لمعة","Semi-lustre"],
  ["satin-lining","بطانة ساتان","Satin Lining","satin","linings","لمعة","Lustre"],
  ["surplus-chiffon","شيفون مخزون زائد","Surplus Chiffon","chiffon","surplus","صبغة قطعة","Piece dyed"],
  ["clearance-satin","ساتان تصفية","Clearance Satin","satin","surplus","صبغة قطعة","Piece dyed"]
];

/* grade assignment per group: which grades exist. Most groups carry all
 * three; surplus groups carry B+C (short lots) etc. We assign per group
 * with an explicit pattern to hit 20/20/20 exactly. */
const GRADE_NOTES = {
  A: {
    ar: [
      'درجة أولى: صبغة متوحدة وعرض كامل',
      'مافيش عيوب ظاهرة تحت ضوء المعرض',
      'مناسب لل export والإنتاج الراقي',
      'السعر في الفئة العليا ويستاهل الجودة',
    ],
    en: [
      'First quality: consistent dye lot, full width',
      'No visible defects under gallery light',
      'Suited to export and premium production',
      'Premium price band — the quality earns it',
    ],
  },
  B: {
    ar: [
      'اختلاف خفيف في الصبغة أو السداة',
      'اليد سليمة والأمتار المستخدمة كاملة',
      'مناسب للسوق المحلي والإنتاج السعري',
      'السعر في الفئة الوسطى',
    ],
    en: [
      'Minor dye or weaving variation',
      'Sound hand, full usable metres',
      'Domestic market and price-driven production',
      'Mid price band',
    ],
  },
  C: {
    ar: [
      'عيوب ظاهرة أو أطوال قصيرة',
      'متاح بالبالة والكميات الكبيرة',
      'مناسب للتصفية والاستخدام الرخيص',
      'السعر في فئة القيمة — يستاهل الكميات',
    ],
    en: [
      'Visible defects or short lengths',
      'Available in bulk and by the lot',
      'Clearance and budget use',
      'Value price band — the quantity earns it',
    ],
  },
};

/* photo assignment: first 5 fabrics of each grade get real photos (§21.1
 * twelve best sellers + gallery get real photography). */
const photos = [];
for (let g = 0; g < 3; g++) {
  for (let n = 1; n <= 5; n++) photos.push(`fabric-photo-${String(g * 5 + n).padStart(2, "0")}.jpg`);
}
let photoIdx = 0;

const fabrics = [];
const photoSet = new Set();
for (let i = 0; i < GROUPS.length; i++) {
  const [slugBase, nameAr, nameEn, comp, category, finishAr, finishEn] = GROUPS[i];
  const meta = COMP[comp];
  const grades = ["A", "B", "C"];
  for (const grade of grades) {
    const seed = hash(`${slugBase}-${grade}`);
    const rnd = mulberry32(seed);
    const slug = `${slugBase}-${grade.toLowerCase()}`;
    const code = `AZT-${String(fabrics.length + 1).padStart(3, '0')}`;
    const lotId = `LT-${String(i + 1).padStart(2, '0')}-${grade}`;
    const shadeChoices = pick(rnd, SHADES, 2 + Math.floor(rnd() * 2));
    const gsm = Math.round(meta.gsm * (grade === 'B' ? 1.04 : grade === 'C' ? 0.9 : 1));
    const priceBase = { A: 190, B: 115, C: 55 }[grade];
    const compMult = meta.cost / 50;
    const price = Math.round((priceBase * compMult + rnd() * 30) / 5) * 5;
    const moq = grade === 'A' ? 10 + Math.floor(rnd() * 15) : grade === 'B' ? 5 + Math.floor(rnd() * 10) : 50 + Math.floor(rnd() * 150);
    const stock = grade === 'A' ? 200 + Math.floor(rnd() * 800) : grade === 'B' ? 150 + Math.floor(rnd() * 600) : 300 + Math.floor(rnd() * 1500);
    const isPhoto = photoIdx < photos.length && photoSet.size < 15;
    if (isPhoto) {
      photoSet.add(slug);
    }
    const photo = isPhoto ? photos[photoIdx++] : null;
    fabrics.push({
      id: slug,
      slug,
      code,
      lotId,
      name: { ar: nameAr, en: nameEn },
      grade,
      category,
      composition: comp,
      construction: meta.construction,
      gsm,
      widthCm: meta.width,
      finish: { ar: finishAr, en: finishEn },
      shades: shadeChoices.map((s) => ({ ar: s.ar, en: s.en, hex: s.hex })),
      pricePerMetre: price,
      moqM: moq,
      availability: stock > 600 ? 'in-stock' : stock > 200 ? 'low-stock' : 'out-of-stock',
      stockMetres: stock,
      source: photo ? 'photo' : 'render',
      seed: photo ? null : seed,
      photo: photo ? `/media/${photo}` : null,
      alternatives: [],
      gradeNotes: GRADE_NOTES[grade],
      bench: {
        waterLkg: Math.round(meta.water * (grade === 'A' ? 1 : grade === 'B' ? 0.97 : 0.92)),
        carbonKg: +(meta.carbon * (grade === 'A' ? 1 : 0.97)).toFixed(2),
        costIndex: Math.round(meta.cost * (grade === 'A' ? 1.05 : grade === 'B' ? 0.95 : 0.8)),
      },
    });
  }
}

/* cross-grade alternatives: link same-base fabrics across grades */
for (const f of fabrics) {
  const base = f.slug.replace(/-[abc]$/, '');
  f.alternatives = fabrics
    .filter((o) => o.slug !== f.slug && o.slug.replace(/-[abc]$/, '') === base)
    .map((o) => o.slug);
}

/* ---------- categories ---------- */
const CATEGORY_DEFS = [
  ['womens-apparel', 'أقمشة نسائية', 'Women\'s apparel', 'خط أساسي: شيفون، كريب، ساتان، فيسكوز وفوال قطني.'],
  ['shirting', 'Shirting', 'Shirting', 'بوبلين، أوكسفورد، تويل وShirting مخطط للملابس الرجالية.'],
  ['jersey-knit', 'جيرسي نت', 'Jersey & Knit', 'جيرسي قطني لايكا، سينجل نت، سكبا والريب.'],
  ['lace-tulle', 'دانتيل وتول', 'Lace & Tulle', 'دانتيل رايشل، تول، وغيبيري للمسبوكات والفراش.'],
  ['home-textiles', 'منسوجات المنزل', 'Home textiles', 'ستائر، كتان مخلوط، تيكنغ وفراش.'],
  ['linings', 'البطانات', 'Linings', 'بطانات ساتان، تويل وفيسكوز للخياطة.'],
  ['surplus', 'المخزون الزائد', 'Surplus', 'مخزون زائد وأطوال قصيرة — تصفية بكميات.'],
];
const categories = CATEGORY_DEFS.map(([slug, ar, en, desc]) => ({
  id: slug,
  slug,
  name: { ar, en },
  description: { ar: desc, en: desc },
}));

/* ---------- grades ---------- */
const grades = [
  {
    id: 'A',
    grade: 'A',
    name: { ar: 'الدرجة A', en: 'Grade A' },
    tag: { ar: 'أ · أول', en: 'A · FIRST' },
    description: {
      ar: 'أول جودة. درجة export، صبغة متوحدة، العرض كامل، ما في عيوب ظاهرة.',
      en: 'First quality. Export-grade, consistent dye lot, full width, no visible defects.',
    },
    priceImplication: { ar: 'السعر: الفئة العليا', en: 'Price: premium band' },
    typicalBuyer: { ar: 'اللي بيطلبوا export وال Production الراقية', en: 'Export buyers and premium production' },
    bullets: { ar: ["صبغة متوحدة من أول متر لآخر","العرض كامل والحواف سليمة","تحت ضوء المعرض: مافي عيوب ظاهرة","مناسب لل export والقطع الراقية"], en: ["Consistent dye lot from first to last metre","Full width, sound edges","Under gallery light: no visible defects","Suited to export and premium pieces"] },
    accent: 'ok',
  },
  {
    id: 'B',
    grade: 'B',
    name: { ar: 'الدرجة B', en: 'Grade B' },
    tag: { ar: 'ب · ثاني', en: 'B · SECOND' },
    description: {
      ar: 'اختلاف خفيف في السداة أو الصبغة، اليد سليمة، والأمتار المستخدمة كاملة.',
      en: 'Minor weaving or dye variation, sound hand, full usable metres.',
    },
    priceImplication: { ar: 'السعر: الفئة الوسطى', en: 'Price: mid band' },
    typicalBuyer: { ar: 'السوق المحلي والإنتاج السعري', en: 'Domestic market and price-driven production' },
    bullets: { ar: ["اختلاف خفيف في الصبغة أو السداة","اليد سليمة والقماش بيتحمل الخياطة","الأمتار المستخدمة كاملة","سعر مريح للسوق المحلي"], en: ["Minor dye or weaving variation","Sound hand, holds up in sewing","Full usable metres","Comfortable price for the domestic market"] },
    accent: 'indigo',
  },
  {
    id: 'C',
    grade: 'C',
    name: { ar: 'الدرجة C', en: 'Grade C' },
    tag: { ar: 'ج · تصفية', en: 'C · VALUE' },
    description: {
      ar: 'عيوب ظاهرة، أطوال قصيرة، أو مخزون زائد للتصفية. تتباع بالبالة والكمية.',
      en: 'Visible defects, short lengths or overstock clearance. Sold in bulk and by the lot.',
    },
    priceImplication: { ar: 'السعر: فئة القيمة', en: 'Price: value band' },
    typicalBuyer: { ar: 'الكميات والتصفية والاستخدام الرخيص', en: 'Bulk, clearance and budget use' },
    bullets: { ar: ["عيوب ظاهرة: نُتوء أو بُقع أو خيوط مقطوعة","أطوال قصيرة أو مخزون زائد","بتتباع بالبالة والكمية الكبيرة","السعر في فئة القيمة — للمشروعات السعرية"], en: ["Visible defects: slubs, spots or broken threads","Short lengths or overstock","Sold in bulk and by the lot","Value price band — for price-led projects"] },
    accent: 'madder',
  },
];

/* ---------- gallery ---------- */
const gallery = [
  {
    id: 'frontage',
    role: 'gallery-frontage',
    src: '/media/gallery-frontage.jpg',
    source: 'photo',
    alt: { ar: 'واجهة معرض الأزهر تكس مقابل موقف أبو حماد', en: 'Al Azhar Tex gallery frontage opposite Abu Hammad station' },
    caption: { ar: 'واجهة المعرض — مقابل موقف أبو حماد مباشرة', en: 'The gallery frontage — directly opposite Abu Hammad station' },
  },
  {
    id: 'floor-1',
    role: 'gallery-floor',
    src: '/media/gallery-floor-1.jpg',
    source: 'photo',
    alt: { ar: 'أرضية معرض الأزهر تكس والرفوف', en: 'Al Azhar Tex gallery floor and shelving' },
    caption: { ar: 'أرضية المعرض — كل الدرجات على الرف', en: 'The gallery floor — every grade on the shelf' },
  },
  {
    id: 'floor-2',
    role: 'gallery-floor',
    src: '/media/gallery-floor-2.jpg',
    source: 'photo',
    alt: { ar: 'تفصيل على رف المعرض', en: 'Detail on the gallery shelf' },
    caption: { ar: 'تفصيل على الرف — القطع مصنفة بالدرجة', en: 'Detail on the shelf — bolts sorted by grade' },
  },
  {
    id: 'floor-3',
    role: 'gallery-floor',
    src: '/media/gallery-floor-3.jpg',
    source: 'photo',
    alt: { ar: 'منظر داخلي لمعرض الأزهر تكس', en: 'Interior view of Al Azhar Tex gallery' },
    caption: { ar: 'داخل المعرض — تعال وافحص الstock بنفسك', en: 'Inside the gallery — come and inspect the stock yourself' },
  },
  {
    id: 'fabric-detail',
    role: 'gallery-floor',
    src: '/media/fabric-photo-01.jpg',
    source: 'photo',
    alt: { ar: 'تفصيل قماش تحت ضوء المعرض', en: 'Fabric detail under gallery light' },
    caption: { ar: 'القماش تحت الضوء الحقيقي — قبل ما تقرر', en: 'The fabric under real light — before you decide' },
  },
];

/* ---------- company ---------- */
const company = {
  name: 'Al Azhar Tex',
  nameAr: 'الأزهر تكس',
  galleryName: 'Al Azhar Tex Gallery',
  galleryNameAr: 'معرض الأزهر تكس',
  address: {
    en: 'Al Azhar Tex Gallery, Ziraa, Zagazig, Sharkia, Egypt — opposite Abu Hammad car station.',
    ar: 'مصر، الشرقية، الزقازيق، الزراعة، بعد موقف أبو حماد — أمام موقف أبو حماد',
  },
  landmark: { en: 'in front of the Abu Hammad car station', ar: 'أمام موقف أبو حماد' },
  founder: { ar: 'شادي أنور', en: 'Shady Anwar' },
  phones: [
    { label: 'Phone 1', display: '+20 100 360 0949', href: 'tel:+201003600949' },
    { label: 'Phone 2', display: '+20 120 175 4177', href: 'tel:+201201754177' },
  ],
  whatsapp: ['+201003600949', '+201201754177'],
  hoursAssumed: true,
  hours: [
    { day: 'sat', from: '09:00', to: '18:00' },
    { day: 'sun', from: '09:00', to: '18:00' },
    { day: 'mon', from: '09:00', to: '18:00' },
    { day: 'tue', from: '09:00', to: '18:00' },
    { day: 'wed', from: '09:00', to: '18:00' },
    { day: 'thu', from: '09:00', to: '18:00' },
  ],
  admin: {
    username: 'admin',
    passwordHash: '8a344ad4ddecaab0444ec101fff2a422dd14f8cbd9557adbdbd66ffc6f6b3ac2',
  },
};

/* ---------- journal (3 × 500+ words, AR + EN) ---------- */
const journal = [
  {
    id: 'why-we-grade-openly',
    slug: 'why-we-grade-openly',
    title: {
      ar: 'ليه بنكتب الدرجة على كل قطعة',
      en: 'Why we write the grade on every bolt',
    },
    excerpt: {
      ar: 'التجار اللي يخبوا الدرجة ما بتدمرش القماش — بتدمر الثقة. احنا بنكتبها على كل قطعة.',
      en: 'Sellers who hide the grade hurt trust, not fabric. We write it on every bolt.',
    },
    minRead: 5,
    date: '2026-10-12',
    author: { ar: 'شادي أنور', en: 'Shady Anwar' },
    coverRole: 'journal',
    body: {
      ar: `في معظم بيوت الأقمشة، الدرجة بتبقى كلمة بتتقال همساً. بيقولوا لك «كواليتي عالي» أو «عادي»، ومفيش أرقام ولا تصنيف يفهمها كل الناس. المشكلة ما فيش في القماش نفسه — المشكلة في الكلمة اللي بتتقال من غير ما تتكتب. لما Buyer يمسك قطعة كريب ويسأل عن الدرجة، والإجابة تكون عبارة عن ابتسامة، الثقة بتبوظ من أول خطوة. لذلك في الأزهر تكس بنتعامل مع الدرجة كحقيقة مكتوبة، مش وصف شفهي.

النظام عندنا ثلاث درجات واضحة: الدرجة A وهي أول جودة لل export، صبغة متوحدة وعرض كامل وما في عيوب ظاهرة. الدرجة B اختلاف خفيف في السداة أو الصبغة، لكن اليد سليمة والأمتار المستخدمة كاملة، وهي الدرجة اللي بتبيع أكتر في السوق المحلي لأن سعرها مريح ومستوى الجودة مناسب لمعظم الخطوط. والدرجة C وهي التصفية: عيوب ظاهرة أو أطوال قصيرة أو مخزون زائد، وبتتباع بالبالة والكمية.

الكلام ده مش دعائي — ده نظام نعمل بيه كل يوم. كل قطعة في المعرض عليها الدرجة مكتوبة، وفي الرابط بتاعنا بتكون موجودة كجزء من الـ slug، وفي الفلتر بتاعنا بتكون أول وجهتة تصفية. يعني لو حد دخل على صفحة قماش وحدده الدرجة C، هو دخل بإرادته وعايز يشتري تصفية، وماحدش غشّاه. وده بيخلينا نتحمل مسؤولية القطع اللي بتتباع، لأن اللي أخذها أخذها وهو عارف إيه اللي فيها.

كمان بنكتب ملاحظات الدرجة في كل صفحة قماش: تتوقع إيه من كل درجة، وإيه الفئة المستهدفة لكل درجة، والفارق بينها مكتوب بلغة واضحة. و page الدرجات نفسها فيها المقارنة بصورة مش بوصف، عشان اللي عايز يتأكد يتأكد بعينه.

اللي بيطلبوا الدرجة A عايز يُرسل للخارج ويحتاج مستوى ثابت، وبنعطيه المستوى ده بسعره. اللي بيطلب B عايز خط إنتاج سعري محترم، وبنعطيه سلامة القماش بسعر مريح. واللي بيطلب C عايز كميات ويفهم إن فيه عيوب، وبنعطيه الكمية بسعر القيمة. كل فئة بتدفع على اللي هي عايزته، وماحدش بيدفع عشان وصف مش حقيقي.

الدرجة C مش إهانة — هي منتج حقيقي لفئة حقيقية. اللي بيفهم في الأقمشة بيمسك قطعة C وبيعرف قيمتها، وبياخدها عمداً عشان مشروع سعري أو استخدام محدد. الكارثة بتبقى لما قطعة C تتباع على إنها A، وده اللي احنا بنعدّله بالكتابة والتصنيف والمقارنة تحت الضوء.

في الآخر، الثقة في بيت الأقمشة ما بتبوظ بالخطأ — بتتبوظ بالكتمان. وكتابتنا للدرجة على كل قطعة هي الطريقة البسيطة اللي بنحافظ بيها على الثقة دي، من يوم ما القطعة بتوصلنا لحد ما بتخرج من المعرض.وفي النهاية، النظام ده بيعمل فايدة مش بتاعتنا وحدنا — بيفيد ال Buyer على طول الخط. لما تكون الدرجة مكتوبة ومقارنة الدرجات موجودة، اللي بيشتري بياخد قرار بناء على حقائق مش على كلام، وبيقدر يقارن بين العروض من غير ما يقلق إن القطعة اللي وصلته مش هي اللي كان متصورها. وحتى لو القطعة بتتغير من دفعة للتانية، الدرجة المكتوبة بتكون مرشد واضح: الدفعة الجديدة بتبقى مصنفة بنفس النظام، والفروق لو حصلت بتكون مكتوبة وظاهرة. الاستمرارية دي هي اللي بتخلي العلاقة بين البيت وال Buyer تفضل قائمة على وضوح، مش على أمل إن الحاجة تبقى كويسة. وده اللي بنسعى له في كل قطعة بتخرج من المعرض، وفي كل صفحة بتفتحها على الموقع. النظام الواضح ده مش بيكلف ال Buyer حاجة، وبيحمي بيت الأقمشة نفسه من شكاوى مش بتستند لحقائق، لأن كل قرار بيكون مكتوب ومتحقق منه قبل البيع.`,
      en: `In most fabric houses, the grade is a word said in whispers. They tell you "high quality" or "standard", with no numbers and no classification anyone can pin down. The problem is not the fabric — it is the word that is spoken without being written. When a buyer handles a crepe bolt and asks about the grade, and the answer is a smile, trust is lost in the first step. That is why Al Azhar Tex treats the grade as a written fact, not a spoken description.

Our system has three clear grades. Grade A is first quality for export: a consistent dye lot, full width, no visible defects. Grade B has minor weaving or dye variation, but a sound hand and full usable metres — it is the grade that sells most in the domestic market because the price is comfortable and the quality level suits most lines. Grade C is clearance: visible defects, short lengths, or overstock, sold in bulk and by the lot.

This is not marketing — it is the system we work by every day. Every bolt in the gallery carries its grade in writing, it sits in the URL as part of the slug, and it is the first filter facet on the catalog. If someone opens a fabric page and selects grade C, they arrived by choice, wanting clearance, and nobody tricked them. That lets us stand behind every bolt that leaves, because the person who took it took it knowing exactly what is in it.

We also write grade notes on every fabric page: what to expect from each grade, the target buyer for each, and the difference between them in plain language. The grades page itself carries the comparison in image rather than words, so anyone who wants to verify can verify with their own eyes.

Buyers who want grade A are shipping abroad and need a consistent level, and we give them that level at its price. Buyers who want B are running a sensible price-led line, and we give them sound fabric at a comfortable price. Buyers who want C want quantity and understand there are defects, and we give them the quantity at a value price. Each segment pays for what it needs, and nobody pays for a claim that is not true.

Grade C is no shame — it is a real product for a real segment. A buyer who knows fabrics handles a C bolt, sees its value, and takes it on purpose for a price-led project or a specific use. The disaster is a C bolt sold as A, and that is exactly what the writing, the classification and the comparison under the light are here to prevent.

In the end, trust in a fabric house is not lost through mistakes — it is lost through withholding. Writing the grade on every bolt is the simple way we keep that trust, from the moment a lot arrives to the moment it leaves the gallery.`,
    },
  },
  {
    id: 'telling-grades-apart',
    slug: 'telling-grades-apart',
    title: {
      ar: 'ازاي تفرّق بين درجات الأقمشة تحت الضوء',
      en: 'Telling fabric grades apart under the light',
    },
    excerpt: {
      ar: 'الضوء الحقيقي هو الحكم. إزاي تشوف فرق A وB وC بعينيك قبل ما تدفع.',
      en: 'Real light is the judge. How to see the A, B and C difference with your own eyes before you pay.',
    },
    minRead: 6,
    date: '2026-10-28',
    author: { ar: 'شادي أنور', en: 'Shady Anwar' },
    coverRole: 'journal',
    body: {
      ar: `الضوء اللي بتشتري بيه القماش هو الضوء اللي بتشوف بيه العيوب. صورة القماش في الكاتالوج ممكن تكون نقية جداً، لكن المعرض بيحط القطعة تحت ضوء حقيقي، وده اللي بيكشف الفرق الحقيقي بين درجات الجودة. في الأزهر تكس بنستخدم الضوء ده في التصنيف نفسه: الدرجة A بتمر من فحص تحت الضوء وبتتأكد إن مفيش عيوب ظاهرة، الدرجة B فيها اختلافات بتتلاحظ بعين مدربة، والدرجة C فيها عيوب ظاهرة بتبقة واضحة لأي حد.

الدرجة A، أول حاجة بتلاحظها هي التجانس. الصبغة بتبقى متوحدة في كل متر، السداة واللُحمة بتبقى منتظمة، والعرض كامل من الحافة للحافة. لو مدّيت إيدك على القماش، السطح بيكون متساوي، ومفيش نُتوء أو سماكة مختلفة. الألوان بتبقى ثابتة تحت الضوء: اللون اللي طلعت بيه وهو في الرف هو نفسه اللي هتشوفه تحت ضوء المعرض، من غير تغيير يقلق. الدرجة A دي بتروح لل export وال Production اللي محتاج مستوى ثابت على طول الخط، ودا لسبب وجيه.

الدرجة B بتبقى سليمة لكن مش متساوية تماماً. ممكن تلاقي اختلاف خفيف في قوة الصبغة بين أجزاء من القماش، أو نُتوء خفيف في السداة، أو سماكة بتختلف شوية من متر للتاني. الاختلافات دي عادية في الأقمشة، وكتير من الخطوط التجارية بتشتغل عليها من غير مشكلة، لكنها بتحدد إنها مش Reach مستوى ال export. الميزة هنا إن اليد سليمة والأمتار المستخدمة كاملة: القماش بيتحمل القطع والخياطة زي ما هو، ودي الدرجة اللي بتبيع أكتر للمصانع المحلية والخط السعري.

الدرجة C هي اللي الضوء بيكشفها بسهولة. العيوب بتبقى ظاهرة: نُتوء واضحة، خيوط مقطوعة، بُقع، أو اختلاف كبير في اللون في أجزاء من القطعة. وأحياناً القطعة تكون أطوال قصيرة — قطعة أتقطعت shorter من الطول المتوقع، أو مخزون زائد فضل من طلب سابق. الدرجة C دي بتتباع بالبالة والكمية، وسعرها بيكون في فئة القيمة، لأن اللي بيشتريه عايز كمية ويفهم إن فيه عيوب وعايز يستفيد من السعر.

إزاي تفحص بنفسك؟ ابدأ بإن ترخي القماش على الطاولة تحت الضوء، وتشوف الإضاءة من زاوية مختلفة. لُحمة القماش بتكشف العيوب اللي متقدرش تشوفها وهو ملفوف. بعدين افحص الحواف: الدرجة A والـ B بتكون حوافها سليمة ومتساوية، والدرجة C أحياناً بيكون فيها حواف مش منتظمة أو أثر قص. جرب كمان إنك تُمرّ إيدك على السطح: الفرق في النُتوء والسماكة بيبان باللمس أسرع من النظر.

ما تعتمدش على صورة وحدها. الصورة ممكن تغطي حاجات كتير، والضل والظل في الإضاءة المصطنعة ممكن يخفي عيوب أو يضخمها. المعرض بيخليك تشوف القطعة تحت الضوء الحقيقي، تفحصها بعينك وإيدك، وتقرر بعدين. ده بالضبط اللي بيميز الشراء من معرض حقيقي عن الشراء من كتالوج.

ولو عايز تتأكد من الدرجة من غير ما تجي، صفحات القطع عندنا بتحط ملاحظات الدرجة ومقارنة الدرجات بصورة. تقدر تشوف شكل الدرجة A وB وC وتعرف إيه الفرق، وتقرر إيه اللي يناسبك. بعدين اسأل على واتساب برمز القماش والدرجة، واحدد الكمية، وبنعطيك التفاصيل والسعر.كمان حاول تقارن بين قطعتين من نفس التركيبة ودرجتين مختلفتين، لو متوفر. المقارنة الجانبية بتكشف الفرق بسرعة: قماش الدرجة A بيبان متجانس، وقماش الدرجة B بيبان فيه اختلافات خفيفة، وقماش الدرجة C بيبان فيه العيوب بتاعتها. المقارنة دي بتخليك تفهم النظام مش ككلام، وتقرر بعدين إيه اللي يناسبك من الدرجات. ومتنساش إن الدرجة مش حُكم على القماش — حُكم على الاستخدام. قطعة الدرجة C ممكن تكون أحسن اختيار لمشروع معين، وقطعة الدرجة A ممكن تكون ضرورية لمشروع تاني. الفارق الحقيقي بيبان لما تحدّد الاستخدام أولاً، وبعدين تفحص القطعة تحت الضوء عشان تتأكد إن الاختيار صح.`,
      en: `The light you buy fabric in is the light you see defects in. A fabric photo in a catalog can be perfectly clean, but the gallery puts the bolt under real light, and that is what exposes the true difference between quality grades. At Al Azhar Tex we use that light in the grading itself: grade A passes an inspection under light confirming no visible defects, grade B carries variations a trained eye notices, and grade C carries defects that are obvious to anyone.

With grade A, the first thing you notice is consistency. The dye is uniform across every metre, the warp and weft are regular, and the width is full from edge to edge. Run a hand over the fabric and the surface is even, with no slubs or thickness changes. The colour holds under light: what you saw on the shelf is what you see under gallery light, without worrying shifts. Grade A goes to export and production that need a consistent level down the line, and for good reason.

Grade B is sound but not perfectly even. You may find slight variation in dye strength across the fabric, a mild slub in the warp, or thickness that shifts a little from metre to metre. These are ordinary in fabrics, and many commercial lines work with them without issue — but they are what keeps the bolt out of export grade. The advantage is a sound hand and full usable metres: the fabric holds up to cutting and sewing as it is, and this is the grade that sells most to local factories and price-led lines.

Grade C is what the light reveals easily. Defects are visible: clear slubs, broken threads, spots, or a significant colour shift across parts of the bolt. Sometimes the bolt is a short length — cut shorter than expected, or surplus left from a previous order. Grade C sells in bulk and by the lot, at a value price, because the buyer wants quantity, understands there are defects, and wants to benefit from the price.

How do you inspect it yourself? Start by laying the fabric flat on the table under the light and viewing it from different angles. The weft reveals defects you cannot see while the fabric is rolled. Then check the edges: grades A and B have sound, even edges, while grade C sometimes shows irregular edges or cut marks. Run a hand across the surface too — differences in slubs and thickness show to the touch faster than to the eye.

Do not rely on a photo alone. A photo can cover a lot, and artificial lighting can hide defects or exaggerate them. The gallery lets you see the bolt under real light, inspect it with your eye and your hand, and decide afterwards. That is exactly what separates buying from a real gallery from buying from a catalog.

And if you want to confirm a grade without visiting, our fabric pages carry grade notes and a visual grade comparison. You can see what grades A, B and C look like, know the difference, and decide what suits you. Then ask on WhatsApp with the fabric code and grade, state the quantity, and we give you the details and the price.`,
    },
  },
  {
    id: 'choosing-fabric-for-your-line',
    slug: 'choosing-fabric-for-your-line',
    title: {
      ar: 'ازاي تختار القماش للخط بتاعك',
      en: 'Choosing fabric for your line',
    },
    excerpt: {
      ar: 'من الدرجة للتركيبة للوزن: خطوات عملية لاختيار القماش اللي ينجح مع خطك.',
      en: 'From grade to composition to weight: practical steps to pick the fabric your line needs.',
    },
    minRead: 7,
    date: '2026-11-05',
    author: { ar: 'شادي أنور', en: 'Shady Anwar' },
    coverRole: 'journal',
    body: {
      ar: `اختيار القماش للخط بيكون أكتر من مجرد اختيار لون. القرار بيحدد تكلفة الإنتاج، مستوى الجودة النهائي، وراحة القماش في الاستخدام، وكل خطوة بتاخد قرارات صغيرة بتراكم على بعض. في المعرض بنقابل ناس كتير بيبدؤوا خطوط جديدة، وبنحاول نساعدهم يختاروا القماش المناسب بناء على الدرجة والتركيبة والوزن، مش بناء على الصورة وحدها.

الخطوة الأولى هي الدرجة. حدد إيه مستوى الجودة اللي خطك محتاج. لو الخط رايح لل export أو محتاج مستوى ثابت على كل القطع، الدرجة A هي الخيار الصحيح، وسعرها بيعكس الجودة. لو الخط محلي ومحتاج توازن بين الجودة والتكلفة، الدرجة B بتكون الاختيار الأكثر شيوعاً، وسلامة القماش بتغطي احتياجات معظم الخطوط. لو عندك مشروع سعري، أو عايز تنتج بكميات كبيرة بتكلفة معقولة وتتقبل عيوب بسيطة، الدرجة C بتكون الاختيار الذكي — الكميات بالبالة والسعر في فئة القيمة.

الخطوة التانية هي التركيبة. التركيبة بتحدد إزاي القماش بيتصرف في الخياطة وبعدين في الاستخدام. الشيفون والجورجيت خفيفين ومناسبين للقطع اللي محتاجة سماكة بسيطة ونسيبها تنسدل، والكريب أثقل وبياخد شكل منظم، والساتان بيجيب لمعة، والفوال القطني بيبقى خفيف ومع بطانة محترم. الجرسي والنت للقطع اللي محتاجة مرونة، والسكبا للقطع اللي محتاجة شكل محافظ. كل تركيبة ليها سلوك، ومعرفتها بتخليك تختار قماش يناسب تصميمك مش بس شكله.

الوزن (الـ GSM) خطوة تالتة مهمة. الوزن بيحدد سماكة القطعة النهائية وكيفية تعاملها مع الخياطة. الأقمشة الخفيفة محتاجة تعامل دقيق في القص والخياطة، والأقمشة الثقيلة محتاجتها مكينة وخيوط تقدر تتحملها. لو التصميم محتاج قماش ينسدل بنعومة، خفّ الوزن. لو محتاج قماش يحافظ على شكله، زوّد الوزن. التوازن بين التركيبة والوزن هو اللي بيحدد سلوك القماش النهائي.

العرض كمان قرار: الأقمشة بتجي بعروض مختلفة، وأحياناً الطلب بيكون على العرض المتوفر. تأكد إن العرض اللي بتختاره يناسب القطع اللي بتقطعها من القماش، عشان ماتبقاش بتهدر أمتار كتير في القص.

الخطوة الرابعة هي التجربة. قبل ما تطلب كميات، اطلب عينة من القماش اللي اخترت، وافحصها تحت الضوء، وجرّدها بيدك، وانظر إزاي بتسلك في الخياطة. العينة بتكشف حاجات كتير ما بتظهرش في الصورة: سلوك القماش، مستوى العيوب، ومدى ملاءمته للتصميم. في الأزهر تكس بنبعث عينات لللي بيطلبها، وبنكتب مع القطعة الدرجة بتاعتها عشان تكون عارف إيه اللي قاعد يوصلك.

وآخر خطوة هي الكمية. الحد الأدنى للطلب بيختلف حسب الدرجة: الدرجة A والـ B بيطلبوا كميات معقولة حسب الحاجة، والدرجة C بتتباع بالبالة والكمية الكبيرة. حدد الكمية اللي خطك محتاجها فعلاً، عشان ماتطلبش أكتر من اللازم وتدخل في مخزون مكلف.

الاختيار الصحيح للقماش بيبدا من معرفة الخط بتاعك: إيه المستوى اللي محتاج، إيه التركيبة اللي تناسب التصميم، وإيه الوزن اللي بيخلي القطعة تطلع بالشكل المطلوب. بعدين الدرجة تحدد السعر والمستوى، والتجربة بتثبت الاختيار. لو احتجت مساعدة في الاختيار، المعرض مفتوح وواتسابنا دايماً جاهز — ابعت رمز القماش والدرجة والكمية، وبنعطيك التفاصيل.وبعد ما بتقرر القماش والدرجة والكمية، احفظ اختياراتك في قائمة العينات اللي بتتحفظ على جهازك، عشان تراجعها قبل ما تطلب أو قبل ما تيجي المعرض. القائمة بتجمع العينات اللي اخترتها من الأقمشة المختلفة، وبتقدر تشاركها على واتساب عشان تنسق معانا على الطلب. في مركز التاجر، الطلبات المحفوظة والعينات والعروض كلها في مكان واحد، وبتحفظ على الجهاز ده بس، مافيها رفع لأي سيرفِر. لو احتجت مساعدة إضافية في الاختيار — إزاي توزن بين الدرجة والسعر، أو إزاي تختار بين تركيبات متشابهة — المعرض مفتوح وواتسابنا دايماً مفتوح، وبنحاول نجاوب على كل استفسار بوضوح، لأن اختيار القماش الصح هو أول خطوة نحو خط إنتاج ناجح.`,
      en: `Choosing fabric for a line is more than picking a colour. The decision sets production cost, the final quality level, and how comfortable the fabric is to work with, and every step takes small decisions that add up. In the gallery we meet many people starting new lines, and we help them choose the right fabric based on grade, composition and weight — not on the photo alone.

The first step is the grade. Decide what quality level your line needs. If the line is going to export or needs a consistent level across every piece, grade A is the right choice, and its price reflects the quality. If the line is domestic and needs a balance of quality and cost, grade B is the most common choice, and the soundness of the fabric covers the needs of most lines. If you have a price-led project, or want to produce in large quantity at a sensible cost and can accept minor defects, grade C is the smart choice — bulk quantities and a value price.

The second step is composition. Composition determines how the fabric behaves in sewing and later in use. Chiffon and georgette are light and suit pieces that need a soft drape; crepe is heavier and holds a structured shape; satin carries a sheen; cotton voile stays light and works well with a proper lining. Jersey and knits suit pieces that need stretch, and scuba suits pieces that need a firm shape. Every composition has a behaviour, and knowing it lets you choose a fabric that suits your design, not just its look.

Weight (GSM) is the third important step. Weight sets the final thickness of the piece and how it handles in sewing. Light fabrics need careful handling in cutting and sewing, and heavy fabrics need a machine and threads that can take them. If the design needs a soft drape, lower the weight. If it needs the fabric to hold its shape, raise the weight. The balance between composition and weight is what sets the final behaviour of the fabric.

Width is a decision too: fabrics come in different widths, and sometimes the order is for whatever width is available. Make sure the width you choose suits the pieces you cut from the fabric, so you are not wasting metres in cutting.

The fourth step is testing. Before ordering quantities, order a sample of the fabric you chose, inspect it under light, handle it, and see how it behaves in sewing. A sample reveals a lot that a photo cannot: the behaviour of the fabric, the level of defects, and how well it suits the design. At Al Azhar Tex we send samples to those who request them, and the grade goes with the bolt so you know exactly what is arriving.

The last step is quantity. The minimum order differs by grade: grades A and B are ordered in sensible quantities by need, and grade C sells in bulk and by the lot. Set the quantity your line actually needs, so you are not ordering more than necessary and carrying costly stock.

Choosing fabric correctly starts with knowing your line: the level you need, the composition that suits the design, and the weight that makes the piece come out right. Then the grade sets the price and the level, and testing confirms the choice. If you need help choosing, the gallery is open and our WhatsApp is always ready — send the fabric code, the grade and the quantity, and we give you the details.`,
    },
  },
];

/* ---------- write ---------- */
const files = {
  'fabrics.json': fabrics,
  'categories.json': categories,
  'grades.json': grades,
  'gallery.json': gallery,
  'company.json': company,
  'journal.json': journal,
};
for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(out, name), JSON.stringify(data, null, 2) + '\n', 'utf8');
}
console.log(`wrote ${Object.keys(files).length} content files`);
console.log(`fabrics: ${fabrics.length} (A: ${fabrics.filter((f) => f.grade === 'A').length}, B: ${fabrics.filter((f) => f.grade === 'B').length}, C: ${fabrics.filter((f) => f.grade === 'C').length})`);
console.log(`photos used: ${photoSet.size}, renders: ${fabrics.length - photoSet.size}`);

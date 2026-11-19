/**
 * Company constants — the single source of truth (§3).
 * Never retype a phone number inline anywhere. Import from here.
 */

export const COMPANY = {
  name: 'Al Azhar Tex',
  nameAr: 'الأزهر تكس',
  galleryName: 'Al Azhar Tex Gallery',
  galleryNameAr: 'معرض الأزهر تكس',

  // Verified facts — byte-exact (§3).
  addressEn:
    'Al Azhar Tex Gallery, Ziraa, Zagazig, Sharkia, Egypt — opposite Abu Hammad car station.',
  addressAr: 'مصر، الشرقية، الزقازيق، الزراعة، بعد موقف أبو حماد — أمام موقف أبو حماد',
  landmarkEn: 'in front of the Abu Hammad car station',
  landmarkAr: 'أمام موقف أبو حماد',

  founder: {
    name: 'Shady Anwar',
    nameAr: 'شادي أنور',
  },

  phone1: '+201003600949',
  phone2: '+201201754177',
  phone1Display: '+20 100 360 0949',
  phone2Display: '+20 120 175 4177',

  whatsapp: ['+201003600949', '+201201754177'],

  siteName: 'Al Azhar Tex',
  siteNameAr: 'الأزهر تكس',

  // Do not invent: rendered as TBD chips until the client supplies (§1).
  tbd: {
    foundingYear: true,
    monthlyCapacity: true,
    exportMarkets: true,
    employees: true,
    certifications: true,
  },

  // Gallery hours — ASSUMED placeholder, confirm with client (PLACEHOLDERS.md).
  hoursAssumed: true,
  hours: [
    { day: 'sat', from: '09:00', to: '18:00' },
    { day: 'sun', from: '09:00', to: '18:00' },
    { day: 'mon', from: '09:00', to: '18:00' },
    { day: 'tue', from: '09:00', to: '18:00' },
    { day: 'wed', from: '09:00', to: '18:00' },
    { day: 'thu', from: '09:00', to: '18:00' },
  ],

  // Admin — single admin credential. SHA-256 hex digest only, never plaintext.
  // Default password: azt-admin-2026 — change via Settings → Change password
  // and commit the new hash (README: admin setup).
  admin: {
    username: 'admin',
    passwordHash: '8a344ad4ddecaab0444ec101fff2a422dd14f8cbd9557adbdbd66ffc6f6b3ac2',
  },
} as const;

/** Deep link into WhatsApp with a prefilled message (§20). */
export function whatsappLink(text: string, phone?: string): string {
  const p = phone ?? COMPANY.whatsapp[0];
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}

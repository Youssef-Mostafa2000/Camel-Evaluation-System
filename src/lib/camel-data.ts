export const saudiProvinces = [
  { value: 'riyadh', label: 'Riyadh', labelAr: 'الرياض' },
  { value: 'makkah', label: 'Makkah', labelAr: 'مكة المكرمة' },
  { value: 'madinah', label: 'Madinah', labelAr: 'المدينة المنورة' },
  { value: 'eastern', label: 'Eastern Province', labelAr: 'المنطقة الشرقية' },
  { value: 'asir', label: 'Asir', labelAr: 'عسير' },
  { value: 'tabuk', label: 'Tabuk', labelAr: 'تبوك' },
  { value: 'qassim', label: 'Qassim', labelAr: 'القصيم' },
  { value: 'hail', label: 'Hail', labelAr: 'حائل' },
  { value: 'northern-borders', label: 'Northern Borders', labelAr: 'الحدود الشمالية' },
  { value: 'jazan', label: 'Jazan', labelAr: 'جازان' },
  { value: 'najran', label: 'Najran', labelAr: 'نجران' },
  { value: 'bahah', label: 'Al-Bahah', labelAr: 'الباحة' },
  { value: 'jouf', label: 'Al-Jouf', labelAr: 'الجوف' },
];

export const camelBreeds = [
  { value: 'majaheem', label: 'Majaheem', labelAr: 'مجاهيم' },
  { value: 'sofor', label: 'Sofor', labelAr: 'صفر' },
  { value: 'shaele', label: 'Shaele', labelAr: 'شعل' },
  { value: 'homor', label: 'Homor', labelAr: 'حمر' },
  { value: 'wadeh', label: 'Wadeh', labelAr: 'وضح' },
  { value: 'shageh', label: 'Shageh', labelAr: 'شقح' },
  { value: 'mixed', label: 'Mixed Breed', labelAr: 'هجين' },
  { value: 'other', label: 'Other', labelAr: 'أخرى' },
];

export const camelColors = [
  { value: 'black', label: 'Black', labelAr: 'أسود' },
  { value: 'brown', label: 'Brown', labelAr: 'بني' },
  { value: 'white', label: 'White', labelAr: 'أبيض' },
  { value: 'beige', label: 'Beige', labelAr: 'بيج' },
  { value: 'golden', label: 'Golden', labelAr: 'ذهبي' },
  { value: 'gray', label: 'Gray', labelAr: 'رمادي' },
  { value: 'cream', label: 'Cream', labelAr: 'كريمي' },
  { value: 'red-brown', label: 'Red-Brown', labelAr: 'بني محمر' },
  { value: 'mixed', label: 'Mixed', labelAr: 'مختلط' },
];

export const camelSexes = [
  { value: 'male', label: 'Male', labelAr: 'ذكر' },
  { value: 'female', label: 'Female', labelAr: 'أنثى' },
];

export function getBreedLabel(value: string, isArabic = false): string {
  const breed = camelBreeds.find(b => b.value === value);
  return breed ? (isArabic ? breed.labelAr : breed.label) : value;
}

export function getColorLabel(value: string, isArabic = false): string {
  const color = camelColors.find(c => c.value === value);
  return color ? (isArabic ? color.labelAr : color.label) : value;
}

export function getProvinceLabel(value: string, isArabic = false): string {
  const province = saudiProvinces.find(p => p.value === value);
  return province ? (isArabic ? province.labelAr : province.label) : value;
}

export function getSexLabel(value: string, isArabic = false): string {
  const sex = camelSexes.find(s => s.value === value);
  return sex ? (isArabic ? sex.labelAr : sex.label) : value;
}

export function calculateOverallScore(
  head: number,
  neck: number,
  body: number,
  size: number
): number {
  return Math.round(
    (head * 0.25 + neck * 0.25 + body * 0.30 + size * 0.20) * 100
  ) / 100;
}

export function calculateCompatibilityScore(
  camel1: {
    sex: string;
    head_beauty_score?: number;
    neck_beauty_score?: number;
    body_hump_limbs_score?: number;
    body_size_score?: number;
    location_province?: string;
    age?: number;
  },
  camel2: {
    sex: string;
    head_beauty_score?: number;
    neck_beauty_score?: number;
    body_hump_limbs_score?: number;
    body_size_score?: number;
    location_province?: string;
    age?: number;
  }
): number {
  let score = 0;

  if (camel1.sex !== camel2.sex) {
    score += 20;
  }

  const c1Scores = {
    head: camel1.head_beauty_score || 0,
    neck: camel1.neck_beauty_score || 0,
    body: camel1.body_hump_limbs_score || 0,
    size: camel1.body_size_score || 0,
  };

  const c2Scores = {
    head: camel2.head_beauty_score || 0,
    neck: camel2.neck_beauty_score || 0,
    body: camel2.body_hump_limbs_score || 0,
    size: camel2.body_size_score || 0,
  };

  const weakC1 = Object.entries(c1Scores).sort((a, b) => a[1] - b[1])[0];
  const strongC2 = Object.entries(c2Scores).sort((a, b) => b[1] - a[1])[0];

  if (weakC1[0] === strongC2[0] && strongC2[1] > 80) {
    score += 30;
  } else if (weakC1[0] === strongC2[0] && strongC2[1] > 70) {
    score += 20;
  }

  const avgC1 = Object.values(c1Scores).reduce((a, b) => a + b, 0) / 4;
  const avgC2 = Object.values(c2Scores).reduce((a, b) => a + b, 0) / 4;
  const avgCombined = (avgC1 + avgC2) / 2;

  if (avgCombined >= 85) {
    score += 25;
  } else if (avgCombined >= 75) {
    score += 15;
  } else if (avgCombined >= 65) {
    score += 10;
  }

  if (camel1.location_province === camel2.location_province) {
    score += 15;
  }

  const age1 = camel1.age || 0;
  const age2 = camel2.age || 0;
  if (age1 >= 3 && age1 <= 12 && age2 >= 3 && age2 <= 12) {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

export const listingDurations = [
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' },
];

export function formatPrice(price: number, currency = 'SAR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatPriceShort(price: number): string {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M`;
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(1)}K`;
  }
  return price.toString();
}

export function calculateDaysRemaining(expiresAt: string): number {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

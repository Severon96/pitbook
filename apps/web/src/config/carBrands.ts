export interface CarBrand {
  name: string;
  slug?: string; // URL-friendly slug for logo dataset
  color?: string; // Brand color for fallback styling
}

// Car brand logos - using car-logos-dataset (downloaded locally)
// https://github.com/filippofilip95/car-logos-dataset
// To update logos: npm run download-logos --workspace=@pitbook/web
const LOGO_BASE_URL = '/logos';

export const CAR_BRANDS: CarBrand[] = [
  { name: 'Acura', slug: 'acura', color: '#000000' },
  { name: 'Alfa Romeo', slug: 'alfa-romeo', color: '#DC0714' },
  { name: 'Aston Martin', slug: 'aston-martin', color: '#003F2D' },
  { name: 'Audi', slug: 'audi', color: '#BB0A30' },
  { name: 'Bentley', slug: 'bentley', color: '#006633' },
  { name: 'BMW', slug: 'bmw', color: '#1C69D4' },
  { name: 'Bugatti', slug: 'bugatti', color: '#BE0000' },
  { name: 'Buick', slug: 'buick', color: '#002868' },
  { name: 'Cadillac', slug: 'cadillac', color: '#002868' },
  { name: 'Chevrolet', slug: 'chevrolet', color: '#FFC72C' },
  { name: 'Chrysler', slug: 'chrysler', color: '#003DA5' },
  { name: 'Citroën', slug: 'citroen', color: '#DC001E' },
  { name: 'Dacia', slug: 'dacia', color: '#5B6770' },
  { name: 'Daihatsu', slug: 'daihatsu', color: '#DC0714' },
  { name: 'DeLorean', slug: 'dmc', color: '#8B8D8F' },
  { name: 'Dodge', slug: 'dodge', color: '#DC0000' },
  { name: 'Ferrari', slug: 'ferrari', color: '#DC0000' },
  { name: 'Fiat', slug: 'fiat', color: '#9D2235' },
  { name: 'Ford', slug: 'ford', color: '#003478' },
  { name: 'Genesis', slug: 'genesis', color: '#000000' },
  { name: 'GMC', slug: 'gmc', color: '#C8102E' },
  { name: 'Honda', slug: 'honda', color: '#CC0000' },
  { name: 'Hummer', slug: 'hummer', color: '#FFD700' },
  { name: 'Hyundai', slug: 'hyundai', color: '#002C5F' },
  { name: 'Infiniti', slug: 'infiniti', color: '#000000' },
  { name: 'Isuzu', slug: 'isuzu', color: '#E4003A' },
  { name: 'Jaguar', slug: 'jaguar', color: '#000000' },
  { name: 'Jeep', slug: 'jeep', color: '#154734' },
  { name: 'Kia', slug: 'kia', color: '#05141F' },
  { name: 'Koenigsegg', slug: 'koenigsegg', color: '#FFD700' },
  { name: 'Lada', slug: 'lada', color: '#1560BD' },
  { name: 'Lamborghini', slug: 'lamborghini', color: '#FFD700' },
  { name: 'Lancia', slug: 'lancia', color: '#003DA5' },
  { name: 'Land Rover', slug: 'land-rover', color: '#005A2B' },
  { name: 'Lexus', slug: 'lexus', color: '#000000' },
  { name: 'Lincoln', slug: 'lincoln', color: '#5A6268' },
  { name: 'Lotus', slug: 'lotus', color: '#FFD700' },
  { name: 'Maserati', slug: 'maserati', color: '#0C2340' },
  { name: 'Maybach', slug: 'maybach', color: '#000000' },
  { name: 'Mazda', slug: 'mazda', color: '#003087' },
  { name: 'McLaren', slug: 'mclaren', color: '#FF8000' },
  { name: 'Mercedes-Benz', slug: 'mercedes-benz', color: '#00ADEF' },
  { name: 'Mini', slug: 'mini', color: '#000000' },
  { name: 'Mitsubishi', slug: 'mitsubishi', color: '#E60012' },
  { name: 'Nissan', slug: 'nissan', color: '#C3002F' },
  { name: 'Oldsmobile', slug: 'oldsmobile', color: '#003DA5' },
  { name: 'Opel', slug: 'opel', color: '#FFD100' },
  { name: 'Pagani', slug: 'pagani', color: '#1C3F6E' },
  { name: 'Peugeot', slug: 'peugeot', color: '#003DA5' },
  { name: 'Plymouth', slug: 'plymouth', color: '#DC0000' },
  { name: 'Polestar', slug: 'polestar', color: '#000000' },
  { name: 'Pontiac', slug: 'pontiac', color: '#DC0000' },
  { name: 'Porsche', slug: 'porsche', color: '#D5001C' },
  { name: 'Ram', slug: 'ram', color: '#5B6770' },
  { name: 'Renault', slug: 'renault', color: '#FFCC00' },
  { name: 'Rivian', slug: 'rivian', color: '#0B6E4F' },
  { name: 'Rolls-Royce', slug: 'rolls-royce', color: '#680C07' },
  { name: 'Saab', slug: 'saab', color: '#003087' },
  { name: 'Saturn', slug: 'saturn', color: '#DC0000' },
  { name: 'SEAT', slug: 'seat', color: '#E2001A' },
  { name: 'Škoda', slug: 'skoda', color: '#4BA82E' },
  { name: 'Smart', slug: 'smart', color: '#FFD100' },
  { name: 'Subaru', slug: 'subaru', color: '#003DA5' },
  { name: 'Suzuki', slug: 'suzuki', color: '#E30613' },
  { name: 'Tesla', slug: 'tesla', color: '#CC0000' },
  { name: 'Toyota', slug: 'toyota', color: '#EB0A1E' },
  { name: 'Volkswagen', slug: 'volkswagen', color: '#001E50' },
  { name: 'Volvo', slug: 'volvo', color: '#003057' },
  { name: 'Other', slug: null, color: '#6B7280' },
].sort((a, b) => a.name.localeCompare(b.name));

/**
 * Convert brand name to URL slug for logo dataset
 * Removes special characters, converts to lowercase, replaces spaces with hyphens
 */
function brandNameToSlug(brandName: string): string {
  return brandName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
}

/**
 * Get the logo URL for a brand from the car-logos-dataset
 */
export function getBrandLogo(brandName: string): string {
  const brand = CAR_BRANDS.find(b => b.name.toLowerCase() === brandName.toLowerCase());

  if (!brand) {
    return '';
  }

  // Use custom slug if provided, otherwise generate from name
  const slug = brand.slug || brandNameToSlug(brand.name);

  if (!slug) {
    return '';
  }

  return `${LOGO_BASE_URL}/${slug}.png`;
}

/**
 * Get the brand color for fallback display
 */
export function getBrandColor(brandName: string): string {
  const brand = CAR_BRANDS.find(b => b.name.toLowerCase() === brandName.toLowerCase());
  return brand?.color || '#6B7280'; // Default gray color
}

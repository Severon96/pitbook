export interface CarBrand {
  name: string;
  logo: string;
  color?: string; // Brand color for fallback styling
}

// Car brand logos - using brand favicons from official websites
// Falls back to styled initials if logo unavailable
export const CAR_BRANDS: CarBrand[] = [
  { name: 'Acura', logo: '', color: '#000000' },
  { name: 'Alfa Romeo', logo: '', color: '#DC0714' },
  { name: 'Aston Martin', logo: '', color: '#003F2D' },
  { name: 'Audi', logo: '', color: '#BB0A30' },
  { name: 'Bentley', logo: '', color: '#006633' },
  { name: 'BMW', logo: '', color: '#1C69D4' },
  { name: 'Bugatti', logo: '', color: '#BE0000' },
  { name: 'Buick', logo: '', color: '#002868' },
  { name: 'Cadillac', logo: '', color: '#002868' },
  { name: 'Chevrolet', logo: '', color: '#FFC72C' },
  { name: 'Chrysler', logo: '', color: '#003DA5' },
  { name: 'Citroën', logo: '', color: '#DC001E' },
  { name: 'Dacia', logo: '', color: '#5B6770' },
  { name: 'Daihatsu', logo: '', color: '#DC0714' },
  { name: 'DeLorean', logo: '', color: '#8B8D8F' },
  { name: 'Dodge', logo: '', color: '#DC0000' },
  { name: 'Ferrari', logo: '', color: '#DC0000' },
  { name: 'Fiat', logo: '', color: '#9D2235' },
  { name: 'Ford', logo: '', color: '#003478' },
  { name: 'Genesis', logo: '', color: '#000000' },
  { name: 'GMC', logo: '', color: '#C8102E' },
  { name: 'Honda', logo: '', color: '#CC0000' },
  { name: 'Hummer', logo: '', color: '#FFD700' },
  { name: 'Hyundai', logo: '', color: '#002C5F' },
  { name: 'Infiniti', logo: '', color: '#000000' },
  { name: 'Isuzu', logo: '', color: '#E4003A' },
  { name: 'Jaguar', logo: '', color: '#000000' },
  { name: 'Jeep', logo: '', color: '#154734' },
  { name: 'Kia', logo: '', color: '#05141F' },
  { name: 'Koenigsegg', logo: '', color: '#FFD700' },
  { name: 'Lada', logo: '', color: '#1560BD' },
  { name: 'Lamborghini', logo: '', color: '#FFD700' },
  { name: 'Lancia', logo: '', color: '#003DA5' },
  { name: 'Land Rover', logo: '', color: '#005A2B' },
  { name: 'Lexus', logo: '', color: '#000000' },
  { name: 'Lincoln', logo: '', color: '#5A6268' },
  { name: 'Lotus', logo: '', color: '#FFD700' },
  { name: 'Maserati', logo: '', color: '#0C2340' },
  { name: 'Maybach', logo: '', color: '#000000' },
  { name: 'Mazda', logo: '', color: '#003087' },
  { name: 'McLaren', logo: '', color: '#FF8000' },
  { name: 'Mercedes-Benz', logo: '', color: '#00ADEF' },
  { name: 'Mini', logo: '', color: '#000000' },
  { name: 'Mitsubishi', logo: '', color: '#E60012' },
  { name: 'Nissan', logo: '', color: '#C3002F' },
  { name: 'Oldsmobile', logo: '', color: '#003DA5' },
  { name: 'Opel', logo: '', color: '#FFD100' },
  { name: 'Pagani', logo: '', color: '#1C3F6E' },
  { name: 'Peugeot', logo: '', color: '#003DA5' },
  { name: 'Plymouth', logo: '', color: '#DC0000' },
  { name: 'Polestar', logo: '', color: '#000000' },
  { name: 'Pontiac', logo: '', color: '#DC0000' },
  { name: 'Porsche', logo: '', color: '#D5001C' },
  { name: 'Ram', logo: '', color: '#5B6770' },
  { name: 'Renault', logo: '', color: '#FFCC00' },
  { name: 'Rivian', logo: '', color: '#0B6E4F' },
  { name: 'Rolls-Royce', logo: '', color: '#680C07' },
  { name: 'Saab', logo: '', color: '#003087' },
  { name: 'Saturn', logo: '', color: '#DC0000' },
  { name: 'SEAT', logo: '', color: '#E2001A' },
  { name: 'Škoda', logo: '', color: '#4BA82E' },
  { name: 'Smart', logo: '', color: '#FFD100' },
  { name: 'Subaru', logo: '', color: '#003DA5' },
  { name: 'Suzuki', logo: '', color: '#E30613' },
  { name: 'Tesla', logo: '', color: '#CC0000' },
  { name: 'Toyota', logo: '', color: '#EB0A1E' },
  { name: 'Volkswagen', logo: '', color: '#001E50' },
  { name: 'Volvo', logo: '', color: '#003057' },
  { name: 'Other', logo: '' },
].sort((a, b) => a.name.localeCompare(b.name));

export function getBrandLogo(brandName: string): string {
  const brand = CAR_BRANDS.find(b => b.name.toLowerCase() === brandName.toLowerCase());
  return brand?.logo || '';
}

export function getBrandColor(brandName: string): string {
  const brand = CAR_BRANDS.find(b => b.name.toLowerCase() === brandName.toLowerCase());
  return brand?.color || '#6B7280'; // Default gray color
}

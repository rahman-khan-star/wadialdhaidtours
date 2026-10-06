import type { AirportOption, FlightPlace } from "@/types";

export interface AirportRecord extends FlightPlace {
  lat: number;
  lon: number;
  // Offset from UTC in minutes (standard time).
  tz: number;
}

// [iata, city, country, airport name, lat, lon, tz minutes]
type AirportTuple = [string, string, string, string, number, number, number];

const AIRPORT_ROWS: AirportTuple[] = [
  // Pakistan
  ["KHI", "Karachi", "Pakistan", "Jinnah International Airport", 24.9065, 67.1608, 300],
  ["LHE", "Lahore", "Pakistan", "Allama Iqbal International Airport", 31.5216, 74.4036, 300],
  ["ISB", "Islamabad", "Pakistan", "Islamabad International Airport", 33.5607, 72.8516, 300],
  ["PEW", "Peshawar", "Pakistan", "Bacha Khan International Airport", 33.9938, 71.5146, 300],
  ["UET", "Quetta", "Pakistan", "Quetta International Airport", 30.2513, 66.9377, 300],
  ["MUX", "Multan", "Pakistan", "Multan International Airport", 30.2032, 71.4191, 300],
  ["GIL", "Gilgit", "Pakistan", "Gilgit Airport", 35.9188, 74.3347, 300],
  ["KDU", "Skardu", "Pakistan", "Skardu Airport", 35.3355, 75.539, 300],
  // United Arab Emirates
  ["DXB", "Dubai", "United Arab Emirates", "Dubai International Airport", 25.2532, 55.3657, 240],
  ["AUH", "Abu Dhabi", "United Arab Emirates", "Zayed International Airport", 24.433, 54.6511, 240],
  ["SHJ", "Sharjah", "United Arab Emirates", "Sharjah International Airport", 25.3285, 55.5172, 240],
  ["RKT", "Ras Al Khaimah", "United Arab Emirates", "Ras Al Khaimah International Airport", 25.6132, 55.9389, 240],
  ["AAN", "Al Ain", "United Arab Emirates", "Al Ain International Airport", 24.2617, 55.6092, 240],
  // Gulf
  ["RUH", "Riyadh", "Saudi Arabia", "King Khalid International Airport", 24.9576, 46.6988, 180],
  ["JED", "Jeddah", "Saudi Arabia", "King Abdulaziz International Airport", 21.6796, 39.1565, 180],
  ["DMM", "Dammam", "Saudi Arabia", "King Fahd International Airport", 26.4712, 49.7979, 180],
  ["MED", "Madinah", "Saudi Arabia", "Prince Mohammad Bin Abdulaziz Airport", 24.5534, 39.7051, 180],
  ["TIF", "Taif", "Saudi Arabia", "Taif International Airport", 21.4834, 40.5405, 180],
  ["DOH", "Doha", "Qatar", "Hamad International Airport", 25.2731, 51.6081, 180],
  ["BAH", "Manama", "Bahrain", "Bahrain International Airport", 26.2708, 50.6336, 180],
  ["KWI", "Kuwait City", "Kuwait", "Kuwait International Airport", 29.2266, 47.9689, 180],
  ["MCT", "Muscat", "Oman", "Muscat International Airport", 23.5933, 58.2844, 240],
  ["SLL", "Salalah", "Oman", "Salalah Airport", 18.033, 54.0914, 240],
  // Levant & Iraq
  ["AMM", "Amman", "Jordan", "Queen Alia International Airport", 31.7226, 35.9932, 180],
  ["BEY", "Beirut", "Lebanon", "Beirut-Rafic Hariri International Airport", 33.8208, 35.4884, 120],
  ["BGW", "Baghdad", "Iraq", "Baghdad International Airport", 33.2625, 44.2346, 180],
  ["EBL", "Erbil", "Iraq", "Erbil International Airport", 36.2381, 43.9632, 180],
  ["IKA", "Tehran", "Iran", "Imam Khomeini International Airport", 35.4161, 51.1522, 210],
  ["TLV", "Tel Aviv", "Israel", "Ben Gurion Airport", 32.0114, 34.8867, 120],
  ["SAH", "Sanaa", "Yemen", "Sanaa International Airport", 15.4764, 44.2269, 180],
  // North Africa
  ["CAI", "Cairo", "Egypt", "Cairo International Airport", 30.1219, 31.4056, 120],
  ["HRG", "Hurghada", "Egypt", "Hurghada International Airport", 27.1783, 33.7994, 120],
  ["SSH", "Sharm El Sheikh", "Egypt", "Sharm El Sheikh International Airport", 27.9158, 34.3899, 120],
  ["KRT", "Khartoum", "Sudan", "Khartoum International Airport", 15.5897, 32.5599, 120],
  ["MJI", "Tripoli", "Libya", "Mitiga International Airport", 32.6635, 13.159, 120],
  ["CMN", "Casablanca", "Morocco", "Mohammed V International Airport", 33.3675, -7.5898, 60],
  ["RAK", "Marrakesh", "Morocco", "Marrakesh Menara Airport", 31.6069, -8.0363, 60],
  ["ALG", "Algiers", "Algeria", "Houari Boumediene Airport", 36.691, 3.2154, 60],
  ["TUN", "Tunis", "Tunisia", "Tunis-Carthage International Airport", 36.851, 10.2272, 60],
  // Africa
  ["LOS", "Lagos", "Nigeria", "Murtala Muhammed International Airport", 6.5774, 3.3212, 60],
  ["ABV", "Abuja", "Nigeria", "Nnamdi Azikiwe International Airport", 9.0068, 7.2632, 60],
  ["ACC", "Accra", "Ghana", "Kotoka International Airport", 5.6052, -0.1668, 0],
  ["NBO", "Nairobi", "Kenya", "Jomo Kenyatta International Airport", -1.3192, 36.9278, 180],
  ["ADD", "Addis Ababa", "Ethiopia", "Addis Ababa Bole International Airport", 8.9779, 38.7993, 180],
  ["JNB", "Johannesburg", "South Africa", "O. R. Tambo International Airport", -26.1392, 28.246, 120],
  ["CPT", "Cape Town", "South Africa", "Cape Town International Airport", -33.9715, 18.6021, 120],
  // South Asia
  ["DEL", "Delhi", "India", "Indira Gandhi International Airport", 28.5562, 77.1, 330],
  ["BOM", "Mumbai", "India", "Chhatrapati Shivaji Maharaj International Airport", 19.0896, 72.8656, 330],
  ["MAA", "Chennai", "India", "Chennai International Airport", 12.9941, 80.1709, 330],
  ["BLR", "Bengaluru", "India", "Kempegowda International Airport", 13.1986, 77.7066, 330],
  ["HYD", "Hyderabad", "India", "Rajiv Gandhi International Airport", 17.2403, 78.4294, 330],
  ["CCU", "Kolkata", "India", "Netaji Subhas Chandra Bose International Airport", 22.6547, 88.4467, 330],
  ["COK", "Kochi", "India", "Cochin International Airport", 9.9477, 76.2733, 330],
  ["GOI", "Goa", "India", "Manohar International Airport", 15.3808, 73.8314, 330],
  ["DAC", "Dhaka", "Bangladesh", "Hazrat Shahjalal International Airport", 23.8433, 90.3978, 360],
  ["CMB", "Colombo", "Sri Lanka", "Bandaranaike International Airport", 7.1808, 79.8841, 330],
  ["KTM", "Kathmandu", "Nepal", "Tribhuvan International Airport", 27.6966, 85.3591, 345],
  ["KBL", "Kabul", "Afghanistan", "Hamid Karzai International Airport", 34.5653, 69.2075, 270],
  // Central Asia & Caucasus
  ["ALA", "Almaty", "Kazakhstan", "Almaty International Airport", 43.3521, 77.0405, 360],
  ["NQZ", "Astana", "Kazakhstan", "Nursultan Nazarbayev International Airport", 51.0222, 71.4669, 360],
  ["TAS", "Tashkent", "Uzbekistan", "Islam Karimov Tashkent International Airport", 41.2579, 69.2812, 300],
  ["GYD", "Baku", "Azerbaijan", "Heydar Aliyev International Airport", 40.4675, 50.0467, 240],
  // East Asia
  ["PEK", "Beijing", "China", "Beijing Capital International Airport", 40.0799, 116.6031, 480],
  ["PVG", "Shanghai", "China", "Shanghai Pudong International Airport", 31.1443, 121.8083, 480],
  ["CAN", "Guangzhou", "China", "Guangzhou Baiyun International Airport", 23.3924, 113.2988, 480],
  ["HKG", "Hong Kong", "Hong Kong SAR", "Hong Kong International Airport", 22.308, 113.9185, 480],
  ["TPE", "Taipei", "Taiwan", "Taiwan Taoyuan International Airport", 25.0777, 121.2328, 480],
  ["NRT", "Tokyo", "Japan", "Narita International Airport", 35.772, 140.3929, 540],
  ["HND", "Tokyo", "Japan", "Haneda Airport", 35.5494, 139.7798, 540],
  ["KIX", "Osaka", "Japan", "Kansai International Airport", 34.4342, 135.2328, 540],
  ["ICN", "Seoul", "South Korea", "Incheon International Airport", 37.4602, 126.4407, 540],
  // Southeast Asia
  ["BKK", "Bangkok", "Thailand", "Suvarnabhumi Airport", 13.69, 100.7501, 420],
  ["HKT", "Phuket", "Thailand", "Phuket International Airport", 8.1132, 98.3169, 420],
  ["SIN", "Singapore", "Singapore", "Singapore Changi Airport", 1.3644, 103.9915, 480],
  ["KUL", "Kuala Lumpur", "Malaysia", "Kuala Lumpur International Airport", 2.7456, 101.7099, 480],
  ["CGK", "Jakarta", "Indonesia", "Soekarno-Hatta International Airport", -6.1256, 106.6559, 420],
  ["DPS", "Denpasar", "Indonesia", "Ngurah Rai International Airport", -8.7482, 115.1675, 480],
  ["MNL", "Manila", "Philippines", "Ninoy Aquino International Airport", 14.5086, 121.0197, 480],
  ["SGN", "Ho Chi Minh City", "Vietnam", "Tan Son Nhat International Airport", 10.8188, 106.652, 420],
  ["HAN", "Hanoi", "Vietnam", "Noi Bai International Airport", 21.2212, 105.8072, 420],
  // Turkey & Europe
  ["IST", "Istanbul", "Turkey", "Istanbul Airport", 41.2753, 28.7519, 180],
  ["SAW", "Istanbul", "Turkey", "Sabiha Gokcen International Airport", 40.8986, 29.3092, 180],
  ["AYT", "Antalya", "Turkey", "Antalya Airport", 36.8987, 30.8005, 180],
  ["LHR", "London", "United Kingdom", "Heathrow Airport", 51.47, -0.4543, 0],
  ["LGW", "London", "United Kingdom", "Gatwick Airport", 51.1537, -0.1821, 0],
  ["MAN", "Manchester", "United Kingdom", "Manchester Airport", 53.3537, -2.275, 0],
  ["EDI", "Edinburgh", "United Kingdom", "Edinburgh Airport", 55.95, -3.3725, 0],
  ["CDG", "Paris", "France", "Charles de Gaulle Airport", 49.0097, 2.5479, 60],
  ["ORY", "Paris", "France", "Orly Airport", 48.7233, 2.3794, 60],
  ["FRA", "Frankfurt", "Germany", "Frankfurt Airport", 50.0379, 8.5622, 60],
  ["MUC", "Munich", "Germany", "Munich Airport", 48.3538, 11.7861, 60],
  ["BER", "Berlin", "Germany", "Berlin Brandenburg Airport", 52.3667, 13.5033, 60],
  ["AMS", "Amsterdam", "Netherlands", "Amsterdam Airport Schiphol", 52.3105, 4.7683, 60],
  ["MAD", "Madrid", "Spain", "Adolfo Suarez Madrid-Barajas Airport", 40.4719, -3.5626, 60],
  ["BCN", "Barcelona", "Spain", "Josep Tarradellas Barcelona-El Prat Airport", 41.2974, 2.0833, 60],
  ["FCO", "Rome", "Italy", "Leonardo da Vinci-Fiumicino Airport", 41.8003, 12.2389, 60],
  ["MXP", "Milan", "Italy", "Milan Malpensa Airport", 45.6306, 8.7281, 60],
  ["ZRH", "Zurich", "Switzerland", "Zurich Airport", 47.4647, 8.5492, 60],
  ["SVO", "Moscow", "Russia", "Sheremetyevo International Airport", 55.9726, 37.4146, 180],
  ["WAW", "Warsaw", "Poland", "Warsaw Chopin Airport", 52.1657, 20.9671, 60],
  ["ARN", "Stockholm", "Sweden", "Stockholm Arlanda Airport", 59.6519, 17.9186, 60],
  ["OSL", "Oslo", "Norway", "Oslo Airport Gardermoen", 60.1939, 11.1004, 60],
  ["CPH", "Copenhagen", "Denmark", "Copenhagen Airport", 55.618, 12.656, 60],
  ["DUB", "Dublin", "Ireland", "Dublin Airport", 53.4213, -6.2701, 60],
  ["LIS", "Lisbon", "Portugal", "Humberto Delgado Airport", 38.7742, -9.1342, 60],
  ["ATH", "Athens", "Greece", "Athens International Airport", 37.9364, 23.9445, 120],
  ["OTP", "Bucharest", "Romania", "Henri Coanda International Airport", 44.5711, 26.085, 120],
  ["KBP", "Kyiv", "Ukraine", "Boryspil International Airport", 50.345, 30.8947, 120],
  // Americas
  ["JFK", "New York", "United States", "John F. Kennedy International Airport", 40.6413, -73.7781, -300],
  ["LAX", "Los Angeles", "United States", "Los Angeles International Airport", 33.9416, -118.4085, -480],
  ["ORD", "Chicago", "United States", "O'Hare International Airport", 41.9742, -87.9073, -360],
  ["SFO", "San Francisco", "United States", "San Francisco International Airport", 37.6213, -122.379, -480],
  ["IAH", "Houston", "United States", "George Bush Intercontinental Airport", 29.9902, -95.3368, -360],
  ["DFW", "Dallas", "United States", "Dallas/Fort Worth International Airport", 32.8998, -97.0403, -360],
  ["MIA", "Miami", "United States", "Miami International Airport", 25.7959, -80.287, -300],
  ["ATL", "Atlanta", "United States", "Hartsfield-Jackson Atlanta International Airport", 33.6407, -84.4277, -300],
  ["BOS", "Boston", "United States", "Boston Logan International Airport", 42.3656, -71.0096, -300],
  ["IAD", "Washington", "United States", "Washington Dulles International Airport", 38.9531, -77.4565, -300],
  ["YYZ", "Toronto", "Canada", "Toronto Pearson International Airport", 43.6777, -79.6248, -300],
  ["YVR", "Vancouver", "Canada", "Vancouver International Airport", 49.1967, -123.1815, -480],
  ["CUN", "Cancun", "Mexico", "Cancun International Airport", 21.0365, -86.8771, -360],
  ["GRU", "Sao Paulo", "Brazil", "Sao Paulo/Guarulhos International Airport", -23.4356, -46.4731, -180],
  // Oceania
  ["SYD", "Sydney", "Australia", "Kingsford Smith Airport", -33.9399, 151.1753, 600],
  ["MEL", "Melbourne", "Australia", "Melbourne Airport", -37.669, 144.841, 600],
  ["BNE", "Brisbane", "Australia", "Brisbane Airport", -27.3842, 153.1175, 600],
  ["AKL", "Auckland", "New Zealand", "Auckland Airport", -37.0082, 174.785, 720],
];

const AIRPORTS: AirportRecord[] = AIRPORT_ROWS.map(
  ([iata, city, country, name, lat, lon, tz]) => ({
    iata,
    city,
    country,
    name,
    lat,
    lon,
    tz,
  })
);

// Duplicate IATA codes (e.g. two Marrakesh-style collisions) keep the first row.
const AIRPORTS_BY_IATA = new Map<string, AirportRecord>();
for (const airport of AIRPORTS) {
  if (!AIRPORTS_BY_IATA.has(airport.iata)) AIRPORTS_BY_IATA.set(airport.iata, airport);
}

// Airports the mock provider commonly routes through when a flight stops.
const HUB_IATA = ["DXB", "DOH", "IST", "AUH", "RUH", "KHI", "DEL", "SIN", "LHR", "AMS", "FRA"];

export function getAllAirports(): AirportRecord[] {
  return Array.from(AIRPORTS_BY_IATA.values());
}

export function getAirportByIata(iata: string): AirportRecord | null {
  return AIRPORTS_BY_IATA.get(iata.trim().toUpperCase()) ?? null;
}

export function toAirportOption(airport: AirportRecord): AirportOption {
  return {
    id: airport.iata,
    iata: airport.iata,
    name: airport.name,
    city: airport.city,
    country: airport.country,
  };
}

export function toFlightPlace(airport: AirportRecord): FlightPlace {
  return {
    iata: airport.iata,
    name: airport.name,
    city: airport.city,
    country: airport.country,
  };
}

function score(candidate: AirportRecord, needle: string): number {
  const n = needle.toLowerCase();
  const iata = candidate.iata.toLowerCase();
  const city = candidate.city.toLowerCase();
  const country = candidate.country.toLowerCase();
  const name = candidate.name.toLowerCase();

  if (iata === n) return 1000;
  if (city === n) return 900;
  if (name === n) return 850;
  if (iata.startsWith(n)) return 700;
  if (city.startsWith(n)) return 600;
  if (country.startsWith(n)) return 500;
  if (name.startsWith(n)) return 450;
  if (city.includes(n)) return 300;
  if (country.includes(n)) return 250;
  if (name.includes(n)) return 200;
  return 0;
}

// Free-text airport/city lookup. Works with IATA codes, city names, country
// names and airport names so a real provider can replace this later without
// changing the UI contract.
export function searchAirportRecords(query: string, limit = 12): AirportRecord[] {
  const needle = query.trim();
  if (!needle) {
    return Array.from(AIRPORTS_BY_IATA.values()).slice(0, limit);
  }

  const scored: { airport: AirportRecord; value: number }[] = [];
  for (const airport of AIRPORTS_BY_IATA.values()) {
    const value = score(airport, needle);
    if (value > 0) scored.push({ airport, value });
  }

  scored.sort((a, b) => b.value - a.value || a.airport.city.localeCompare(b.airport.city));
  return scored.slice(0, limit).map((entry) => entry.airport);
}

// Resolves a user-supplied reference (IATA code, city or airport name) to a
// single airport, preferring exact matches.
export function resolveAirportReference(reference: string): AirportRecord | null {
  const trimmed = reference.trim();
  if (!trimmed) return null;

  const exact = searchAirportRecords(trimmed, 1)[0];
  if (!exact) return null;
  return score(exact, trimmed) > 0 ? exact : null;
}

export function pickHub(excluded: string[]): string | null {
  const blocked = new Set(excluded.map((code) => code.toUpperCase()));
  const available = HUB_IATA.filter((code) => !blocked.has(code));
  if (available.length === 0) return null;
  return available[0];
}

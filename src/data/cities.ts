// ACC schools (excluding UVA and UNC)
export const CAMPUS_TO_CITY: Record<string, string> = {
  'Boston College': 'Chestnut Hill, MA',
  'Clemson': 'Clemson, SC',
  'Duke': 'Durham, NC',
  'Florida State': 'Tallahassee, FL',
  'FSU': 'Tallahassee, FL',
  'Georgia Tech': 'Atlanta, GA',
  'Louisville': 'Louisville, KY',
  'Miami': 'Coral Gables, FL',
  'NC State': 'Raleigh, NC',
  'Notre Dame': 'South Bend, IN',
  'Pitt': 'Pittsburgh, PA',
  'Syracuse': 'Syracuse, NY',
  'Virginia Tech': 'Blacksburg, VA',
  'VT': 'Blacksburg, VA',
  'Wake Forest': 'Winston-Salem, NC',
  'Cal': 'Berkeley, CA',
  'SMU': 'Dallas, TX',
  'Stanford': 'Stanford, CA',
};

export function cityFromCampus(campus: string): string | null {
  if (!campus) return null;
  if (CAMPUS_TO_CITY[campus]) return CAMPUS_TO_CITY[campus];
  const lower = campus.toLowerCase().trim();
  for (const [key, city] of Object.entries(CAMPUS_TO_CITY)) {
    if (lower === key.toLowerCase()) return city;
  }
  for (const [key, city] of Object.entries(CAMPUS_TO_CITY)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return city;
  }
  return null;
}

// Get unique cities for leaderboard filtering
export function getAllCities(): string[] {
  return [...new Set(Object.values(CAMPUS_TO_CITY))].sort();
}

// Featured cities always shown in leaderboard
export const FEATURED_CITIES = ['San Francisco, CA', 'Chicago, IL', 'Washington, DC'];

// All selectable cities for non-university users
export function getSelectableCities(): string[] {
  return [...new Set([...FEATURED_CITIES, ...Object.values(CAMPUS_TO_CITY)])].sort();
}

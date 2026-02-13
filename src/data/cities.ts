// Cities are dynamically derived from campus mappings - any city with a university is valid
export const CAMPUS_TO_CITY: Record<string, string> = {
  // California
  'Stanford': 'Stanford, CA', 'USF': 'San Francisco, CA', 'SFSU': 'San Francisco, CA',
  'Berkeley': 'Berkeley, CA', 'UC Berkeley': 'Berkeley, CA', 'UCLA': 'Los Angeles, CA',
  'USC': 'Los Angeles, CA', 'UCSD': 'San Diego, CA', 'UC Davis': 'Davis, CA',
  'UC Irvine': 'Irvine, CA', 'UC Santa Barbara': 'Santa Barbara, CA',
  'Cal Poly': 'San Luis Obispo, CA', 'Cal Poly SLO': 'San Luis Obispo, CA',
  'Cal Poly Pomona': 'Pomona, CA', 'San Jose State': 'San Jose, CA',
  // Illinois
  'Northwestern': 'Evanston, IL', 'UChicago': 'Chicago, IL', 'DePaul': 'Chicago, IL',
  'Loyola Chicago': 'Chicago, IL', 'UIC': 'Chicago, IL', 'IIT': 'Chicago, IL',
  'UIUC': 'Champaign, IL', 'University of Illinois': 'Champaign, IL',
  'Illinois State': 'Normal, IL', 'SIU': 'Carbondale, IL',
  // DC / Maryland / Virginia
  'Georgetown': 'Washington, DC', 'GWU': 'Washington, DC', 'American': 'Washington, DC',
  'Howard': 'Washington, DC', 'Catholic': 'Washington, DC',
  'Virginia Tech': 'Blacksburg, VA', 'VT': 'Blacksburg, VA',
  'UVA': 'Charlottesville, VA', 'University of Virginia': 'Charlottesville, VA',
  'JMU': 'Harrisonburg, VA', 'James Madison': 'Harrisonburg, VA',
  'VCU': 'Richmond, VA', 'GMU': 'Fairfax, VA', 'George Mason': 'Fairfax, VA',
  'Liberty': 'Lynchburg, VA', 'William & Mary': 'Williamsburg, VA',
  'UMD': 'College Park, MD', 'University of Maryland': 'College Park, MD',
  'Johns Hopkins': 'Baltimore, MD', 'Towson': 'Towson, MD',
  // New York
  'NYU': 'New York, NY', 'Columbia': 'New York, NY', 'Fordham': 'New York, NY',
  'Cornell': 'Ithaca, NY', 'Syracuse': 'Syracuse, NY', 'RPI': 'Troy, NY',
  'Binghamton': 'Binghamton, NY', 'Stony Brook': 'Stony Brook, NY',
  'University at Buffalo': 'Buffalo, NY', 'RIT': 'Rochester, NY',
  // Massachusetts
  'MIT': 'Cambridge, MA', 'Harvard': 'Cambridge, MA', 'Boston University': 'Boston, MA',
  'BU': 'Boston, MA', 'BC': 'Chestnut Hill, MA', 'Northeastern': 'Boston, MA',
  'Tufts': 'Medford, MA', 'UMass Amherst': 'Amherst, MA', 'WPI': 'Worcester, MA',
  // Pennsylvania
  'Penn State': 'State College, PA', 'UPenn': 'Philadelphia, PA', 'Drexel': 'Philadelphia, PA',
  'Temple': 'Philadelphia, PA', 'Pitt': 'Pittsburgh, PA', 'CMU': 'Pittsburgh, PA',
  'Carnegie Mellon': 'Pittsburgh, PA', 'Lehigh': 'Bethlehem, PA',
  // Texas
  'UT Austin': 'Austin, TX', 'Texas A&M': 'College Station, TX', 'Rice': 'Houston, TX',
  'UH': 'Houston, TX', 'SMU': 'Dallas, TX', 'TCU': 'Fort Worth, TX',
  'Baylor': 'Waco, TX', 'Texas Tech': 'Lubbock, TX', 'UTSA': 'San Antonio, TX',
  // Florida
  'UF': 'Gainesville, FL', 'University of Florida': 'Gainesville, FL',
  'FSU': 'Tallahassee, FL', 'UCF': 'Orlando, FL', 'UM': 'Coral Gables, FL',
  'USF Tampa': 'Tampa, FL', 'FIU': 'Miami, FL', 'FAU': 'Boca Raton, FL',
  // North Carolina
  'UNC': 'Chapel Hill, NC', 'Duke': 'Durham, NC', 'NC State': 'Raleigh, NC',
  'Wake Forest': 'Winston-Salem, NC', 'ECU': 'Greenville, NC', 'App State': 'Boone, NC',
  // Georgia
  'Georgia Tech': 'Atlanta, GA', 'UGA': 'Athens, GA', 'Emory': 'Atlanta, GA',
  'Kennesaw State': 'Kennesaw, GA', 'Georgia State': 'Atlanta, GA',
  // Ohio
  'Ohio State': 'Columbus, OH', 'OSU': 'Columbus, OH', 'UC': 'Cincinnati, OH',
  'Case Western': 'Cleveland, OH', 'Miami Ohio': 'Oxford, OH', 'Kent State': 'Kent, OH',
  // Michigan
  'University of Michigan': 'Ann Arbor, MI', 'Michigan State': 'East Lansing, MI',
  'MSU': 'East Lansing, MI', 'Wayne State': 'Detroit, MI', 'WMU': 'Kalamazoo, MI',
  // Other
  'University of Washington': 'Seattle, WA', 'UW': 'Seattle, WA',
  'Oregon': 'Eugene, OR', 'Oregon State': 'Corvallis, OR',
  'CU Boulder': 'Boulder, CO', 'University of Colorado': 'Boulder, CO',
  'ASU': 'Tempe, AZ', 'Arizona State': 'Tempe, AZ', 'UA': 'Tucson, AZ',
  'University of Arizona': 'Tucson, AZ',
  'Purdue': 'West Lafayette, IN', 'IU': 'Bloomington, IN', 'Notre Dame': 'South Bend, IN',
  'University of Iowa': 'Iowa City, IA', 'Iowa State': 'Ames, IA',
  'University of Minnesota': 'Minneapolis, MN', 'UMN': 'Minneapolis, MN',
  'University of Wisconsin': 'Madison, WI', 'UW Madison': 'Madison, WI',
  'Vanderbilt': 'Nashville, TN', 'University of Tennessee': 'Knoxville, TN',
  'Alabama': 'Tuscaloosa, AL', 'Auburn': 'Auburn, AL',
  'LSU': 'Baton Rouge, LA', 'Tulane': 'New Orleans, LA',
  'Ole Miss': 'Oxford, MS', 'Mississippi State': 'Starkville, MS',
  'University of South Carolina': 'Columbia, SC', 'Clemson': 'Clemson, SC',
  'University of Kentucky': 'Lexington, KY', 'Louisville': 'Louisville, KY',
  'WVU': 'Morgantown, WV', 'University of Arkansas': 'Fayetteville, AR',
  'University of Oklahoma': 'Norman, OK', 'Oklahoma State': 'Stillwater, OK',
  'University of Nebraska': 'Lincoln, NE', 'Kansas': 'Lawrence, KS',
  'Mizzou': 'Columbia, MO', 'WUSTL': 'St. Louis, MO',
  'Rutgers': 'New Brunswick, NJ', 'Princeton': 'Princeton, NJ',
  'UConn': 'Storrs, CT', 'Yale': 'New Haven, CT',
  'Brown': 'Providence, RI', 'URI': 'Kingston, RI',
  'Dartmouth': 'Hanover, NH', 'UNH': 'Durham, NH',
  'UVM': 'Burlington, VT',
};

export function cityFromCampus(campus: string): string | null {
  if (!campus) return null;
  // Direct match
  if (CAMPUS_TO_CITY[campus]) return CAMPUS_TO_CITY[campus];
  // Case-insensitive match
  const lower = campus.toLowerCase().trim();
  for (const [key, city] of Object.entries(CAMPUS_TO_CITY)) {
    if (lower === key.toLowerCase()) return city;
  }
  // Partial match
  for (const [key, city] of Object.entries(CAMPUS_TO_CITY)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return city;
  }
  return null;
}

// Get unique cities for leaderboard filtering — only cities that have mapped universities
export function getAllCities(): string[] {
  return [...new Set(Object.values(CAMPUS_TO_CITY))].sort();
}

// Featured cities always shown in leaderboard even if no users yet
export const FEATURED_CITIES = ['San Francisco, CA', 'Chicago, IL', 'Washington, DC'];

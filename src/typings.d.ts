interface VaccinationDataEntry {
  date: string;
  daily_vaccinations: number;
  daily_vaccinations_per_million?: number;
  total_vaccinations?: number;
  daily_vaccinations_raw?: number;
  total_vaccinations_per_hundred?: number;
  people_vaccinated?: number;
  people_vaccinated_per_hundred?: number;
  people_fully_vaccinated?: number;
  people_fully_vaccinated_per_hundred?: number;
}

interface VaccinationDataPerCountry {
  country: Country;
  shortName: string;
  iso_code: IsoCode;
  alpha2: string;
  imageUrl: string;
  latest: VaccinationDataEntry;
  projectedFirstDose?: VaccinationDataEntry;
  projectedFullDose?: VaccinationDataEntry;
  projectedDataFirstDose?: VaccinationDataEntry[];
  projectedDataFullDose?: VaccinationDataEntry[];
  data: VaccinationDataEntry[];
  date: string;
}

type IsoCode =
  | 'ALB'
  | 'DZA'
  | 'AND'
  | 'AGO'
  | 'AIA'
  | 'ARG'
  | 'AUS'
  | 'AUT'
  | 'AZE'
  | 'BHR'
  | 'BGD'
  | 'BRB'
  | 'BLR'
  | 'BEL'
  | 'BLZ'
  | 'BMU'
  | 'BOL'
  | 'BRA'
  | 'BGR'
  | 'KHM'
  | 'CAN'
  | 'CYM'
  | 'CHL'
  | 'CHN'
  | 'COL'
  | 'CRI'
  | 'CIV'
  | 'HRV'
  | 'CYP'
  | 'CZE'
  | 'DNK'
  | 'DMA'
  | 'DOM'
  | 'ECU'
  | 'EGY'
  | 'SLV'
  | 'EST'
  | 'OWID_EUN'
  | 'FRO'
  | 'FLK'
  | 'FIN'
  | 'FRA'
  | 'DEU'
  | 'GHA'
  | 'GIB'
  | 'GRC'
  | 'GRL'
  | 'GRD'
  | 'GTM'
  | 'GGY'
  | 'GUY'
  | 'HND'
  | 'HKG'
  | 'HUN'
  | 'ISL'
  | 'IND'
  | 'IDN'
  | 'IRN'
  | 'IRL'
  | 'IMN'
  | 'ISR'
  | 'ITA'
  | 'JPN'
  | 'JEY'
  | 'JOR'
  | 'KAZ'
  | 'KEN'
  | 'KWT'
  | 'LVA'
  | 'LBN'
  | 'LIE'
  | 'LTU'
  | 'LUX'
  | 'MAC'
  | 'MYS'
  | 'MDV'
  | 'MLT'
  | 'MUS'
  | 'MEX'
  | 'MDA'
  | 'MCO'
  | 'MNG'
  | 'MNE'
  | 'MSR'
  | 'MAR'
  | 'MMR'
  | 'NPL'
  | 'NLD'
  | 'NZL'
  | 'OWID_NCY'
  | 'NOR'
  | 'OMN'
  | 'PAK'
  | 'PAN'
  | 'PRY'
  | 'PER'
  | 'PHL'
  | 'POL'
  | 'PRT'
  | 'QAT'
  | 'ROU'
  | 'RUS'
  | 'RWA'
  | 'SHN'
  | 'LCA'
  | 'SMR'
  | 'SAU'
  | 'SEN'
  | 'SRB'
  | 'SYC'
  | 'SGP'
  | 'SVK'
  | 'SVN'
  | 'ZAF'
  | 'KOR'
  | 'ESP'
  | 'LKA'
  | 'SWE'
  | 'CHE'
  | 'THA'
  | 'TTO'
  | 'TUR'
  | 'TCA'
  | 'UKR'
  | 'ARE'
  | 'GBR'
  | 'USA'
  | 'URY'
  | 'VEN'
  | 'OWID_WRL'
  | 'ZWE';

type Country =
  | 'Albania'
  | 'Algeria'
  | 'Andorra'
  | 'Angola'
  | 'Anguilla'
  | 'Argentina'
  | 'Australia'
  | 'Austria'
  | 'Azerbaijan'
  | 'Bahrain'
  | 'Bangladesh'
  | 'Barbados'
  | 'Belarus'
  | 'Belgium'
  | 'Belize'
  | 'Bermuda'
  | 'Bolivia'
  | 'Brazil'
  | 'Bulgaria'
  | 'Cambodia'
  | 'Canada'
  | 'Cayman Islands'
  | 'Chile'
  | 'China'
  | 'Colombia'
  | 'Costa Rica'
  | "Cote d'Ivoire"
  | 'Croatia'
  | 'Cyprus'
  | 'Czechia'
  | 'Denmark'
  | 'Dominica'
  | 'Dominican Republic'
  | 'Ecuador'
  | 'Egypt'
  | 'El Salvador'
  | 'Estonia'
  | 'European Union'
  | 'Faeroe Islands'
  | 'Falkland Islands'
  | 'Finland'
  | 'France'
  | 'Germany'
  | 'Ghana'
  | 'Gibraltar'
  | 'Greece'
  | 'Greenland'
  | 'Grenada'
  | 'Guatemala'
  | 'Guernsey'
  | 'Guyana'
  | 'Honduras'
  | 'Hong Kong'
  | 'Hungary'
  | 'Iceland'
  | 'India'
  | 'Indonesia'
  | 'Iran'
  | 'Ireland'
  | 'Isle of Man'
  | 'Israel'
  | 'Italy'
  | 'Japan'
  | 'Jersey'
  | 'Jordan'
  | 'Kazakhstan'
  | 'Kenya'
  | 'Kuwait'
  | 'Latvia'
  | 'Lebanon'
  | 'Liechtenstein'
  | 'Lithuania'
  | 'Luxembourg'
  | 'Macao'
  | 'Malaysia'
  | 'Maldives'
  | 'Malta'
  | 'Mauritius'
  | 'Mexico'
  | 'Moldova'
  | 'Monaco'
  | 'Mongolia'
  | 'Montenegro'
  | 'Montserrat'
  | 'Morocco'
  | 'Myanmar'
  | 'Nepal'
  | 'Netherlands'
  | 'New Zealand'
  | 'Northern Cyprus'
  | 'Norway'
  | 'Oman'
  | 'Pakistan'
  | 'Panama'
  | 'Paraguay'
  | 'Peru'
  | 'Philippines'
  | 'Poland'
  | 'Portugal'
  | 'Qatar'
  | 'Romania'
  | 'Russia'
  | 'Rwanda'
  | 'Saint Helena'
  | 'Saint Lucia'
  | 'San Marino'
  | 'Saudi Arabia'
  | 'Senegal'
  | 'Serbia'
  | 'Seychelles'
  | 'Singapore'
  | 'Slovakia'
  | 'Slovenia'
  | 'South Africa'
  | 'South Korea'
  | 'Spain'
  | 'Sri Lanka'
  | 'Sweden'
  | 'Switzerland'
  | 'Thailand'
  | 'Trinidad and Tobago'
  | 'Turkey'
  | 'Turks and Caicos Islands'
  | 'Ukraine'
  | 'United Arab Emirates'
  | 'United Kingdom'
  | 'United States'
  | 'Uruguay'
  | 'Venezuela'
  | 'World'
  | 'Zimbabwe';

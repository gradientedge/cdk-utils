/** @category Enum */
export enum AzureRemoteBackend {
  azurerm = 'azurerm',
  pulumi = 'pulumi',
  local = 'local',
}

/**
 * List of Azure resources that excludes tags
 */
/** @category Constant */
export const RESOURCES_TO_EXCLUDE_TAGS = new Set([
  'ApiManagementNamedValue',
  'Application',
  'ServicePrincipal',
  'StackReference',
])

/**
 * @see https://learn.microsoft.com/en-us/azure/reliability/regions-list?tabs=all
 */
/** @category Constant */
export const AzureLocation = {
  // Americas
  BrazilSouth: 'brazilsouth',
  BrazilSoutheast: 'brazilsoutheast',
  CanadaCentral: 'canadacentral',
  CanadaEast: 'canadaeast',
  CentralUS: 'centralus',
  EastUS: 'eastus',
  EastUS2: 'eastus2',
  MexicoCentral: 'mexicocentral',
  NorthCentralUS: 'northcentralus',
  SouthCentralUS: 'southcentralus',
  USGovArizona: 'usgovarizona',
  USGovTexas: 'usgovtexas',
  USGovVirginia: 'usgovvirginia',
  WestCentralUS: 'westcentralus',
  WestUS: 'westus',
  WestUS2: 'westus2',
  WestUS3: 'westus3',

  // Europe
  AustriaCentral: 'austriacentral',
  BelgiumCentral: 'belgiumcentral',
  DenmarkEast: 'denmarkeast',
  FinlandCentral: 'finlandcentral',
  FranceCentral: 'francecentral',
  FranceSouth: 'francesouth',
  GermanyNorth: 'germanynorth',
  GermanyWestCentral: 'germanywestcentral',
  GreeceHydra: 'greecehydra',
  ItalyNorth: 'italynorth',
  NorthEurope: 'northeurope',
  NorwayEast: 'norwayeast',
  NorwayWest: 'norwaywest',
  PolandCentral: 'polandcentral',
  SpainCentral: 'spaincentral',
  SwedenCentral: 'swedencentral',
  SwedenSouth: 'swedensouth',
  SwitzerlandNorth: 'switzerlandnorth',
  SwitzerlandWest: 'switzerlandwest',
  UKSouth: 'uksouth',
  UKWest: 'ukwest',
  WestEurope: 'westeurope',

  // Middle East & Africa
  IsraelCentral: 'israelcentral',
  QatarCentral: 'qatarcentral',
  SouthAfricaNorth: 'southafricanorth',
  SouthAfricaWest: 'southafricawest',
  UAECentral: 'uaecentral',
  UAENorth: 'uaenorth',

  // Asia Pacific
  AustraliaCentral: 'australiacentral',
  AustraliaCentral2: 'australiacentral2',
  AustraliaEast: 'australiaeast',
  AustraliaSoutheast: 'australiasoutheast',
  CentralIndia: 'centralindia',
  ChinaEast: 'chinaeast',
  ChinaEast2: 'chinaeast2',
  ChinaNorth: 'chinanorth',
  ChinaNorth2: 'chinanorth2',
  ChinaNorth3: 'chinanorth3',
  EastAsia: 'eastasia',
  JapanEast: 'japaneast',
  JapanWest: 'japanwest',
  KoreaCentral: 'koreacentral',
  KoreaSouth: 'koreasouth',
  MalaysiaSouth: 'malaysiasouth',
  MalaysiaWest: 'malaysiawest',
  NewZealandNorth: 'newzealandnorth',
  SoutheastAsia: 'southeastasia',
  SouthIndia: 'southindia',
  TaiwanNorth: 'taiwannorth',
  TaiwanNorthwest: 'taiwannorthwest',
  WestIndia: 'westindia',
} as const

/** @category Interface */
export type AzureLocation = (typeof AzureLocation)[keyof typeof AzureLocation]

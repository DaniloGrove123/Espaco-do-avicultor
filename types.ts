
export interface User {
  id: string;
  username: string;
}

export type TransactionType = 'revenue' | 'expense';
export type PaymentMethod = 'pix' | 'cash';

export interface EggPackagingOption {
  id: string;
  label: string;
  eggsPerUnit: number;
}

export interface EggSaleDetails {
  packagingId: string;
  packagingLabel: string;
  unitsSold: number;
  totalEggsSold: number;
}

export interface CommercialPackagingSetting {
  packagingId: string; // ID from EGG_PACKAGING_OPTIONS
  isCommercialized: boolean;
  price: number; // Price per unit of this packaging
}

export interface Transaction {
  id:string;
  type: TransactionType;
  date: string; // ISO date string YYYY-MM-DD
  description: string;
  amount: number;
  category?: string;
  paymentMethod?: PaymentMethod;
  eggSaleDetails?: EggSaleDetails;
  freightCostApplied?: number; // Freight cost for this specific transaction
}

export interface CollectionTimeOption {
  id: string;
  label: string;
  order: number; // For sorting purposes
}

export interface EggProductionRecord {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  collectionTimeOfDayId: string; // ID from COLLECTION_TIME_OPTIONS
  quantity: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface AuthContextType extends AuthState {
  login: (username: string, password_mock: string) => Promise<boolean>;
  logout: () => void;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

export interface EggProductionSummary {
  today: number;
  currentMonth: number;
  currentYear: number;
}

export interface BusinessDetails {
  farmName: string;
  shedCount: number;
  chickenCount: number;
  currentBatchAge: string;
  commercialPackagingSettings: CommercialPackagingSetting[];
  defaultFreightCost: number;
}

export interface DataContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  eggProduction: EggProductionRecord[];
  addEggProductionRecord: (record: Omit<EggProductionRecord, 'id'>) => void;
  updateEggProductionRecord: (record: EggProductionRecord) => void; // New
  deleteEggProductionRecord: (recordId: string) => void; // New
  getFinancialSummary: () => FinancialSummary;
  getEggProductionSummary: () => EggProductionSummary;
  getMonthlyFinancialData: (year: number) => { month: string; revenue: number; expenses: number }[];
  getMonthlyEggProductionData: (year: number) => { month: string; quantity: number }[];
  getDailyEggProductionData: (days: number) => { date: string; quantity: number }[];
  getDailyPosturePercentageData: (days: number) => { date: string; percentage: number }[];
  exportDataToCSV: (type: 'financial' | 'production') => void;
  loading: boolean;
  businessDetails: BusinessDetails;
  updateBusinessDetails: (details: BusinessDetails) => void;
  getAvailableEggStock: () => number;
}

export interface ChartData {
  [key: string]: number | string;
}

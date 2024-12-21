export interface PDFInfo {
  pageCount: number;
  [key: string]: any;
}

export interface PDFPageData {
  pageUrls: string[];
  pageCount: number;
}

export interface ExtractedData {
  statement_month: string;
  total_deposits: number;
  total_withdrawals: number;
  ending_balance: number;
  transactions: Transaction[];
}

export interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
  balance: number;
}

export interface ProcessingResult {
  data: ExtractedData | null;
  error?: string;
}

export interface FinalData {
  document_id: string;
  statement_month: string;
  total_deposits: number;
  total_withdrawals: number;
  ending_balance: number;
  transactions: Transaction[];
}
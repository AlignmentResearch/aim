export interface IRunOverviewTabCSVTablesCardProps {
  artifacts: Array<{ name: string; path: string; uri: string }>;
  isRunInfoLoading: boolean;
}

export interface CSVData {
  name: string;
  uri: string;
  data: Array<Record<string, any>>;
  columns: string[];
  error?: string;
} 
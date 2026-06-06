export interface SummaryStat {
  value: string;
  label: string;
  description: string;
  tone?: "success" | "warning" | "danger";
}

export interface PredictionRow {
  client: string;
  income: string;
  debt: string;
  risk: string;
  date: string;
}

export interface SchemaField {
  name: string
  type: "string" | "integer" | "float" | "percentage"
  required: boolean
  description: string
  range?: { min: number; max: number }
  example: any
  hint?: string
  unit?: string
}

export const CSV_SCHEMA: SchemaField[] = [
  {
    name: "client_id",
    type: "integer",
    required: true,
    description: "Unique client identifier",
    range: { min: 1, max: 999999 },
    example: "1001",
    hint: "Must reference an existing real client in the system",
    unit: "ID",
  },
  {
    name: "loan_amnt",
    type: "float",
    required: true,
    description: "Requested loan amount",
    range: { min: 1000, max: 50000000 },
    example: "500000",
    hint: "Numeric value without currency symbols (e.g., 500000 not $500,000)",
    unit: "Currency",
  },
  {
    name: "annual_inc",
    type: "float",
    required: true,
    description: "Annual income of the borrower",
    range: { min: 1000, max: 100000000 },
    example: "1200000",
    hint: "Total annual income before deductions",
    unit: "Currency",
  },
  {
    name: "dti",
    type: "percentage",
    required: true,
    description: "Debt-to-income ratio",
    range: { min: 0, max: 100 },
    example: "28",
    hint: "Ratio of total monthly debt to gross monthly income",
    unit: "%",
  },
  {
    name: "fico_range_high",
    type: "integer",
    required: true,
    description: "FICO credit score (high end of range)",
    range: { min: 300, max: 850 },
    example: "710",
    hint: "Standard FICO score range from 300-850",
    unit: "Score",
  },
  {
    name: "revol_util",
    type: "percentage",
    required: true,
    description: "Revolving line utilization rate",
    range: { min: 0, max: 100 },
    example: "42",
    hint: "Percentage of available revolving credit being used",
    unit: "%",
  },
  {
    name: "open_acc",
    type: "integer",
    required: true,
    description: "Number of open credit lines",
    range: { min: 0, max: 100 },
    example: "4",
    hint: "Count of currently open credit accounts",
    unit: "Count",
  },
  {
    name: "total_acc",
    type: "integer",
    required: true,
    description: "Total number of credit accounts",
    range: { min: 0, max: 200 },
    example: "9",
    hint: "Total open and closed accounts on credit report",
    unit: "Count",
  },
  {
    name: "inq_last_6mths",
    type: "integer",
    required: true,
    description: "Inquiries made in the last 6 months",
    range: { min: 0, max: 50 },
    example: "1",
    hint: "Number of recent credit inquiries (hard inquiries only)",
    unit: "Count",
  },
  {
    name: "delinq_2yrs",
    type: "integer",
    required: true,
    description: "Delinquencies in the last 2 years",
    range: { min: 0, max: 40 },
    example: "0",
    hint: "Number of 30+ day delinquencies in 2-year history",
    unit: "Count",
  },
  {
    name: "acc_now_delinq",
    type: "integer",
    required: true,
    description: "Current delinquencies",
    range: { min: 0, max: 20 },
    example: "0",
    hint: "Number of accounts currently 30+ days delinquent",
    unit: "Count",
  },
]

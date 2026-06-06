import { CSV_SCHEMA } from "./schema"

export function generateCsvTemplate(): string {
  // Header row
  const headers = CSV_SCHEMA.map((field) => field.name).join(",")

  // Example row 1 - Good applicant (low risk)
  const row1 = [
    1001, // client_id
    500000, // loan_amnt
    1200000, // annual_inc
    28, // dti
    710, // fico_range_high
    42, // revol_util
    4, // open_acc
    9, // total_acc
    1, // inq_last_6mths
    0, // delinq_2yrs
    0, // acc_now_delinq
  ].join(",")

  // Example row 2 - Medium applicant
  const row2 = [
    1002, // client_id
    250000, // loan_amnt
    800000, // annual_inc
    35, // dti
    650, // fico_range_high
    65, // revol_util
    3, // open_acc
    8, // total_acc
    2, // inq_last_6mths
    1, // delinq_2yrs
    0, // acc_now_delinq
  ].join(",")

  // Example row 3 - High risk applicant
  const row3 = [
    1003, // client_id
    400000, // loan_amnt
    600000, // annual_inc
    45, // dti
    580, // fico_range_high
    85, // revol_util
    2, // open_acc
    6, // total_acc
    3, // inq_last_6mths
    2, // delinq_2yrs
    1, // acc_now_delinq
  ].join(",")

  return [headers, row1, row2, row3].join("\n")
}

export function generateCsvWithData(data: Record<string, any>[]): string {
  const headers = CSV_SCHEMA.map((field) => field.name).join(",")

  const rows = data.map((item) => {
    return CSV_SCHEMA.map((field) => {
      const value = item[field.name]
      return value !== undefined && value !== null ? String(value) : ""
    }).join(",")
  })

  return [headers, ...rows].join("\n")
}

export function validateCsvRow(row: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const field of CSV_SCHEMA) {
    const value = row[field.name]

    // Check required
    if (field.required && (value === undefined || value === null || String(value).trim() === "")) {
      errors.push(`${field.name} is required`)
      continue
    }

    // Check type
    if (value !== undefined && value !== null) {
      if (field.type === "integer") {
        if (!Number.isInteger(Number(value))) {
          errors.push(`${field.name} must be an integer`)
        }
      } else if (field.type === "float" || field.type === "percentage") {
        if (isNaN(Number(value))) {
          errors.push(`${field.name} must be a number`)
        }
      }

      // Check range
      if (field.range && field.type !== "string") {
        const num = Number(value)
        if (num < field.range.min || num > field.range.max) {
          errors.push(
            `${field.name} must be between ${field.range.min} and ${field.range.max}`,
          )
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

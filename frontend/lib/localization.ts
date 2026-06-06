export const algerianWilayas = [
  "01 - Adrar", "02 - Chlef", "03 - Laghouat", "04 - Oum El Bouaghi", "05 - Batna",
  "06 - Béjaïa", "07 - Biskra", "08 - Béchar", "09 - Blida", "10 - Bouira",
  "11 - Tamanrasset", "12 - Tébessa", "13 - Tlemcen", "14 - Tiaret", "15 - Tizi Ouzou",
  "16 - Alger", "17 - Djelfa", "18 - Jijel", "19 - Sétif", "20 - Saïda",
  "21 - Skikda", "22 - Sidi Bel Abbès", "23 - Annaba", "24 - Guelma", "25 - Constantine",
  "26 - Médéa", "27 - Mostaganem", "28 - M'Sila", "29 - Mascara", "30 - Ouargla",
  "31 - Oran", "32 - El Bayadh", "33 - Illizi", "34 - Bordj Bou Arréridj", "35 - Boumerdès",
  "36 - El Tarf", "37 - Tindouf", "38 - Tissemsilt", "39 - El Oued", "40 - Khenchela",
  "41 - Souk Ahras", "42 - Tipaza", "43 - Mila", "44 - Aïn Defla", "45 - Naâma",
  "46 - Aïn Témouchent", "47 - Ghardaïa", "48 - Relizane", "49 - El M'Ghair", "50 - El Meniaa",
  "51 - Ouled Djellal", "52 - Bordj Baji Mokhtar", "53 - Béni Abbès", "54 - In Salah",
  "55 - In Guezzam", "56 - Touggourt", "57 - Djanet", "58 - Timimoun"
]

/** @deprecated Use algerianWilayas instead */
export const globalRegions = algerianWilayas


export const formatCurrency = (value: number, locale = "en-US", currency = "USD") =>
  new Intl.NumberFormat(locale, { style: "currency", currency: currency, maximumFractionDigits: 0 }).format(value)

export const formatLocaleDate = (value: string | Date, locale = "en-US") =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value))

export const formatDZD = (value: number | string, locale = "en-DZ") => {
  const amount = typeof value === "number"
    ? value
    : Number(String(value).replace(/[^0-9.-]+/g, ""))
  return new Intl.NumberFormat(locale, { style: "currency", currency: "DZD", maximumFractionDigits: 0 }).format(amount)
}

export const formatDZDate = (value: string | Date, locale = "en-DZ") =>
  formatLocaleDate(value, locale)

export const isValidPhone = (value: string) => /^\+?[1-9]\d{1,14}$/.test(value.replace(/\s|-/g, ""))

// Année scolaire en cours, par exemple « 2026-2027 » : elle commence en septembre.
const today = new Date()
const year = today.getFullYear()

export const MESSAGE_YEAR =
  today.getMonth() >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`

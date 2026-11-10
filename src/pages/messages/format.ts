export function recipientsLabel(message: {
  sent?: boolean
  recipients?: string[]
}): string | undefined {
  if (!message.sent || !message.recipients?.length) return undefined
  return `À : ${message.recipients.join(", ")}`
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString("fr", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

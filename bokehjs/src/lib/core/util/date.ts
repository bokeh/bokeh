export function format_date_rfc7231(date: Date): string {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const dayOfWeek = dayNames[date.getUTCDay()]
  const day = date.getUTCDate().toString().padStart(2, "0")
  const month = monthNames[date.getUTCMonth()]
  const year = date.getUTCFullYear()
  const hour = date.getUTCHours().toString().padStart(2, "0")
  const minute = date.getUTCMinutes().toString().padStart(2, "0")
  const second = date.getUTCSeconds().toString().padStart(2, "0")

  return `${dayOfWeek}, ${day} ${month} ${year} ${hour}:${minute}:${second} GMT`
}

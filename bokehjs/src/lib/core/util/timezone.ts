const tz = require("timezone")

export default function(_value: unknown, _format?: string): string {
  return tz(...arguments)
}

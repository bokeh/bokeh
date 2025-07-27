export class CsvError extends Error {
  [key: string]: any
  code: string

  constructor(code: string, message: string | string[], ...contexts: Record<string, any>[]) {
    if (Array.isArray(message)) { message = message.join(" ") }
    super(message)
    if ("captureStackTrace" in Error && typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, CsvError)
    }
    this.code = code
    for (const context of contexts) {
      // eslint-disable-next-line
      for (const key in context) {
        const value = context[key]
        this[key] = value == null
          ? value
          : JSON.parse(JSON.stringify(value))
      }
    }
  }
}

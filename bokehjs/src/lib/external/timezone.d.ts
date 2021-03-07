declare module "timezone" {
  export default function timezone(value: unknown, format?: string, timezone?: string): string
}

declare module "timezone/loaded" {
  export default function timezone(value: unknown, format?: string, timezone?: string): string
}

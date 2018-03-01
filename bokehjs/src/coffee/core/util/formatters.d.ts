declare type RoundingFunction = "round" | "nearest" | "floor" | "rounddown" | "ceil" | "roundup"

declare module "numbro" {
  export function format(input: number | string, formatString: string, language?: string, roundingFunction?: RoundingFunction): string
}

declare module "timezone" {
  function tz(value: any, format?: string): string
  export = tz
}

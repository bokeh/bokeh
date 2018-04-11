declare module "numbro" {
  export function format(input: number | string, formatString: string, language?: string, roundingFunction?: (v: number) => number): string
}

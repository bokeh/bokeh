declare module "@bokeh/numbro" {
  export function format(input: unknown, formatString: string, language?: string, roundingFunction?: (v: number) => number): string
}

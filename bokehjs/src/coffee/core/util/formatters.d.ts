declare module "numbro" {
  export function format(input: number | string, formatString: string, language?: string, roundingFunction?: (v: number) => number): string
}

declare module "timezone" {
  function tz(value: any, format?: string): string
  export = tz
}

declare module "underscore.template" {
  function compile_template(template: string): (context: {[key: string]: any}) => string
  export = compile_template
}

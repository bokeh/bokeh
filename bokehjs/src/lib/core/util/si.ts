export const si_prefixes = [
  {symbol: "Q", factor: 1e30,  exponent: 30,  tex_symbol: "Q",    name: "quetta"},
  {symbol: "R", factor: 1e27,  exponent: 27,  tex_symbol: "R",    name: "ronna"},
  {symbol: "Y", factor: 1e24,  exponent: 24,  tex_symbol: "Y",    name: "yotta"},
  {symbol: "Z", factor: 1e21,  exponent: 21,  tex_symbol: "Z",    name: "zetta"},
  {symbol: "E", factor: 1e18,  exponent: 18,  tex_symbol: "E",    name: "exa"},
  {symbol: "P", factor: 1e15,  exponent: 15,  tex_symbol: "P",    name: "peta"},
  {symbol: "T", factor: 1e12,  exponent: 12,  tex_symbol: "T",    name: "tera"},
  {symbol: "G", factor: 1e9,   exponent: 9,   tex_symbol: "G",    name: "giga"},
  {symbol: "M", factor: 1e6,   exponent: 6,   tex_symbol: "M",    name: "mega"},
  {symbol: "k", factor: 1e3,   exponent: 3,   tex_symbol: "k",    name: "kilo"},
  {symbol: "h", factor: 1e2,   exponent: 2,   tex_symbol: "h",    name: "hecto"},
  {symbol: "",  factor: 1e0,   exponent: 0,   tex_symbol: "",     name: ""},
  {symbol: "d", factor: 1e-1,  exponent: -1,  tex_symbol: "d",    name: "deci"},
  {symbol: "c", factor: 1e-2,  exponent: -2,  tex_symbol: "c",    name: "centi"},
  {symbol: "m", factor: 1e-3,  exponent: -3,  tex_symbol: "m",    name: "milli"},
  {symbol: "µ", factor: 1e-6,  exponent: -6,  tex_symbol: "\\mu", name: "micro"},
  {symbol: "n", factor: 1e-9,  exponent: -9,  tex_symbol: "n",    name: "nano"},
  {symbol: "p", factor: 1e-12, exponent: -12, tex_symbol: "p",    name: "pico"},
  {symbol: "f", factor: 1e-15, exponent: -15, tex_symbol: "f",    name: "femto"},
  {symbol: "a", factor: 1e-18, exponent: -18, tex_symbol: "a",    name: "atto"},
  {symbol: "z", factor: 1e-21, exponent: -21, tex_symbol: "z",    name: "zepto"},
  {symbol: "y", factor: 1e-24, exponent: -24, tex_symbol: "y",    name: "yocto"},
  {symbol: "r", factor: 1e-27, exponent: -27, tex_symbol: "r",    name: "ronto"},
  {symbol: "q", factor: 1e-30, exponent: -30, tex_symbol: "q",    name: "quecto"},
] as const

export type SIPrefixInfo = typeof si_prefixes[number]
export type SIPrefix = SIPrefixInfo["symbol"]
export type EngineeringSIPrefix = Exclude<SIPrefix, "h" | "d" | "c">

export const engineering_si_prefixes = si_prefixes.filter(({exponent}) => exponent % 3 == 0) as
  readonly (SIPrefixInfo & {symbol: EngineeringSIPrefix})[]

declare type Func = () => void
declare type AsyncFunc = () => Promise<void>

declare type Fn = (fn: Func | AsyncFunc) => void
declare type Decl = (description: string, fn: Func | AsyncFunc) => void

declare type TestSettings = {
  threshold?: number
  retries?: number
}

declare type It = Decl & {
  skip: Decl
  allowing: (settings: number | TestSettings) => Decl
  dpr: (dpr: number) => Decl
  no_image: Decl
}

declare const describe: Decl
declare const it: It
declare const before_each: Fn
declare const after_each: Fn

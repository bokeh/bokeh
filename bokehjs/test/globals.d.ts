declare type Func = () => void
declare type AsyncFunc = () => Promise<void>

declare type Fn = (fn: Func | AsyncFunc) => void
declare type Decl = (description: string, fn: Func | AsyncFunc) => void

declare type It = Decl & {
  skip: Decl
  with_server: (description: string, fn: (url: string) => Promise<void>) => void
  allowing: (threshold: number) => Decl
  dpr: (dpr: number) => Decl
}

declare const describe: Decl
declare const it: It
declare const before_each: Fn
declare const after_each: Fn

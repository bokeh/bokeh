declare type Func = () => void
declare type AsyncFunc = () => Promise<void>

declare type Fn = (fn: Func | AsyncFunc) => void
declare type Decl = (description: string, fn: Func | AsyncFunc) => void

declare type It = Decl & {
  skip: Decl
  with_server: (description: string, fn: (url: string) => Promise<void>) => void
}

declare const describe: Decl
declare const it: It
declare const beforeEach: Fn
declare const afterEach: Fn

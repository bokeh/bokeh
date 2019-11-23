declare type Func = () => void
declare type AsyncFunc = () => Promise<void>

declare type Fn = {
  (fn: Async): void
  (fn: AsyncFunc): void
  (description: string, fn: Func): void
  (description: string, fn: AsyncFunc): void
}

declare type It = Fn & {
  skip: Fn
}

declare const describe: Fn
declare const it: It
declare const before: Fn
declare const after: Fn
declare const beforeEach: Fn
declare const afterEach: Fn

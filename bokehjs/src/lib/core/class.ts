export interface Class<T, Args extends any[] = any[]> {
  new (...args: Args): T
  prototype: T
}

export type Constructor<T = {}> = new (...args: any[]) => T

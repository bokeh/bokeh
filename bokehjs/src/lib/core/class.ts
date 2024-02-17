export interface Class<T, Args extends any[] = any[]> {
  new (...args: Args): T
  prototype: T
}

export type Constructor<T = {}> = new (...args: any[]) => T

export function extend(ctor: Class<any>, ...mixins: any[]): void {
  for (const mixin of mixins) {
    for (const name of Object.getOwnPropertyNames(mixin.prototype)) {
      if (name == "constructor") {
        continue
      }

      Object.defineProperty(
        ctor.prototype,
        name,
        Object.getOwnPropertyDescriptor(mixin.prototype, name) ?? Object.create(null),
      )
    }
  }
}

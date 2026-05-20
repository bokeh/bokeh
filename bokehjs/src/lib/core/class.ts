export interface Class<T, Args extends any[] = any[]> {
  new (...args: Args): T
  prototype: T
}

export type Constructor<T = object> = new (...args: any[]) => T

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

/**
 * Use it like `@bind protected _event_handler(event: SomeEvent) { ... }`.
 */
export const bind = (_target: unknown, key: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
  const method = descriptor.value

  return {
    configurable: true,
    get(this: unknown) {
      const bound = method.bind(this)

      Object.defineProperty(this, key, {
        value: bound,
        configurable: false,
        writable: false,
      })

      return bound
    },
  }
}

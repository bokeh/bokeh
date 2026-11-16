export interface Class<T, Args extends any[] = any[]> {
  new (...args: Args): T
  prototype: T
}

export type Constructor<T = object> = new (...args: any[]) => T

export function extend(ctor: Function & {prototype: any}, ...mixins: Array<Function & {prototype: any}>): void {
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
export const bind = (target: object, key: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
  const method = descriptor.value

  return {
    configurable: true,
    get(this: object) {
      const bound = method.bind(this)

      // Cache only on direct access. When accessed via `super.method` from an
      // overriding (and possibly also bound) method, `target` isn't the nearest
      // owner of `key`, so caching would shadow (or fail to redefine) the override.
      let proto: object | null = Object.getPrototypeOf(this)
      while (proto != null && !Object.hasOwn(proto, key)) {
        proto = Object.getPrototypeOf(proto)
      }

      if (proto === target) {
        Object.defineProperty(this, key, {
          value: bound,
          configurable: false,
          writable: false,
        })
      }

      return bound
    },
  }
}

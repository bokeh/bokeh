interface WeakMap<K extends object, V> {
  delete(key: K): boolean
  get(key: K): V | undefined
  has(key: K): boolean
  set(key: K, value: V): this
}

interface WeakMapConstructor {
  new (): WeakMap<object, any>
  new <K extends object, V>(entries?: ReadonlyArray<[K, V]> | null): WeakMap<K, V>
  readonly prototype: WeakMap<object, any>
}
declare var WeakMap: WeakMapConstructor

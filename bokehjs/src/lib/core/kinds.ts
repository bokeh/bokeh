import * as tp from "./util/types"
import {Color as ColorType} from "./types"
import {is_color} from "./util/color"

import type {HasProps} from "./has_props"

export abstract class Kind<T> {
  __type__: T

  abstract valid(value: unknown): value is this["__type__"]
}

type Constructor<T> = Function & {prototype: T}

export namespace Kinds {
  export class Any extends Kind<any> {
    valid(_value: unknown): _value is any {
      return true
    }
  }

  export class Unknown extends Kind<unknown> {
    valid(_value: unknown): _value is unknown {
      return true
    }
  }

  export class Boolean extends Kind<boolean> {
    valid(value: unknown): value is boolean {
      return tp.isBoolean(value)
    }
  }

  export class Instance<ObjType extends HasProps> extends Kind<ObjType> {
    constructor(readonly obj_type: Constructor<ObjType>) {
      super()
    }

    valid(value: unknown): value is ObjType {
      return value instanceof this.obj_type
    }
  }

  export class Number extends Kind<number> {
    valid(value: unknown): value is number {
      return tp.isNumber(value)
    }
  }

  export class Int extends Number {
    valid(value: unknown): value is number {
      return super.valid(value) && tp.isInteger(value)
    }
  }

  export type TupleKind<T extends unknown[]> = {[K in keyof T]: T[K] extends T[number] ? Kind<T[K]> : never}

  export class Or<T extends unknown[]> extends Kind<T[number]> {
    constructor(readonly types: TupleKind<T>) {
      super()
      this.types = types
    }

    valid(value: unknown): value is T[number] {
      return this.types.some((type) => type.valid(value))
    }
  }

  export class Tuple<T extends [unknown, ...unknown[]]> extends Kind<T> {
    constructor(readonly types: TupleKind<T>) {
      super()
      this.types = types
    }

    valid(value: unknown): value is T {
      if (!tp.isArray(value))
        return false

      for (let i = 0; i < this.types.length; i++) {
        const type = this.types[i]
        const item = value[i]
        if (!type.valid(item))
          return false
      }

      return true
    }
  }

  export class Array<ItemType> extends Kind<ItemType[]> {

    constructor(readonly item_type: Kind<ItemType>) {
      super()
    }

    valid(value: unknown): value is ItemType[] {
      return tp.isArray(value) && value.every((item) => this.item_type.valid(item))
    }
  }

  export class Null extends Kind<null> {
    valid(value: unknown): value is null {
      return value === null
    }
  }

  export class Nullable<BaseType> extends Kind<BaseType | null> {
    constructor(readonly base_type: Kind<BaseType>) {
      super()
    }

    valid(value: unknown): value is BaseType | null {
      return value === null || this.base_type.valid(value)
    }
  }

  export class String extends Kind<string> {
    valid(value: unknown): value is string {
      return tp.isString(value)
    }
  }

  export class Enum<T extends string> extends Kind<T> {
    readonly values: Set<T>

    constructor(values: Iterable<T>) {
      super()
      this.values = new Set(values)
    }

    valid(value: unknown): value is T {
      return this.values.has(value as T)
    }

    *[Symbol.iterator](): Generator<T, void, undefined> {
      yield* this.values
    }
  }

  export class Struct<ItemType> extends Kind<{[key: string]: ItemType}> {

    constructor(readonly item_type: Kind<ItemType>) {
      super()
    }

    valid(value: unknown): value is this["__type__"] {
      if (!tp.isPlainObject(value))
        return false

      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          const item = value[key]
          if (!this.item_type.valid(item))
            return false
        }
      }

      return true
    }
  }

  export class Dict<KeyType, ItemType> extends Kind<Map<KeyType, ItemType>> {

    constructor(readonly key_type: Kind<KeyType>, readonly item_type: Kind<ItemType>) {
      super()
    }

    valid(value: unknown): value is this["__type__"] {
      if (!(value instanceof Map))
        return false

      for (const [key, item] of value.entries()) {
        if (!(this.key_type.valid(key) && this.item_type.valid(item)))
          return false
      }

      return true
    }
  }

  export class Color extends Kind<ColorType> {
    valid(value: unknown): value is ColorType {
      return tp.isString(value) && is_color(value)
    }
  }

  export class Percent extends Number {
    valid(value: unknown): value is number {
      return super.valid(value) && 0 <= value && value <= 1.0
    }
  }
}

export const Any = new Kinds.Any()
export const Unknown = new Kinds.Unknown()
export const Boolean = new Kinds.Boolean()
export const Number = new Kinds.Number()
export const Int = new Kinds.Int()
export const String = new Kinds.String()
export const Null = new Kinds.Null()
export const Nullable = <BaseType>(base_type: Kind<BaseType>) => new Kinds.Nullable(base_type)
export const Or = <T extends unknown[]>(...types: Kinds.TupleKind<T>) => new Kinds.Or(types)
export const Tuple = <T extends [unknown, ...unknown[]]>(...types: Kinds.TupleKind<T>) => new Kinds.Tuple(types)
export const Array = <ItemType>(item_type: Kind<ItemType>) => new Kinds.Array(item_type)
export const Struct = <V>(item_type: Kind<V>) => new Kinds.Struct(item_type)
export const Dict = <K, V>(key_type: Kind<K>, item_type: Kind<V>) => new Kinds.Dict(key_type, item_type)
export const Enum = <T extends string>(...values: T[]) => new Kinds.Enum(values)
export const Instance = <ObjType extends HasProps>(obj_type: Constructor<ObjType>) => new Kinds.Instance<ObjType>(obj_type)

export const Percent = new Kinds.Percent()
export const Color = new Kinds.Color()
export const Auto = Enum("auto")

export const FontSize = String
export const Font = String
export const Angle = Number

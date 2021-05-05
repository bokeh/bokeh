import * as types from "./types"
import * as tp from "./util/types"
import {is_Color} from "./util/color"
import {size} from "./util/object"

type ESMap<K, V> = Map<K, V>
const ESMap = window.Map

const {hasOwnProperty} = Object.prototype

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

  export class Ref<ObjType extends object> extends Kind<ObjType> {
    constructor(readonly obj_type: Constructor<ObjType>) {
      super()
    }

    valid(_value: unknown): _value is ObjType {
      // XXX: disable validation for now, because object graph initialization depends on this.
      // return value instanceof this.obj_type
      return true
    }
  }

  export class AnyRef<ObjType extends object> extends Kind<ObjType> {
    valid(_value: unknown): _value is ObjType {
      // XXX: disable validation for now, because object graph initialization depends on this.
      // return tp.isObject(value)
      return true
    }
  }

  export class Number extends Kind<number> {
    valid(value: unknown): value is number {
      return tp.isNumber(value)
    }
  }

  export class Int extends Number {
    override valid(value: unknown): value is number {
      return super.valid(value) && tp.isInteger(value)
    }
  }

  export class Percent extends Number {
    override valid(value: unknown): value is number {
      return super.valid(value) && 0 <= value && value <= 1
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

  export class Struct<T extends object> extends Kind<T> {

    constructor(readonly struct_type: {[key in keyof T]: Kind<T[key]>}) {
      super()
    }

    valid(value: unknown): value is this["__type__"] {
      if (!tp.isPlainObject(value))
        return false

      const {struct_type} = this
      if (size(struct_type) != size(value))
        return false

      for (const key in struct_type) {
        if (hasOwnProperty.call(struct_type, key)) {
          if (!hasOwnProperty.call(value, key))
            return false

          const item_type = struct_type[key]
          const item = value[key]

          if (!item_type.valid(item))
            return false
        }
      }

      return true
    }
  }

  export class Arrayable extends Kind<types.Arrayable> {
    valid(value: unknown): value is types.Arrayable {
      return tp.isArray(value) || tp.isTypedArray(value) // TODO: too specific
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

  export class Opt<BaseType> extends Kind<BaseType | undefined> {
    constructor(readonly base_type: Kind<BaseType>) {
      super()
    }

    valid(value: unknown): value is BaseType | undefined {
      return value === undefined || this.base_type.valid(value)
    }
  }

  export class String extends Kind<string> {
    valid(value: unknown): value is string {
      return tp.isString(value)
    }
  }

  export class Enum<T extends string | number> extends Kind<T> {
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

  export class Dict<ItemType> extends Kind<{[key: string]: ItemType}> {

    constructor(readonly item_type: Kind<ItemType>) {
      super()
    }

    valid(value: unknown): value is this["__type__"] {
      if (!tp.isPlainObject(value))
        return false

      for (const key in value) {
        if (hasOwnProperty.call(value, key)) {
          const item = value[key]
          if (!this.item_type.valid(item))
            return false
        }
      }

      return true
    }
  }

  export class Map<KeyType, ItemType> extends Kind<ESMap<KeyType, ItemType>> {

    constructor(readonly key_type: Kind<KeyType>, readonly item_type: Kind<ItemType>) {
      super()
    }

    valid(value: unknown): value is this["__type__"] {
      if (!(value instanceof ESMap))
        return false

      for (const [key, item] of value.entries()) {
        if (!(this.key_type.valid(key) && this.item_type.valid(item)))
          return false
      }

      return true
    }
  }

  export class Color extends Kind<types.Color> {
    valid(value: unknown): value is types.Color{
      return is_Color(value)
    }
  }

  export class Function<Args extends unknown[], Ret> extends Kind<(...args: Args) => Ret> {
    valid(value: unknown): value is this["__type__"] {
      return tp.isFunction(value)
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
export const Opt = <BaseType>(base_type: Kind<BaseType>) => new Kinds.Opt(base_type)
export const Or = <T extends unknown[]>(...types: Kinds.TupleKind<T>) => new Kinds.Or(types)
export const Tuple = <T extends [unknown, ...unknown[]]>(...types: Kinds.TupleKind<T>) => new Kinds.Tuple(types)
export const Struct = <T extends object>(struct_type: {[key in keyof T]: Kind<T[key]>}) => new Kinds.Struct(struct_type)
export const Arrayable = new Kinds.Arrayable()
export const Array = <ItemType>(item_type: Kind<ItemType>) => new Kinds.Array(item_type)
export const Dict = <V>(item_type: Kind<V>) => new Kinds.Dict(item_type)
export const Map = <K, V>(key_type: Kind<K>, item_type: Kind<V>) => new Kinds.Map(key_type, item_type)
export const Enum = <T extends string | number>(...values: T[]) => new Kinds.Enum(values)
export const Ref = <ObjType extends object>(obj_type: Constructor<ObjType>) => new Kinds.Ref<ObjType>(obj_type)
export const AnyRef = <ObjType extends object>() => new Kinds.AnyRef<ObjType>()
export const Function = <Args extends unknown[], Ret>() => new Kinds.Function<Args, Ret>()

export const Percent = new Kinds.Percent()
export const Alpha = Percent
export const Color = new Kinds.Color()
export const Auto = Enum("auto")

export const FontSize = String
export const Font = String
export const Angle = Number

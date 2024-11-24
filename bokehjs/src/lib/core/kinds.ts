import type * as types from "./types"
import * as tp from "./util/types"
import {is_Color} from "./util/color"
import {keys, values, entries, typed_values, typed_entries, is_empty, PlainObjectProxy} from "./util/object"
import {has_refs} from "./util/refs"

type ESMap<K, V> = globalThis.Map<K, V>
const ESMap = globalThis.Map

type ESSet<V> = globalThis.Set<V>
const ESSet = globalThis.Set

type ESIterable<V> = globalThis.Iterable<V>

type DOMNode = globalThis.Node
const DOMNode = globalThis.Node

export abstract class Kind<T> {
  __type__: T

  coerce?(value: unknown): unknown

  abstract valid(value: unknown): value is this["__type__"]

  abstract may_have_refs(): boolean
}

export type Constructor<T> = Function & {prototype: T}

export namespace Kinds {
  export abstract class Primitive<T> extends Kind<T> {
    may_have_refs(): boolean {
      return false
    }
  }

  export class Any extends Primitive<any> {
    valid(value: unknown): value is any {
      return value !== undefined
    }

    override toString(): string {
      return "Any"
    }

    override may_have_refs(): boolean {
      return true
    }
  }

  export class Unknown extends Primitive<unknown> {
    valid(value: unknown): value is unknown {
      return value !== undefined
    }

    override toString(): string {
      return "Unknown"
    }

    override may_have_refs(): boolean {
      return true
    }
  }

  export class Bool extends Primitive<boolean> {
    valid(value: unknown): value is boolean {
      return tp.isBoolean(value)
    }

    override toString(): string {
      return "Bool"
    }
  }

  export class Ref<ObjType extends object> extends Kind<ObjType> {
    constructor(readonly obj_type: Constructor<ObjType>) {
      super()
    }

    valid(value: unknown): value is ObjType {
      return value instanceof this.obj_type
    }

    override toString(): string {
      const tp = this.obj_type
      // NOTE: `__name__` is injected by a compiler transform
      const name = (tp as any).__name__ ?? tp.toString()
      return `Ref(${name})`
    }

    may_have_refs(): boolean {
      const {obj_type} = this
      return has_refs in obj_type ? obj_type[has_refs] as boolean : true
    }
  }

  export class AnyRef<ObjType extends object> extends Kind<ObjType> {
    valid(value: unknown): value is ObjType {
      return tp.isObject(value)
    }

    override toString(): string {
      return "AnyRef"
    }

    may_have_refs(): boolean {
      return true
    }
  }

  export class Float extends Primitive<number> {
    valid(value: unknown): value is number {
      return tp.isNumber(value)
    }

    override toString(): string {
      return "Float"
    }
  }

  export class Int extends Float {
    override valid(value: unknown): value is number {
      return super.valid(value) && tp.isInteger(value)
    }

    override toString(): string {
      return "Int"
    }
  }

  export class Percent extends Float {
    override valid(value: unknown): value is number {
      return super.valid(value) && 0 <= value && value <= 1
    }

    override toString(): string {
      return "Percent"
    }
  }

  // See https://github.com/microsoft/TypeScript/issues/49556.
  export type TupleKind<T extends unknown[]> = {[K in keyof T]: Kind<T[K]>}
  export type ObjectKind<T extends {[key: string]: unknown}> = {[K in keyof T]: Kind<T[K]>}

  export class Or<T extends [unknown, ...unknown[]]> extends Kind<T[number]> {
    constructor(readonly types: TupleKind<T>) {
      super()
      this.types = types
    }

    valid(value: unknown): value is T[number] {
      return this.types.some((type) => type.valid(value))
    }

    override toString(): string {
      return `Or(${this.types.map((type) => type.toString()).join(", ")})`
    }

    may_have_refs(): boolean {
      return this.types.some((type) => type.may_have_refs())
    }
  }

  export class And<T0, T1> extends Kind<T0 & T1> {
    readonly types: [Kind<T0>, Kind<T1>]

    constructor(type0: Kind<T0>, type1: Kind<T1>) {
      super()
      this.types = [type0, type1]
    }

    valid(value: unknown): value is T0 & T1 {
      return this.types.some((type) => type.valid(value)) // TODO not sure if this is correct, probably not
    }

    override toString(): string {
      return `And(${this.types.map((type) => type.toString()).join(", ")})`
    }

    may_have_refs(): boolean {
      return this.types.some((type) => type.may_have_refs())
    }
  }

  export class Tuple<T extends [unknown, ...unknown[]]> extends Kind<T> {
    constructor(readonly types: TupleKind<T>) {
      super()
      this.types = types
    }

    valid(value: unknown): value is T {
      if (!tp.isArray(value)) {
        return false
      }

      for (let i = 0; i < this.types.length; i++) {
        const type = this.types[i]
        const item = value[i]
        if (!type.valid(item)) {
          return false
        }
      }

      return true
    }

    override toString(): string {
      return `Tuple(${this.types.map((type) => type.toString()).join(", ")})`
    }

    may_have_refs(): boolean {
      return this.types.some((type) => type.may_have_refs())
    }
  }

  export class Struct<T extends {[key: string]: unknown}> extends Kind<T> {

    constructor(readonly struct_type: ObjectKind<T>) {
      super()
    }

    valid(value: unknown): value is this["__type__"] {
      if (!tp.isPlainObject(value)) {
        return false
      }

      const struct_type_proxy = new PlainObjectProxy(this.struct_type as types.PlainObject<Kind<unknown>>)

      for (const key of keys(value)) {
        if (!struct_type_proxy.has(key)) {
          return false
        }
      }

      for (const [key, item_type] of struct_type_proxy) {
        const item = value[key]

        if (!item_type.valid(item)) {
          return false
        }
      }

      return true
    }

    override toString(): string {
      const items = typed_entries(this.struct_type).map(([key, kind]) => `${key.toString()}: ${kind}`).join(", ")
      return `Struct({${items}})`
    }

    may_have_refs(): boolean {
      return typed_values(this.struct_type).some((kind) => kind.may_have_refs())
    }
  }

  export class PartialStruct<T extends {[key: string]: unknown}> extends Kind<Partial<T>> {

    constructor(readonly struct_type: ObjectKind<T>) {
      super()
    }

    valid(value: unknown): value is this["__type__"] {
      if (!tp.isPlainObject(value)) {
        return false
      }

      const value_proxy = new PlainObjectProxy(value)
      const struct_type_proxy = new PlainObjectProxy(this.struct_type as types.PlainObject<Kind<unknown>>)

      for (const key of value_proxy.keys()) {
        if (!struct_type_proxy.has(key)) {
          return false
        }
      }

      for (const [key, item_type] of struct_type_proxy) {
        const item = value_proxy.get(key)
        if (item === undefined) {
          continue
        }
        if (!item_type.valid(item)) {
          return false
        }
      }

      return true
    }

    override toString(): string {
      const items = typed_entries(this.struct_type).map(([key, kind]) => `${key.toString()}?: ${kind}`).join(", ")
      return `Struct({${items}})`
    }

    may_have_refs(): boolean {
      return typed_values(this.struct_type).some((kind) => kind.may_have_refs())
    }
  }

  export class Iterable<ItemType> extends Kind<ESIterable<ItemType>> {
    constructor(readonly item_type: Kind<ItemType>) {
      super()
    }

    valid(value: unknown): value is ESIterable<ItemType> {
      return tp.isIterable(value)
    }

    override toString(): string {
      return `Iterable(${this.item_type.toString()})`
    }

    may_have_refs(): boolean {
      return this.item_type.may_have_refs()
    }
  }

  export class Arrayable<ItemType> extends Kind<types.Arrayable<ItemType>> {
    constructor(readonly item_type: Kind<ItemType>) {
      super()
    }

    valid(value: unknown): value is types.Arrayable<ItemType> {
      return tp.isArray(value) || tp.isTypedArray(value) // TODO: too specific
    }

    override toString(): string {
      return `Arrayable(${this.item_type.toString()})`
    }

    may_have_refs(): boolean {
      return this.item_type.may_have_refs()
    }
  }

  export class List<ItemType> extends Kind<ItemType[]> {
    constructor(readonly item_type: Kind<ItemType>) {
      super()
    }

    valid(value: unknown): value is ItemType[] {
      return tp.isArray(value) && value.every((item) => this.item_type.valid(item))
    }

    override toString(): string {
      return `List(${this.item_type.toString()})`
    }

    may_have_refs(): boolean {
      return this.item_type.may_have_refs()
    }
  }

  export class NonEmptyList<ItemType> extends List<ItemType> {
    override valid(value: unknown): value is ItemType[] {
      return super.valid(value) && value.length != 0
    }

    override toString(): string {
      return `NonEmptyList(${this.item_type.toString()})`
    }
  }

  export class Null extends Primitive<null> {
    valid(value: unknown): value is null {
      return value === null
    }

    override toString(): string {
      return "Null"
    }
  }

  export class Nullable<BaseType> extends Kind<BaseType | null> {
    constructor(readonly base_type: Kind<BaseType>) {
      super()
    }

    valid(value: unknown): value is BaseType | null {
      return value === null || this.base_type.valid(value)
    }

    override toString(): string {
      return `Nullable(${this.base_type.toString()})`
    }

    may_have_refs(): boolean {
      return this.base_type.may_have_refs()
    }
  }

  export class Opt<BaseType> extends Kind<BaseType | undefined> {
    constructor(readonly base_type: Kind<BaseType>) {
      super()
    }

    valid(value: unknown): value is BaseType | undefined {
      return value === undefined || this.base_type.valid(value)
    }

    override toString(): string {
      return `Opt(${this.base_type.toString()})`
    }

    may_have_refs(): boolean {
      return this.base_type.may_have_refs()
    }
  }

  export class Bytes extends Kind<ArrayBuffer> {
    valid(value: unknown): value is ArrayBuffer {
      return value instanceof ArrayBuffer
    }

    override toString(): string {
      return "Bytes"
    }

    may_have_refs(): boolean {
      return false
    }
  }

  export class Str extends Primitive<string> {
    valid(value: unknown): value is string {
      return tp.isString(value)
    }

    override toString(): string {
      return "Str"
    }
  }

  export class PrefixedStr<P extends string> extends Primitive<`${P}${string}`> {
    constructor(readonly prefix: P) {
      super()
    }

    valid(value: unknown): value is this["__type__"] {
      return tp.isString(value) && value.startsWith(this.prefix)
    }

    override toString(): string {
      return `PrefixedStr('${this.prefix}')`
    }
  }

  export class Regex extends Str {
    constructor(readonly regex: RegExp) {
      super()
    }

    override valid(value: unknown): value is string {
      return super.valid(value) && this.regex.test(value)
    }

    override toString(): string {
      return `Regex(${this.regex.toString()})`
    }
  }

  export class Enum<T extends string | number> extends Primitive<T> {
    readonly values: ESSet<T>

    constructor(values: ESIterable<T>) {
      super()
      this.values = new ESSet(values)
    }

    valid(value: unknown): value is T {
      return this.values.has(value as T)
    }

    *[Symbol.iterator](): Generator<T, void, undefined> {
      yield* this.values
    }

    override toString(): string {
      return `Enum(${[...this.values].map((v) => v.toString()).join(", ")})`
    }
  }

  export class Dict<ItemType> extends Kind<types.Dict<ItemType>> {

    constructor(readonly item_type: Kind<ItemType>) {
      super()
    }

    valid(value: unknown): value is this["__type__"] {
      if (!(value instanceof ESMap || tp.isPlainObject(value))) {
        return false
      }

      for (const item of values(value)) {
        if (!this.item_type.valid(item)) {
          return false
        }
      }

      return true
    }

    override toString(): string {
      return `Dict(${this.item_type.toString()})`
    }

    may_have_refs(): boolean {
      return this.item_type.may_have_refs()
    }
  }

  export class KeyVal<KeyType extends string, ItemType> extends Kind<types.KeyVal<KeyType, ItemType>> {

    constructor(readonly key_type: Kind<KeyType>, readonly item_type: Kind<ItemType>) {
      super()
    }

    valid(value: unknown): value is this["__type__"] {
      if (!(value instanceof ESMap || tp.isPlainObject(value))) {
        return false
      }

      for (const [key, item] of entries(value)) {
        if (!this.key_type.valid(key) || !this.item_type.valid(item)) {
          return false
        }
      }

      return true
    }

    override toString(): string {
      return `KeyVal(${this.key_type.toString()}, ${this.item_type.toString()})`
    }

    may_have_refs(): boolean {
      return this.key_type.may_have_refs() || this.item_type.may_have_refs()
    }
  }

  export class Mapping<KeyType, ItemType> extends Kind<ESMap<KeyType, ItemType>> {

    constructor(readonly key_type: Kind<KeyType>, readonly item_type: Kind<ItemType>) {
      super()
    }

    override coerce(value: unknown): unknown {
      // HACK accommodate for deserialization of {type: "map"}
      if (tp.isPlainObject(value) && is_empty(value)) {
        return new ESMap()
      } else {
        return value
      }
    }

    valid(value: unknown): value is this["__type__"] {
      if (!(value instanceof ESMap)) {
        return false
      }

      for (const [key, item] of value.entries()) {
        if (!(this.key_type.valid(key) && this.item_type.valid(item))) {
          return false
        }
      }

      return true
    }

    override toString(): string {
      return `Mapping(${this.key_type.toString()}, ${this.item_type.toString()})`
    }

    may_have_refs(): boolean {
      return this.key_type.may_have_refs() || this.item_type.may_have_refs()
    }
  }

  export class Set<ItemType> extends Kind<ESSet<ItemType>> {

    constructor(readonly item_type: Kind<ItemType>) {
      super()
    }

    valid(value: unknown): value is this["__type__"] {
      if (!(value instanceof ESSet)) {
        return false
      }

      for (const item of value) {
        if (!this.item_type.valid(item)) {
          return false
        }
      }

      return true
    }

    override toString(): string {
      return `Set(${this.item_type.toString()})`
    }

    may_have_refs(): boolean {
      return this.item_type.may_have_refs()
    }
  }

  export class Color extends Kind<types.Color> {
    valid(value: unknown): value is types.Color {
      return is_Color(value)
    }

    override toString(): string {
      return "Color"
    }

    may_have_refs(): boolean {
      return false
    }
  }

  export class CSSLength extends Str {
    /*
    override valid(value: unknown): value is string {
      return super.valid(value) // TODO: && this._parse(value)
    }
    */

    override toString(): string {
      return "CSSLength"
    }
  }

  export class Func<Args extends unknown[], Ret> extends Kind<(...args: Args) => Ret> {
    valid(value: unknown): value is this["__type__"] {
      return tp.isFunction(value)
    }

    override toString(): string {
      return "Func(...)"
    }

    may_have_refs(): boolean {
      return false
    }
  }

  export class NonNegative<BaseType extends number> extends Kind<BaseType> {
    constructor(readonly base_type: Kind<BaseType>) {
      super()
    }

    valid(value: unknown): value is BaseType {
      return this.base_type.valid(value) && value >= 0
    }

    override toString(): string {
      return `NonNegative(${this.base_type.toString()})`
    }

    may_have_refs(): boolean {
      return this.base_type.may_have_refs()
    }
  }

  export class Positive<BaseType extends number> extends Kind<BaseType> {
    constructor(readonly base_type: Kind<BaseType>) {
      super()
    }

    valid(value: unknown): value is BaseType {
      return this.base_type.valid(value) && value > 0
    }

    override toString(): string {
      return `Positive(${this.base_type.toString()})`
    }

    may_have_refs(): boolean {
      return this.base_type.may_have_refs()
    }
  }

  export class Node extends Kind<DOMNode> {
    valid(value: unknown): value is DOMNode {
      return value instanceof DOMNode
    }

    override toString(): string {
      return "Node"
    }

    may_have_refs(): boolean {
      return false
    }
  }
}

export const Any = new Kinds.Any()
export const Unknown = new Kinds.Unknown()
export const Bool = new Kinds.Bool()
export const Float = new Kinds.Float()
export const Int = new Kinds.Int()
export const Bytes = new Kinds.Bytes()
export const Str = new Kinds.Str()
export const PrefixedStr = <Prefix extends string>(prefix: Prefix) => new Kinds.PrefixedStr(prefix)
export const Regex = (regex: RegExp) => new Kinds.Regex(regex)
export const Null = new Kinds.Null()
export const Nullable = <BaseType>(base_type: Kind<BaseType>) => new Kinds.Nullable(base_type)
export const Opt = <BaseType>(base_type: Kind<BaseType>) => new Kinds.Opt(base_type)
export const Or = <T extends [unknown, ...unknown[]]>(...types: Kinds.TupleKind<T>) => new Kinds.Or(types)
export const And = <T0, T1>(type0: Kind<T0>, type1: Kind<T1>) => new Kinds.And(type0, type1)
export const Tuple = <T extends [unknown, ...unknown[]]>(...types: Kinds.TupleKind<T>) => new Kinds.Tuple(types)
export const Struct = <T extends {[key: string]: unknown}>(struct_type: Kinds.ObjectKind<T>) => new Kinds.Struct(struct_type)
export const PartialStruct = <T extends {[key: string]: unknown}>(struct_type: Kinds.ObjectKind<T>) => new Kinds.PartialStruct(struct_type)
export const Iterable = <ItemType>(item_type: Kind<ItemType>) => new Kinds.Iterable(item_type)
export const Arrayable = <ItemType>(item_type: Kind<ItemType>) => new Kinds.Arrayable(item_type)
export const List = <ItemType>(item_type: Kind<ItemType>) => new Kinds.List(item_type)
export const NonEmptyList = <ItemType>(item_type: Kind<ItemType>) => new Kinds.NonEmptyList(item_type)
export const Dict = <V>(item_type: Kind<V>) => new Kinds.Dict(item_type)
export const KeyVal = <K extends string, V>(key_type: Kind<K>, item_type: Kind<V>) => new Kinds.KeyVal(key_type, item_type)
export const Mapping = <K, V>(key_type: Kind<K>, item_type: Kind<V>) => new Kinds.Mapping(key_type, item_type)
export const Set = <V>(item_type: Kind<V>) => new Kinds.Set(item_type)
export const Enum = <T extends string | number>(...values: T[]) => new Kinds.Enum(values)
export const Ref = <ObjType extends object>(obj_type: Constructor<ObjType>) => new Kinds.Ref<ObjType>(obj_type)
export const AnyRef = <ObjType extends object>() => new Kinds.AnyRef<ObjType>()
export const Func = <Args extends unknown[], Ret>() => new Kinds.Func<Args, Ret>()
export const Node = new Kinds.Node()

export const NonNegative = <BaseType extends number>(base_type: Kind<BaseType>) => new Kinds.NonNegative(base_type)
export const Positive = <BaseType extends number>(base_type: Kind<BaseType>) => new Kinds.Positive(base_type)

export const Percent = new Kinds.Percent()
export const Alpha = Percent
export const Color = new Kinds.Color()
export const Auto = Enum("auto")
export const CSSLength = new Kinds.CSSLength()

export const FontSize = Str
export const Font = Str
export const Angle = Float

export type Float = typeof Float["__type__"]

// backwards compatibility aliases (these collide with built-in types)
/** @deprecated */
export const Boolean = Bool
/** @deprecated */
export const String = Str
/** @deprecated */
export const Number = Float
/** @deprecated */
export const Array = List
/** @deprecated */
export const Map = Mapping
/** @deprecated */
export const Function = Func

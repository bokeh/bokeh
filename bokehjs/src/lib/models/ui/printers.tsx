import {to_string} from "core/util/pretty"
import {HasProps} from "core/has_props"
import {isBoolean, isNumber, isString, isSymbol, isArray, isIterable, isObject, isPlainObject} from "core/util/types"
import type {PlainObject} from "core/types"
import {entries} from "core/util/object"
import {interleave} from "core/util/array"
import {css4_parse} from "core/util/color"
import {Kinds, Kind} from "core/kinds"
import * as p from "core/properties"
import * as pretty from "styles/pretty.css"

import type {VNode} from "preact"

export abstract class BasePrinter {

  null(): VNode<HTMLElement> {
    return <span class={pretty.nullish}>null</span>
  }

  token(val: string): VNode<HTMLElement> {
    return <span class={pretty.token}>{val}</span>
  }

  boolean(val: boolean): VNode<HTMLElement> {
    return <span class={pretty.boolean}>{`${val}`}</span>
  }

  number(val: number): VNode<HTMLElement> {
    return <span class={pretty.number}>{`${val}`}</span>
  }

  string(val: string): VNode<HTMLElement> {
    const sq = val.includes("'")
    const dq = val.includes('"')

    const str = (() => {
      if (sq && dq) {
        return `\`${val.replace(/`/g, "\\`")}\``
      } else if (dq) {
        return `'${val}'`
      } else {
        return `"${val}"`
      }
    })()

    const rep = <span class={pretty.string}>{str}</span>

    const color = css4_parse(val)
    if (color == null) {
      return rep
    } else {
      return (
        <span class={pretty.color}>
          <span class={pretty.swatch} style={{backgroundColor: val}}></span>
          {rep}
        </span>
      )
    }
  }

  symbol(val: symbol): VNode<HTMLElement> {
    return <span class={pretty.symbol}>{val.toString()}</span>
  }
}

export class OpaqueKindPrinter extends BasePrinter {
  to_html(obj: unknown): VNode<HTMLElement> {
    if (obj == null) {
      return this.null()
    } else if (isBoolean(obj)) {
      return this.boolean(obj)
    } else if (isNumber(obj)) {
      return this.number(obj)
    } else if (isString(obj)) {
      return this.string(obj)
    } else if (isSymbol(obj)) {
      return this.symbol(obj)
    } else if (obj instanceof Kinds.Ref) {
      return this.ref(obj)
    } else if (obj instanceof Kinds.Struct) {
      return this.struct(obj)
    } else if (obj instanceof Kinds.PartialStruct) {
      return this.partial_struct(obj)
    } else if (obj instanceof Kinds.Func) {
      return this.func(obj)
    } else if (obj instanceof Kind) {
      return this.kind(obj)
    } else {
      return <span>{obj.toString()}</span>
    }
  }

  ref(obj: Kinds.Ref<object>): VNode<HTMLElement> {
    const T = this.token
    return <span>{obj.kind_name}{T("(")}<span class={pretty.type}>{obj.type_name}</span>{T(")")}</span>
  }

  struct(obj: Kinds.Struct<{[key: string]: unknown}>): VNode<HTMLElement> {
    const T = this.token
    const args = entries(obj.struct_type).map(([key, val]) => <>{this.to_html(key)}{T(": ")}{this.to_html(val)}</>)
    return <span>{obj.kind_name}{T("({")}{args}{T("})")}</span>
  }

  partial_struct(obj: Kinds.PartialStruct<{[key: string]: unknown}>): VNode<HTMLElement> {
    const T = this.token
    const args = entries(obj.struct_type).map(([key, val]) => <>{this.to_html(key)}{T("?: ")}{this.to_html(val)}</>)
    return <span>{obj.kind_name}{T("({")}{args}{T("})")}</span>
  }

  func(obj: Kinds.Func<unknown[], unknown>): VNode<HTMLElement> {
    const T = this.token
    const args = obj.args_types?.map((arg) => this.to_html(arg)) ?? []
    const ret = obj.ret_type === undefined ? <span>Void</span> : this.to_html(obj.ret_type)
    return <span>{obj.kind_name}{T("(")}{T("(")}{interleave(args, () => T(", "))}{T(")")}{T(", ")}{ret}{T(")")}</span>
  }

  kind(obj: Kind<unknown>): VNode<HTMLElement> {
    const T = this.token
    const {kind_name, kind_args} = obj
    if (kind_args.length == 0) {
      return <span>{kind_name}</span>
    } else {
      const args = kind_args.map((arg) => this.to_html(arg))
      return <span>{kind_name}{T("(")}{interleave(args, () => T(", "))}{T(")")}</span>
    }
  }
}

export class KindPrinter extends BasePrinter {

  private _precedence_queue: number[] = []

  to_html(obj: unknown): VNode<HTMLElement> {
    const p_prev = this._precedence_queue.at(-1)

    const p = this.precedence(obj)
    this._precedence_queue.push(p)

    try {
      const rep = this._to_html(obj)

      if (p_prev === undefined || p >= p_prev) {
        return rep
      } else {
        const T = this.token
        return <>{T("(")}{rep}{T(")")}</>
      }
    } finally {
      this._precedence_queue.pop()
    }
  }

  protected _to_html(obj: unknown): VNode<HTMLElement> {
    if (obj == null) {
      return this.null()
    } else if (isBoolean(obj)) {
      return this.boolean(obj)
    } else if (isNumber(obj)) {
      return this.number(obj)
    } else if (isString(obj)) {
      return this.string(obj)
    } else if (isSymbol(obj)) {
      return this.symbol(obj)
    } else if (obj instanceof Kinds.Ref) {
      return this.ref(obj)
    } else if (obj instanceof Kinds.Nullable) {
      return this.nullable(obj)
    } else if (obj instanceof Kinds.Opt) {
      return this.opt(obj)
    } else if (obj instanceof Kinds.List) {
      return this.list(obj)
    } else if (obj instanceof Kinds.Set) {
      return this.set(obj)
    } else if (obj instanceof Kinds.Dict) {
      return this.dict(obj)
    } else if (obj instanceof Kinds.Mapping) {
      return this.mapping(obj)
    } else if (obj instanceof Kinds.Tuple) {
      return this.tuple(obj)
    } else if (obj instanceof Kinds.Or) {
      return this.or(obj)
    } else if (obj instanceof Kinds.And) {
      return this.and(obj)
    } else if (obj instanceof Kinds.Enum) {
      return this.enum(obj)
    } else if (obj instanceof Kinds.Struct) {
      return this.struct(obj)
    } else if (obj instanceof Kinds.PartialStruct) {
      return this.partial_struct(obj)
    } else if (obj instanceof Kinds.Func) {
      return this.func(obj)
    } else if (obj instanceof Kinds.Regex) {
      return this.regex(obj)
    } else if (obj instanceof Kinds.PrefixedStr) {
      return this.prefixed_str(obj)
    } else if (obj instanceof Kinds.Primitive) {
      return this.primitive(obj.toString().toLocaleLowerCase())
    } else {
      return <span>{obj.toString()}</span>
    }
  }

  precedence(kind: unknown): number {
    if (kind instanceof Kinds.Or || kind instanceof Kinds.Enum || kind instanceof Kinds.Tuple) {
      return 0
    } else if (kind instanceof Kinds.And) {
      return 1
    } else {
      return 2
    }
  }

  primitive(obj: string): VNode<HTMLElement> {
    return <span class={pretty.primitive}>{obj}</span>
  }

  ref(obj: Kinds.Ref<object>): VNode<HTMLElement> {
    return <span class={pretty.type}>{obj.type_name}</span>
  }

  nullable(obj: Kinds.Nullable<unknown>): VNode<HTMLElement> {
    const T = this.token
    return <span>{this.to_html(obj.base_type)}{T("?")}</span>
  }

  opt(obj: Kinds.Opt<unknown>): VNode<HTMLElement> {
    return this.nullable(obj)
  }

  list(obj: Kinds.List<unknown>): VNode<HTMLElement> {
    const T = this.token
    return <span>{this.to_html(obj.item_type)}{T("[")}{T("]")}</span>
  }

  set(obj: Kinds.Set<unknown>): VNode<HTMLElement> {
    const T = this.token
    return <span>{T("{")}{this.to_html(obj.item_type)}{T("}")}</span>
  }

  dict(obj: Kinds.Dict<unknown>): VNode<HTMLElement> {
    const T = this.token
    return <span>{T("{")}{this.primitive("str")}{T(": ")}{this.to_html(obj.item_type)}{T("}")}</span>
  }

  mapping(obj: Kinds.Mapping<unknown, unknown>): VNode<HTMLElement> {
    const T = this.token
    return <span>{T("{")}{this.to_html(obj.key_type)}{T(" => ")}{this.to_html(obj.item_type)}{T("}")}</span>
  }

  tuple(obj: Kinds.Tuple<[unknown]>): VNode<HTMLElement> {
    const T = this.token
    const types = obj.types.map((tp) => this.to_html(tp))
    return <span>{T("[")}{interleave(types, () => T(", "))}{T("]")}</span>
  }

  or(obj: Kinds.Or<[unknown]>): VNode<HTMLElement> {
    const T = this.token
    const types = obj.types.map((tp) => this.to_html(tp))
    return <span>{interleave(types, () => T(" | "))}</span>
  }

  and(obj: Kinds.And<unknown, unknown>): VNode<HTMLElement> {
    const T = this.token
    const types = obj.types.map((tp) => this.to_html(tp))
    return <span>{interleave(types, () => T(" & "))}</span>
  }

  enum(obj: Kinds.Enum<string | number>): VNode<HTMLElement> {
    const T = this.token
    const types = [...obj.values].map((val) => this.to_html(val))
    return <span>{interleave(types, () => T(" | "))}</span>
  }

  struct(obj: Kinds.Struct<{[key: string]: unknown}>): VNode<HTMLElement> {
    const T = this.token
    const fields = entries(obj.struct_type).map(([name, kind]) => {
      return <span>{name}{T(": ")}{this.to_html(kind)}</span>
    })
    return <span>{T("{")}{interleave(fields, () => T(", "))}{T("}")}</span>
  }

  partial_struct(obj: Kinds.Struct<{[key: string]: unknown}>): VNode<HTMLElement> {
    const T = this.token
    const fields = entries(obj.struct_type).map(([name, kind]) => {
      return <span>{name}{T("?: ")}{this.to_html(kind)}</span>
    })
    return <span>{T("{")}{interleave(fields, () => T(", "))}{T("}")}</span>
  }

  func(obj: Kinds.Func<unknown[], unknown>): VNode<HTMLElement> {
    const T = this.token
    const args = obj.args_types?.map((arg) => this.to_html(arg)) ?? []
    const ret = obj.ret_type === undefined ? this.primitive("void") : this.to_html(obj.ret_type)
    return <span>{T("(")}{interleave(args, () => T(", "))}{T(")")}{T(" => ")}{ret}</span>
  }

  regex(obj: Kinds.Regex): VNode<HTMLElement> {
    const T = this.token
    const {source, flags} = obj.regex
    return <span>{T("/")}{source}{T("/")}{flags}</span>
  }

  prefixed_str(obj: Kinds.PrefixedStr<string>): VNode<HTMLElement> {
    const T = this.token
    return <span>PrefixedStr{T("(")}{this.to_html(obj.prefix)}{T(")")}</span>
  }
}

export class ValuePrinter extends BasePrinter {
  protected readonly visited = new WeakSet()
  protected depth = 0

  constructor(readonly click?: (obj: unknown) => void, readonly max_items: number = 5, readonly max_depth: number = 3) {
    super()
  }

  to_html(obj: unknown): VNode<HTMLElement> {
    if (isObject(obj)) {
      if (this.visited.has(obj)) {
        return <span>circular</span>
      } else {
        this.visited.add(obj)
      }
    }

    if (obj == null) {
      return this.null()
    } else if (isBoolean(obj)) {
      return this.boolean(obj)
    } else if (isNumber(obj)) {
      return this.number(obj)
    } else if (isString(obj)) {
      return this.string(obj)
    } else if (isSymbol(obj)) {
      return this.symbol(obj)
    } else if (obj instanceof HasProps) {
      return this.model(obj)
    } else if (obj instanceof p.Property) {
      return this.property(obj)
    } else if (isPlainObject(obj)) {
      return this.object(obj)
    } else if (isArray(obj)) {
      return this.array(obj)
    } else if (isIterable(obj)) {
      return this.iterable(obj)
    } else {
      return <span>{to_string(obj)}</span>
    }
  }

  array(obj: unknown[]): VNode<HTMLElement> {
    const T = this.token
    const items: VNode<HTMLElement>[] = []
    let i = 0
    for (const entry of obj) {
      items.push(this.to_html(entry))
      if (i++ > this.max_items) {
        items.push(<span>\u2026</span>)
        break
      }
    }
    return <span class={pretty.array}>{T("[")}{interleave(items, () => T(", "))}{T("]")}</span>
  }

  iterable(obj: Iterable<unknown>): VNode<HTMLElement> {
    const T = this.token
    const tag = Object(obj)[Symbol.toStringTag] ?? "Object"
    const items = this.array([...obj])
    return <span class={pretty.iterable}>{`${tag}`}{T("(")}{items}{T(")")}</span>
  }

  object(obj: PlainObject): VNode<HTMLElement> {
    const T = this.token
    const items: VNode<HTMLElement>[] = []
    let i = 0
    for (const [key, val] of entries(obj)) {
      items.push(<span>${`${key}`}{T(": ")}{this.to_html(val)}</span>)
      if (i++ > this.max_items) {
        items.push(<span>\u2026</span>)
        break
      }
    }
    return <span class={pretty.object}>{T("{")}{interleave(items, () => T(", "))}{T("}")}</span>
  }

  model(obj: HasProps): VNode<HTMLElement> {
    const T = this.token
    const {click} = this
    return (
      <span class={`${pretty.model} ${click != null ? "ref" : ""}`} onClick={() => click?.(obj)}>
        {obj.constructor.__qualified__}{T("(")}{this.to_html(obj.id)}{T(")")}
      </span>
    )
  }

  property(obj: p.Property): VNode<HTMLElement> {
    const model = this.model(obj.obj)
    const attr = <span class={pretty.attr}>{obj.attr}</span>
    return <span>{model}{this.token(".")}{attr}</span>
  }
}

import {logger} from "./logging"
import type {View} from "./view"
import type {Class} from "./class"
import type {Attrs, Data, Dict} from "./types"
import type {ISignalable} from "./signaling"
import {Signal0, Signal, Signalable} from "./signaling"
import type {Ref} from "./util/refs"
import {may_have_refs} from "core/util/refs"
import * as p from "./properties"
import * as k from "./kinds"
import type {Property} from "./properties"
import {assert} from "./util/assert"
import {unique_id} from "./util/string"
import {keys, values, entries, extend, is_empty, dict} from "./util/object"
import {isObject, isIterable, isPlainObject, isArray, isFunction, isPrimitive} from "./util/types"
import type {Serializable, Serializer, ObjectRefRep, AnyVal} from "./serialization"
import {serialize} from "./serialization"
import type {Document} from "../document/document"
import type {DocumentEvent} from "../document/events"
import {DocumentEventBatch, ModelChangedEvent, ColumnsPatchedEvent, ColumnsStreamedEvent} from "../document/events"
import type {Equatable} from "./util/eq"
import {equals, Comparator} from "./util/eq"
import type {Printable, Printer} from "./util/pretty"
import {pretty} from "./util/pretty"
import type {Cloneable} from "./util/cloneable"
import {clone, Cloner} from "./util/cloneable"
import * as kinds from "./kinds"
import type {Scalar, Vector} from "./vectorization"
import {isExpr} from "./vectorization"
import type {PatchSet} from "./patching"
import {stream_to_columns, patch_to_columns} from "./patching"

type AttrsLike = Dict<unknown>

export type HasPropsClass<T extends HasProps = HasProps> = Function & {prototype: T}

export type HasPropsFactory<T extends HasProps = HasProps, A extends object = object> = HasPropsClass<T> & {
  create(attrs?: A): T
}

type LifecycleState =
  "constructing" |
  "constructed" |
  "initializing_properties" |
  "properties_initialized" |
  "initializing" |
  "initialized" |
  "connecting_signals" |
  "ready" |
  "failed" |
  "destroyed"

type ConstructionContext = {
  cls: HasPropsClass
  id?: string
}

const construction_stack: ConstructionContext[] = []

export namespace HasProps {
  export type Attrs = p.AttrsOf<Props>
  export type Props = {}

  export type SetOptions = {
    check_eq?: boolean
    silent?: boolean
    sync?: boolean
    no_change?: boolean
  }
}

export interface HasProps extends HasProps.Attrs, ISignalable {
  constructor: HasPropsFactory<this> & {
    __module__?: string
    __qualified__: string
  }
}

export type PropertyGenerator = Generator<Property, void, undefined>

const _qualified_names = new WeakMap<typeof HasProps, string>()

export abstract class HasProps extends Signalable() implements Equatable, Printable, Serializable, Cloneable {
  declare __view_type__: View

  readonly id: string

  private _lifecycle_state: LifecycleState = "constructing"
  private _initial_attrs: AttrsLike = {}

  get is_ready(): boolean {
    return this._lifecycle_state == "ready"
  }

  get is_destroyed(): boolean {
    return this._lifecycle_state == "destroyed"
  }

  protected get is_deferred(): boolean {
    return construction_stack.at(-1)?.id != null
  }

  get is_syncable(): boolean {
    return true
  }

  get type(): string {
    return this.constructor.__qualified__
  }

  get is_root(): boolean {
    return this.document?.roots().includes(this) ?? false
  }

  static __module__?: string

  static get __qualified__(): string {
    let qualified = _qualified_names.get(this)
    if (qualified == null) {
      const {__module__, name} = this
      qualified = __module__ != null ? `${__module__}.${name}` : name
      _qualified_names.set(this, qualified)
    }
    return qualified
  }

  static set __qualified__(qualified: string) {
    _qualified_names.set(this, qualified)
  }

  static create<T extends HasProps, A extends object = Record<never, never>>(
    this: HasPropsClass<T> & (new(attrs?: A) => T),
    attrs: NoInfer<A> = {} as A,
  ): T {
    return construct(this, attrs as AttrsLike)
  }

  get [Symbol.toStringTag](): string {
    return this.constructor.__qualified__
  }

  static {
    this.prototype._props = {}
    this.prototype._mixins = []
  }

  /** @prototype */
  declare default_view?: Class<View, [View.Options]>

  /** @prototype */
  declare _props: {[key: string]: {
    type: p.PropertyConstructor<unknown, HasProps>
    default_value: (self: HasProps) => unknown | p.Unset
    options: p.PropertyOptions<unknown, HasProps>
  }}

  /** @prototype */
  declare _mixins: [string, object][]

  private static _fix_default(default_value: any, _attr: string): () => any {
    if (default_value === undefined || default_value === p.unset) {
      return () => p.unset
    } else if (isFunction(default_value)) {
      return default_value
    } else if (isPrimitive(default_value)) {
      return () => default_value
    } else {
      const cloner = new Cloner()
      return () => cloner.clone(default_value)
    }
  }

  // TODO: don't use Partial<>, but exclude inherited properties
  static define<T, HP extends HasProps = HasProps>(obj: Partial<p.DefineOf<T, HP>> | ((types: typeof kinds) => Partial<p.DefineOf<T, HP>>)): void {
    for (const [name, prop] of entries(isFunction(obj) ? obj(kinds) : obj)) {
      if (name in this.prototype._props) {
        throw new Error(`attempted to redefine property '${this.prototype.type}.${name}'`)
      }

      if (name in this.prototype) {
        throw new Error(`attempted to redefine attribute '${this.prototype.type}.${name}'`)
      }

      Object.defineProperty(this.prototype, name, {
        // XXX: don't use tail calls in getters/setters due to https://bugs.webkit.org/show_bug.cgi?id=164306
        get(this: HasProps): any {
          const value = this.properties[name].get_value()
          return value
        },
        set(this: HasProps, value: any): HasProps {
          this.setv({[name]: value})
          return this
        },
        configurable: false,
        enumerable: true,
      })

      const [type, default_value, options = {}] = prop as any
      const refined_prop = {
        type,
        default_value: this._fix_default(default_value, name),
        options,
      }
      this.prototype._props = {
        ...this.prototype._props,
        [name]: refined_prop,
      }
    }
  }

  static internal<T, HP extends HasProps = HasProps>(obj: Partial<p.DefineOf<T, HP>> | ((types: typeof kinds) => Partial<p.DefineOf<T, HP>>)): void {
    const _object: any = {}
    for (const [name, prop] of entries(isFunction(obj) ? obj(kinds) : obj)) {
      const [type, default_value, options = {}] = prop as any
      _object[name] = [type, default_value, {...options, internal: true}]
    }
    this.define(_object)
  }

  static mixins<_T>(defs: Attrs | (Attrs | [string, Attrs])[]): void {
    function rename(prefix: string, mixin: Attrs): Attrs {
      const result: Attrs = {}
      for (const [name, prop] of entries(mixin)) {
        result[prefix + name] = prop
      }
      return result
    }

    const mixin_defs: Attrs = {}
    const mixins: [string, Attrs][] = []

    for (const def of isArray(defs) ? defs : [defs]) {
      if (isArray(def)) {
        const [prefix, mixin] = def
        extend(mixin_defs, rename(prefix, mixin))
        mixins.push([prefix, mixin])
      } else {
        const mixin = def
        extend(mixin_defs, mixin)
        mixins.push(["", mixin])
      }
    }

    this.define(mixin_defs as any)
    this.prototype._mixins = [...this.prototype._mixins, ...mixins]
  }

  static override<T, HP extends HasProps = HasProps>(obj: Partial<p.DefaultsOf<T, HP>>): void {
    for (const [name, prop] of entries(obj)) {
      const default_value = this._fix_default(prop, name)
      if (!(name in this.prototype._props)) {
        throw new Error(`attempted to override nonexistent '${this.prototype.type}.${name}'`)
      }
      const value = this.prototype._props[name]
      const props = {...this.prototype._props}
      props[name] = {...value, default_value}
      this.prototype._props = props
    }
  }

  static override_options<T, HP extends HasProps = HasProps>(obj: Partial<p.OptionsOf<T, HP>>): void {
    for (const [name, options] of entries(obj)) {
      if (!(name in this.prototype._props)) {
        throw new Error(`attempted to override nonexistent '${this.prototype.type}.${name}'`)
      }
      const current = this.prototype._props[name]
      const props = {
        ...this.prototype._props,
        [name]: {...current, options: {...current.options, ...options as any}},
      }
      this.prototype._props = props
    }
  }

  static override toString(): string {
    return this.__qualified__
  }

  override toString(): string {
    return `${this.type}(${this.id})`
  }

  document: Document | null = null

  readonly destroyed       = new Signal0<this>(this, "destroyed")
  readonly change          = new Signal0<this>(this, "change")
  readonly transformchange = new Signal0<this>(this, "transformchange")
  readonly exprchange      = new Signal0<this>(this, "exprchange")
  readonly streaming       = new Signal0<this>(this, "streaming")
  readonly patching        = new Signal<number[], this>(this, "patching")

  readonly properties: {[key: string]: Property} = {}

  property(name: string): Property {
    if (name in this.properties) {
      return this.properties[name]
    } else {
      throw new Error(`unknown property ${this.type}.${name}`)
    }
  }

  /**
   * Gets values of all set properties.
   */
  get attributes(): Attrs {
    const attrs: Attrs = {}
    for (const prop of this) {
      if (!prop.is_unset) {
        attrs[prop.attr] = prop.get_value()
      }
    }
    return attrs
  }

  /**
   * Gets values of all set and dirty (modified) properties.
   */
  get dirty_attributes(): Attrs {
    const attrs: Attrs = {}
    for (const prop of this) {
      if (!prop.is_unset && prop.dirty) {
        attrs[prop.attr] = prop.get_value()
      }
    }
    return attrs
  }

  [clone](cloner: Cloner): this {
    const attrs = new Map<string, unknown>()
    for (const prop of this) {
      if (prop.dirty) {
        attrs.set(prop.attr, cloner.clone(prop.get_value()))
      }
    }
    return (this.constructor as any).create(attrs)
  }

  [equals](that: this, cmp: Comparator): boolean {
    for (const p0 of this) {
      const p1 = that.property(p0.attr)
      if (!cmp.eq(p0.get_value(), p1.get_value())) {
        return false
      }
    }
    return true
  }

  [pretty](printer: Printer): string {
    const T = printer.token

    const items = []
    for (const prop of this) {
      if (prop.dirty) {
        const value = prop.get_value()
        items.push(`${prop.attr}${T(":")} ${printer.to_string(value)}`)
      }
    }

    const cls = this.constructor.__qualified__
    return `${cls}${T("(")}${T("{")}${items.join(`${T(",")} `)}${T("}")}${T(")")}`
  }

  [serialize](serializer: Serializer): ObjectRefRep {
    const ref = this.ref()
    serializer.add_ref(this, ref)

    const attributes: {[key: string]: AnyVal} = {}
    for (const prop of this) {
      if (prop.syncable && (serializer.include_defaults || prop.dirty) && !(prop.readonly && prop.is_unset)) {
        const value = prop.get_value()
        attributes[prop.attr] = serializer.encode(value) as AnyVal
      }
    }

    const {type: name, id} = this
    const rep = {type: "object" as const, name, id}

    return is_empty(attributes) ? rep : {...rep, attributes}
  }

  constructor(attrs: {id: string} | AttrsLike = {}) {
    super()

    const context = construction_stack.at(-1)
    if (context == null || context.cls != new.target) {
      const cls = new.target
      throw new Error(`use ${cls.__qualified__}.create({...}) instead of new ${cls.__qualified__}(...)`)
    }

    this.id = context.id ?? unique_id()
    this._initial_attrs = attrs

    for (const [name, {type, default_value, options}] of entries(this._props)) {
      let property: p.Property<unknown>

      if (type instanceof p.PropertyAlias) {
        const property = this.properties[type.attr]
        if (typeof property === "undefined") {
          throw new Error(`can't resolve ${type.attr} before ${name} to create an alias`)
        }
        Object.defineProperty(this.properties, name, {
          get: () => property,
          configurable: false,
          enumerable: false,
        })
      } else {
        if (type instanceof k.Kind) {
          property = new p.PrimitiveProperty(this, name, type, default_value, options)
        } else {
          property = new type(this, name, k.Any, default_value, options)
        }

        this.properties[name] = property
      }
    }

    this._lifecycle_state = "constructed"
  }

  initialize_props(vals: Dict<unknown>): void {
    assert(this._lifecycle_state == "constructed")
    this._lifecycle_state = "initializing_properties"

    const vals_proxy = dict(vals)
    const visited = new Set<string>()
    try {
      for (const prop of this) {
        const val = vals_proxy.get(prop.attr)
        prop.initialize(val)
        visited.add(prop.attr)
      }

      for (const [attr, val] of vals_proxy) {
        if (!visited.has(attr)) {
          // either throws for unknown properties or updates aliased properties
          this.property(attr).set_value(val)
        }
      }
      this._lifecycle_state = "properties_initialized"
    } catch (error) {
      this._lifecycle_state = "failed"
      throw error
    }
  }

  finalize(): void {
    assert(this._lifecycle_state == "properties_initialized")
    this._lifecycle_state = "initializing"
    try {
      this.initialize()
      this._lifecycle_state = "initialized"
    } catch (error) {
      this._lifecycle_state = "failed"
      throw error
    }
  }

  initialize(): void {}

  assert_initialized(): void {
    for (const prop of this) {
      if (prop.syncable && !prop.readonly) {
        prop.get_value()
      }
    }
  }

  finalize_signals(): void {
    assert(this._lifecycle_state == "initialized")
    this._lifecycle_state = "connecting_signals"
    try {
      this.connect_signals()
      this._lifecycle_state = "ready"
    } catch (error) {
      this._lifecycle_state = "failed"
      throw error
    }
  }

  finish(): void {
    const attrs = this._initial_attrs
    this._initial_attrs = {}
    this.initialize_props(attrs)
    this.finalize()
    this.finalize_signals()
  }

  connect_signals(): void {
    for (const prop of this) {
      if (!(prop instanceof p.VectorSpec || prop instanceof p.ScalarSpec)) {
        continue
      }
      if (prop.is_unset) {
        continue
      }

      const value = prop.get_value() as Scalar<unknown> | Vector<unknown>
      if (value.transform != null) {
        this.connect(value.transform.change, () => this.transformchange.emit())
      }
      if (isExpr(value)) {
        this.connect(value.expr.change, () => this.exprchange.emit())
      }
    }
  }

  disconnect_signals(): void {
    Signal.disconnect_receiver(this)
  }

  destroy(): void {
    if (this._lifecycle_state == "destroyed") {
      return
    }
    this._lifecycle_state = "destroyed"
    this.disconnect_signals()
    this.destroyed.emit()
  }

  // Create a new model with exact attribute values to this one, but new identity.
  clone(attrs?: Partial<HasProps.Attrs>): this {
    const cloner = new Cloner()
    const that = cloner.clone(this)
    if (attrs != null) {
      that.setv(attrs)
    }
    return that
  }

  private _watchers: WeakMap<object, boolean> = new WeakMap()

  protected _clear_watchers(): void {
    this._watchers = new WeakMap()
  }

  changed_for(obj: object): boolean {
    const changed = this._watchers.get(obj)
    this._watchers.set(obj, false)
    return changed ?? true
  }

  private _pending: boolean = false
  private _changing: boolean = false

  // Set a hash of model attributes on the object, firing `"change"`. This is
  // the core primitive operation of a model, updating the data and notifying
  // anyone who needs to know about the change in state. The heart of the beast.
  private _setv(changes: Map<Property, unknown>, options: HasProps.SetOptions): Set<Property> {
    // Extract attributes and options.
    const check_eq   = options.check_eq
    const changed    = new Set<Property>()
    const changing   = this._changing
    this._changing = true

    const cmp = new Comparator({no_fail: true})
    for (const [prop, value] of changes) {
      if (check_eq === false || prop.is_unset || !cmp.eq(prop.get_value(), value)) {
        prop.set_value(value)
        changed.add(prop)
      }
    }

    // Trigger all relevant attribute changes.
    if (changed.size > 0) {
      this._clear_watchers()
      this._pending = true
    }
    for (const prop of changed) {
      prop.change.emit()
    }

    // You might be wondering why there's a `while` loop here. Changes can
    // be recursively nested within `"change"` events.
    if (!changing) {
      if (!(options.no_change ?? false)) {
        while (this._pending) {
          this._pending = false
          this.change.emit()
        }
      }

      this._pending = false
      this._changing = false
    }

    return changed
  }

  setv<T extends Attrs>(changed_attrs: Partial<T>, options: HasProps.SetOptions = {}): void {
    const changes = entries(changed_attrs)

    if (changes.length == 0) {
      return
    }

    if (options.silent ?? false) {
      this._clear_watchers()

      for (const [attr, value] of changes) {
        this.properties[attr].set_value(value)
      }

      return
    }

    const changed = new Map<Property, unknown>()
    const previous = new Map<Property, unknown>()

    for (const [attr, value] of changes) {
      const prop = this.properties[attr]
      changed.set(prop, value)
      previous.set(prop, prop.is_unset ? undefined : prop.get_value())
    }

    const updated = this._setv(changed, options)

    const {document} = this
    if (document != null) {
      const changed: [Property, unknown, unknown][] = []
      for (const [prop, value] of previous) {
        if (updated.has(prop)) {
          changed.push([prop, value, prop.get_value()])
        }
      }

      for (const [prop, _, new_value] of changed) {
        if (prop.may_have_refs) {
          document.partially_update_all_models(new_value)
          break
        }
      }

      const sync = options.sync ?? true
      this._push_changes(changed, sync)
    }
  }

  ref(): Ref {
    return {id: this.id}
  }

  *[Symbol.iterator](): PropertyGenerator {
    yield* values(this.properties)
  }

  *syncable_properties(): PropertyGenerator {
    for (const prop of this) {
      if (prop.syncable) {
        yield prop
      }
    }
  }

  *own_properties(): PropertyGenerator {
    const self = Object.getPrototypeOf(this) as HasProps
    const base = Object.getPrototypeOf(self) as HasProps
    const exclude = new Set(keys(base._props))
    for (const prop of this) {
      if (!exclude.has(prop.attr)) {
        yield prop
      }
    }
  }

  // add all references from 'v' to 'result', if recurse
  // is true then descend into refs, if false only
  // descend into non-refs
  static _value_record_references(value: unknown, refs: Set<HasProps>, options: {recursive: boolean}): void {
    if (!isObject(value) || !may_have_refs(value)) {
      return
    }
    const {recursive} = options
    if (value instanceof HasProps) {
      if (!refs.has(value)) {
        refs.add(value)
        if (recursive) {
          for (const prop of value.syncable_properties()) {
            if (!prop.is_unset && prop.may_have_refs) {
              const value = prop.get_value()
              HasProps._value_record_references(value, refs, {recursive})
            }
          }
        }
      }
    } else if (isIterable(value)) {
      for (const elem of value) {
        HasProps._value_record_references(elem, refs, {recursive})
      }
    } else if (isPlainObject(value)) {
      for (const elem of values(value)) {
        HasProps._value_record_references(elem, refs, {recursive})
      }
    }
  }

  static references(value: unknown, options: {recursive: boolean}): Set<HasProps> {
    const refs = new Set<HasProps>()
    HasProps._value_record_references(value, refs, options)
    return refs
  }

  references(): Set<HasProps> {
    return HasProps.references(this, {recursive: true})
  }

  protected _doc_attached(): void {}
  protected _doc_detached(): void {}

  attach_document(doc: Document): void {
    // This should only be called by the Document implementation to set the document field
    if (this.document != null) {
      if (this.document == doc) {
        return
      } else {
        throw new Error("models must be owned by only a single document")
      }
    }

    this.document = doc
    this._doc_attached()
  }

  detach_document(): void {
    // This should only be called by the Document implementation to unset the document field
    if (this.document != null) {
      this._doc_detached()
      this.document = null
    }
  }

  protected _push_changes(changes: [Property, unknown, unknown][], sync: boolean): void {
    if (!this.is_syncable) {
      return
    }

    const {document} = this
    if (document == null) {
      return
    }

    const events = []
    for (const [prop,, new_value] of changes) {
      if (prop.syncable) {
        const event = new ModelChangedEvent(document, this, prop.attr, new_value)
        event.sync = sync
        events.push(event)
      }
    }

    if (events.length != 0) {
      let event: DocumentEvent
      if (events.length == 1) {
        [event] = events
      } else {
        event = new DocumentEventBatch(document, events)
      }
      document._trigger_on_change(event)
    }
  }

  on_change(properties: Property<unknown> | Property<unknown>[], fn: () => void): void {
    for (const property of isArray(properties) ? properties : [properties]) {
      this.connect(property.change, fn)
    }
  }

  stream_to(prop: Property<Data>, new_data: Data, rollover?: number, {sync}: {sync?: boolean} = {}): void {
    const data = prop.get_value()
    stream_to_columns(data, new_data, rollover)
    this._clear_watchers()
    prop.set_value(data)
    this.streaming.emit()
    if (this.document != null) {
      const event = new ColumnsStreamedEvent(this.document, this, prop.attr, new_data, rollover)
      event.sync = sync ?? true
      this.document._trigger_on_change(event)
    }
  }

  patch_to(prop: Property<Data>, patches: PatchSet<unknown>, {sync}: {sync?: boolean} = {}): void {
    const data = prop.get_value()
    const patched = patch_to_columns(data, patches)
    this._clear_watchers()
    prop.set_value(data)
    this.patching.emit([...patched])
    if (this.document != null) {
      const event = new ColumnsPatchedEvent(this.document, this, prop.attr, patches)
      event.sync = sync ?? true
      this.document._trigger_on_change(event)
    }
  }
}

function instantiate<T extends HasProps>(cls: HasPropsClass<T>, attrs: AttrsLike, id?: string): T {
  const context: ConstructionContext = {cls, id}
  construction_stack.push(context)
  try {
    const instance = Reflect.construct(cls, [attrs]) as T
    assert(instance instanceof HasProps)
    return instance
  } finally {
    const popped = construction_stack.pop()
    assert(popped == context)
  }
}

export function construct<T extends HasProps>(cls: HasPropsClass<T>, attrs: AttrsLike = {}): T {
  const instance = instantiate(cls, attrs)
  try {
    instance.finish()
    return instance
  } catch (error) {
    try {
      instance.destroy()
    } catch (cleanup_error) {
      logger.warn(`failed to destroy ${instance} after construction failed: ${cleanup_error}`)
    }
    throw error
  }
}

/** @internal */
export function construct_deferred<T extends HasProps>(cls: HasPropsClass<T>, id: string): T {
  return instantiate(cls, {}, id)
}

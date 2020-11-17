//import {logger} from "./logging"
import {View} from "./view"
import {Class} from "./class"
import {Attrs} from "./types"
import {Signal0, Signal, Signalable, ISignalable} from "./signaling"
import {Struct, Ref, is_ref} from "./util/refs"
import * as p from "./properties"
import * as k from "./kinds"
import {Property} from "./properties"
import {uniqueId} from "./util/string"
import {values, entries, extend} from "./util/object"
import {isPlainObject, isArray, isFunction, isPrimitive} from "./util/types"
import {is_equal} from './util/eq'
import {serialize, Serializable, Serializer} from "./serializer"
import {Document, DocumentEvent, DocumentEventBatch, ModelChangedEvent} from "../document"
import {equals, Equatable, Comparator} from "./util/eq"
import {pretty, Printable, Printer} from "./util/pretty"
import {clone, Cloneable, Cloner} from "./util/cloneable"
import * as kinds from "./kinds"

export module HasProps {
  export type Attrs = p.AttrsOf<Props>
  export type Props = {}

  export type SetOptions = {
    check_eq?: boolean
    silent?: boolean
    no_change?: boolean
    setter_id?: string
  }
}

export interface HasProps extends HasProps.Attrs, ISignalable {
  constructor: Function & {
    __name__: string
    __module__?: string
    __qualified__: string
  }
}

export type PropertyGenerator = Generator<Property, void, undefined>

export abstract class HasProps extends Signalable() implements Equatable, Printable, Serializable, Cloneable {
  __view_type__: View

  readonly id: string

  // XXX: setter is only required for backwards compatibility
  set type(name: string) {
    console.warn("prototype.type = 'ModelName' is deprecated, use static __name__ instead")
    this.constructor.__name__ = name
  }

  get type(): string {
    return this.constructor.__qualified__
  }

  static __name__: string
  static __module__?: string

  static get __qualified__(): string {
    const {__module__, __name__} = this
    return __module__ != null ? `${__module__}.${__name__}` : __name__
  }

  static get [Symbol.toStringTag](): string {
    return this.__name__
  }

  static init_HasProps(): void {
    this.prototype._props = {}
    this.prototype._mixins = []
  }

  /** @prototype */
  default_view: Class<View, [View.Options]>

  /** @prototype */
  _props: {[key: string]: {
    type: p.PropertyConstructor<unknown>
    default_value?: (self: HasProps) => unknown // T
    options: p.PropertyOptions<unknown>
  }}

  /** @prototype */
  _mixins: [string, object][]

  private static _fix_default(default_value: any, _attr: string): undefined | (() => any) {
    if (default_value === undefined || isFunction(default_value))
      return default_value
    else if (isPrimitive(default_value))
      return () => default_value
    else {
      const cloner = new Cloner()
      return () => cloner.clone(default_value)
    }
  }

  // TODO: don't use Partial<>, but exclude inherited properties
  static define<T>(obj: Partial<p.DefineOf<T>> | ((types: typeof kinds) => Partial<p.DefineOf<T>>)): void {
    for (const [name, prop] of entries(isFunction(obj) ? obj(kinds) : obj)) {
      if (this.prototype._props[name] != null)
        throw new Error(`attempted to redefine property '${this.prototype.type}.${name}'`)

      if ((this.prototype as any)[name] != null)
        throw new Error(`attempted to redefine attribute '${this.prototype.type}.${name}'`)

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

      const [type, default_value, options] = prop as any
      const refined_prop = {
        type,
        default_value: this._fix_default(default_value, name),
        options,
      }

      const props = {...this.prototype._props}
      props[name] = refined_prop
      this.prototype._props = props
    }
  }

  static internal<T>(obj: Partial<p.DefineOf<T>> | ((types: typeof kinds) => Partial<p.DefineOf<T>>)): void {
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

  static override<T>(obj: Partial<p.DefaultsOf<T>>): void {
    for (const [name, prop] of entries(obj)) {
      const default_value = this._fix_default(prop, name)
      const value = this.prototype._props[name]
      if (value == null)
        throw new Error(`attempted to override nonexistent '${this.prototype.type}.${name}'`)
      const props = {...this.prototype._props}
      props[name] = {...value, default_value}
      this.prototype._props = props
    }
  }

  toString(): string {
    return `${this.type}(${this.id})`
  }

  _subtype: string | undefined = undefined

  document: Document | null = null

  readonly destroyed       = new Signal0<this>(this, "destroyed")
  readonly change          = new Signal0<this>(this, "change")
  readonly transformchange = new Signal0<this>(this, "transformchange")

  readonly properties: {[key: string]: Property} = {}

  property(name: string): Property {
    const prop = this.properties[name]
    if (prop != null)
      return prop
    else
      throw new Error(`unknown property ${this.type}.${name}`)
  }

  get attributes(): Attrs {
    const attrs: Attrs = {}
    for (const prop of this) {
      attrs[prop.attr] = prop.get_value()
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
    return new (this.constructor as any)(attrs)
  }

  [equals](that: this, cmp: Comparator): boolean {
    for (const p0 of this) {
      const p1 = that.property(p0.attr)
      if (cmp.eq(p0.get_value(), p1.get_value()))
        return false
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

  [serialize](serializer: Serializer): Ref {
    const ref = this.ref()
    serializer.add_ref(this, ref)

    const struct = this.struct()
    for (const prop of this) {
      if (prop.syncable && (serializer.include_defaults || prop.dirty)) {
        struct.attributes[prop.attr] = serializer.to_serializable(prop.get_value())
      }
    }
    serializer.add_def(this, struct)

    return ref
  }

  constructor(attrs: Attrs | Map<string, unknown> = {}) {
    super()

    const get = attrs instanceof Map ? attrs.get.bind(attrs) : (name: string) => attrs[name]

    this.id = (get("id") as string | undefined) ?? uniqueId()

    for (const [name, {type, default_value, options}] of entries(this._props)) {
      let property: p.Property<unknown>

      if (type instanceof p.PropertyAlias) {
        property = new Proxy(this.properties[type.attr], {
          get(target, member) {
            return member == "attr" ? name : target[member as keyof typeof target]
          },
        })
      } else if (type instanceof k.Kind)
        property = new p.PrimitiveProperty(this, name, type, default_value, get(name), options)
      else
        property = new type(this, name, k.Any, default_value, get(name), options)

      this.properties[name] = property
    }

    // allowing us to defer initialization when loading many models
    // when loading a bunch of models, we want to do initialization as a second pass
    // because other objects that this one depends on might not be loaded yet
    if (!(get("__deferred__") ?? false)) {
      this.finalize()
      this.connect_signals()
    }
  }

  finalize(): void {
    for (const prop of this) {
      if (prop.spec.transform != null)
        this.connect(prop.spec.transform.change, () => this.transformchange.emit())
    }

    this.initialize()
  }

  initialize(): void {}

  connect_signals(): void {}

  disconnect_signals(): void {
    Signal.disconnectReceiver(this)
  }

  destroy(): void {
    this.disconnect_signals()
    this.destroyed.emit()
  }

  // Create a new model with exact attribute values to this one, but new identity.
  clone(): this {
    const cloner = new Cloner()
    return cloner.clone(this)
  }

  private _pending: boolean = false
  private _changing: boolean = false

  // Set a hash of model attributes on the object, firing `"change"`. This is
  // the core primitive operation of a model, updating the data and notifying
  // anyone who needs to know about the change in state. The heart of the beast.
  private _setv(changes: Map<Property, unknown>, options: HasProps.SetOptions): void {
    // Extract attributes and options.
    const check_eq   = options.check_eq
    const changed    = []
    const changing   = this._changing
    this._changing = true

    for (const [prop, value] of changes) {
      if (check_eq === false || !is_equal(prop.get_value(), value)) {
        prop.set_value(value)
        changed.push(prop)
      }
    }

    // Trigger all relevant attribute changes.
    if (changed.length > 0)
      this._pending = true
    for (const prop of changed) {
      prop.change.emit()
    }

    // You might be wondering why there's a `while` loop here. Changes can
    // be recursively nested within `"change"` events.
    if (changing)
      return
    if (!options.no_change) {
      while (this._pending) {
        this._pending = false
        this.change.emit()
      }
    }

    this._pending = false
    this._changing = false
  }

  setv(changed_attrs: Attrs, options: HasProps.SetOptions = {}): void {
    const changes = entries(changed_attrs)

    if (changes.length == 0)
      return

    if (options.silent === true) {
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
      previous.set(prop, prop.get_value())
    }

    this._setv(changed, options)

    const {document} = this
    if (document != null) {
      const changed: [Property, unknown, unknown][] = []
      for (const [prop, value] of previous) {
        changed.push([prop, value, prop.get_value()])
      }

      for (const [, old_value, new_value] of changed) {
        if (this._needs_invalidate(old_value, new_value)) {
          document._invalidate_all_models()
          break
        }
      }

      this._push_changes(changed, options)
    }
  }

  /** @deprecated */
  getv(name: string): unknown {
    return this.property(name).get_value()
  }

  ref(): Ref {
    return {id: this.id}
  }

  struct(): Struct {
    const struct: Struct = {
      type: this.type,
      id: this.id,
      attributes: {},
    }
    if (this._subtype != null) {
      struct.subtype = this._subtype
    }
    return struct
  }

  // we only keep the subtype so we match Python;
  // only Python cares about this
  set_subtype(subtype: string): void {
    this._subtype = subtype
  }

  *[Symbol.iterator](): PropertyGenerator {
    yield* values(this.properties)
  }

  *syncable_properties(): PropertyGenerator {
    for (const prop of this) {
      if (prop.syncable)
        yield prop
    }
  }

  /** @deprecated */
  serializable_attributes(): Attrs {
    const attrs: Attrs = {}
    for (const prop of this.syncable_properties()) {
      attrs[prop.attr] = prop.get_value()
    }
    return attrs
  }

  // this is like _value_record_references but expects to find refs
  // instead of models, and takes a doc to look up the refs in
  static _json_record_references(doc: Document, v: unknown, refs: Set<HasProps>, options: {recursive: boolean}): void {
    const {recursive} = options
    if (is_ref(v)) {
      const model = doc.get_model_by_id(v.id)
      if (model != null && !refs.has(model)) {
        HasProps._value_record_references(model, refs, {recursive})
      }
    } else if (isArray(v)) {
      for (const elem of v)
        HasProps._json_record_references(doc, elem, refs, {recursive})
    } else if (isPlainObject(v)) {
      for (const elem of values(v)) {
        HasProps._json_record_references(doc, elem, refs, {recursive})
      }
    }
  }

  // add all references from 'v' to 'result', if recurse
  // is true then descend into refs, if false only
  // descend into non-refs
  static _value_record_references(v: unknown, refs: Set<HasProps>, options: {recursive: boolean}): void {
    const {recursive} = options
    if (v instanceof HasProps) {
      if (!refs.has(v)) {
        refs.add(v)
        if (recursive) {
          for (const prop of v.syncable_properties()) {
            const value = prop.get_value()
            HasProps._value_record_references(value, refs, {recursive})
          }
        }
      }
    } else if (isArray(v)) {
      for (const elem of v)
        HasProps._value_record_references(elem, refs, {recursive})
    } else if (isPlainObject(v)) {
      for (const elem of values(v)) {
        HasProps._value_record_references(elem, refs, {recursive})
      }
    }
  }

  references(): Set<HasProps> {
    const refs = new Set<HasProps>()
    HasProps._value_record_references(this, refs, {recursive: true})
    return refs
  }

  protected _doc_attached(): void {}
  protected _doc_detached(): void {}

  attach_document(doc: Document): void {
    // This should only be called by the Document implementation to set the document field
    if (this.document != null && this.document != doc)
      throw new Error("models must be owned by only a single document")

    this.document = doc
    this._doc_attached()
  }

  detach_document(): void {
    // This should only be called by the Document implementation to unset the document field
    this._doc_detached()
    this.document = null
  }

  protected _needs_invalidate(old_value: unknown, new_value: unknown): boolean {
    const new_refs = new Set<HasProps>()
    HasProps._value_record_references(new_value, new_refs, {recursive: false})

    const old_refs = new Set<HasProps>()
    HasProps._value_record_references(old_value, old_refs, {recursive: false})

    for (const new_id of new_refs) {
      if (!old_refs.has(new_id))
        return true
    }

    for (const old_id of old_refs) {
      if (!new_refs.has(old_id))
        return true
    }

    return false
  }

  protected _push_changes(changes: [Property, unknown, unknown][], options: {setter_id?: string} = {}): void {
    const {document} = this
    if (document == null)
      return

    const {setter_id} = options

    const events = []
    for (const [prop, old_value, new_value] of changes) {
      if (prop.syncable)
        events.push(new ModelChangedEvent(document, this, prop.attr, old_value, new_value, setter_id))
    }

    if (events.length != 0) {
      let event: DocumentEvent
      if (events.length == 1)
        [event] = events
      else
        event = new DocumentEventBatch(document, events, setter_id)
      document._trigger_on_change(event)
    }
  }

  on_change(properties: Property<unknown> | Property<unknown>[], fn: () => void): void {
    for (const property of isArray(properties) ? properties : [properties]) {
      this.connect(property.change, fn)
    }
  }
}

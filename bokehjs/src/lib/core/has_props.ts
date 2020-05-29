//import {logger} from "./logging"
import {View} from "./view"
import {Class} from "./class"
import {Attrs, PlainObject} from "./types"
import {Signal0, Signal, Signalable, ISignalable} from "./signaling"
import {Struct, Ref, is_ref} from "./util/refs"
import * as p from "./properties"
import * as mixins from "./property_mixins"
import {Property} from "./properties"
import {uniqueId} from "./util/string"
import {max, copy} from "./util/array"
import {entries, clone, extend, isEmpty} from "./util/object"
import {isPlainObject, isObject, isArray, isString, isFunction} from "./util/types"
import {isEqual} from './util/eq'
import {ColumnarDataSource} from "models/sources/columnar_data_source"
import {Document, DocumentEvent, DocumentEventBatch, ModelChangedEvent} from "../document"
import {is_NDArray} from "./util/ndarray"
import {encode_NDArray} from "./util/serialization"

export module HasProps {
  export type Attrs = p.AttrsOf<Props>

  export type Props = {
    id: p.Property<string>
  }

  export interface SetOptions {
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

  // XXX: this may indicate a bug in the compiler, because --project and
  // --build disagree whether this is necessary or not (it shouldn't).
  id: string
}

export type PropertyGenerator = Generator<Property, void>

export abstract class HasProps extends Signalable() {
  __view_type__: View

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

  static init_HasProps(): void {
    this.prototype._props = {}
    this.prototype._mixins = []

    this.define<HasProps.Props>({
      id: [ p.String, () => uniqueId() ],
    })
  }

  /** @prototype */
  default_view: Class<View, [View.Options]>

  /** @prototype */
  _props: {[key: string]: {
    type: p.PropertyConstructor<unknown>
    default_value?: () => unknown   // T
    options: p.PropertyOptions
  }}

  /** @prototype */
  _mixins: string[]

  private static _fix_default(default_value: any, _attr: string): undefined | (() => any) {
    if (default_value === undefined)
      return undefined
    else if (isFunction(default_value))
      return default_value
    else if (!isObject(default_value))
      return () => default_value
    else {
      //logger.warn(`${this.prototype.type}.${attr} uses unwrapped non-primitive default value`)

      if (isArray(default_value))
        return () => copy(default_value)
      else
        return () => clone(default_value as PlainObject)
    }
  }

  // TODO: don't use Partial<>, but exclude inherited properties
  static define<T>(obj: Partial<p.DefineOf<T>>): void {
    for (const [name, prop] of entries(obj)) {
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

      const props = clone(this.prototype._props)
      props[name] = refined_prop
      this.prototype._props = props
    }
  }

  static internal(obj: any): void {
    const _object: any = {}
    for (const [name, entry] of entries(obj)) {
      const [type, default_value, options = {}] = entry as any
      _object[name] = [type, default_value, {...options, internal: true}]
    }
    this.define(_object)
  }

  static mixins<_T>(defs: Attrs | string[] | (Attrs | [string, Attrs])[]): void {
    if (!isArray(defs))
      defs = [defs]

    function resolve(kind: string): any {
      switch (kind) {
        case "line":  return mixins.LineVector
        case "fill":  return mixins.FillVector
        case "hatch": return mixins.HatchVector
        case "text":  return mixins.TextVector
        default:
          throw new Error(`Unknown property mixin kind '${kind}'`)
      }
    }

    function rename(prefix: string, mixin: Attrs): Attrs {
      const result: Attrs = {}
      for (const [name, prop] of entries(mixin)) {
        result[prefix + name] = prop
      }
      return result
    }

    function kind_of(mixin: Attrs): string {
      const [key] = Object.keys(mixin)
      const [kind] = key.split("_", 1)
      return kind
    }

    const mixin_defs: Attrs = {}
    const names: string[] = []
    for (const def of defs) {
      if (isString(def)) {
        // TODO: remove this branch in 3.0
        const [kind, prefix = ""] = def.split(":")
        const mixin = resolve(kind)
        names.push(def)
        extend(mixin_defs, rename(prefix, mixin))
      } else if (isArray(def)) {
        const [prefix, mixin] = def
        names.push(`${kind_of(mixin)}:${prefix}`)
        extend(mixin_defs, rename(prefix, mixin))
      } else {
        const mixin = def
        names.push(kind_of(mixin))
        extend(mixin_defs, mixin)
      }
    }

    this.define(mixin_defs as any)
    this.prototype._mixins = [...this.prototype._mixins, ...names]
  }

  static override(obj: any): void {
    for (const [name, prop] of entries(obj)) {
      const default_value = this._fix_default(prop, name)
      const value = this.prototype._props[name]
      if (value == null)
        throw new Error(`attempted to override nonexistent '${this.prototype.type}.${name}'`)
      const props = clone(this.prototype._props)
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

  readonly properties: {[key: string]: Property} = {} // Object.create(null)

  property(name: string): Property {
    const prop = this.properties[name]
    if (prop != null)
      return prop
    else
      throw new Error(`unknown property ${this.type}.${name}`)
  }

  get attributes(): Attrs {
    const attrs: Attrs = {} // Object.create(null)
    for (const prop of this) {
      attrs[prop.attr] = prop.get_value()
    }
    return attrs
  }

  constructor(attrs: Attrs | Map<string, unknown> = {}) {
    super()

    const get = attrs instanceof Map ? attrs.get : (name: string) => attrs[name]

    for (const [name, {type, default_value, options}] of entries(this._props)) {
      if (type != null)
        this.properties[name] = new type(this, name, default_value, get(name), options)
      else
        throw new Error(`undefined property type for ${this.type}.${name}`)
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

  // Create a new model with identical attributes to this one.
  clone(): this {
    return new (this.constructor as any)(this.attributes)
  }

  private _pending: boolean = false
  private _changing: boolean = false

  // Set a hash of model attributes on the object, firing `"change"`. This is
  // the core primitive operation of a model, updating the data and notifying
  // anyone who needs to know about the change in state. The heart of the beast.
  private _setv(changes: Map<Property, unknown>, options: HasProps.SetOptions): void {
    // Extract attributes and options.
    const check_eq   = options.check_eq
    const silent     = options.silent
    const changed    = []
    const changing   = this._changing
    this._changing = true

    for (const [prop, value] of changes) {
      if (check_eq === false || !isEqual(prop.get_value(), value)) {
        prop.set_value(value)
        changed.push(prop)
      }
    }

    // Trigger all relevant attribute changes.
    if (!silent) {
      if (changed.length > 0)
        this._pending = true
      for (const prop of changed) {
        prop.change.emit()
      }
    }

    // You might be wondering why there's a `while` loop here. Changes can
    // be recursively nested within `"change"` events.
    if (changing)
      return
    if (!silent && !options.no_change) {
      while (this._pending) {
        this._pending = false
        this.change.emit()
      }
    }

    this._pending = false
    this._changing = false
  }

  setv(changes: Attrs, options: HasProps.SetOptions = {}): void {
    if (isEmpty(changes))
      return

    const changed = new Map<Property, unknown>()
    const previous = new Map<Property, unknown>()

    for (const attr in changes) {
      if (!changes.hasOwnProperty(attr))
        continue

      const prop = this.properties[attr]
      if (prop == null)
        throw new Error(`property ${this.type}.${attr} wasn't declared`)

      const value = changes[attr]
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

      if (options.silent !== true) {
        this._push_changes(changed, options)
      }
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
    for (const name in this.properties) {
      yield this.properties[name]
    }
  }

  *syncable_properties(): PropertyGenerator {
    for (const prop of this) {
      if (prop.syncable)
        yield prop
    }
  }

  static _value_to_json(value: unknown): unknown {
    if (value instanceof HasProps)
      return value.ref()
    else if (is_NDArray(value))
      return encode_NDArray(value)
    else if (isArray(value)) {
      const ref_array: unknown[] = []
      for (let i = 0; i < value.length; i++) {
        const v = value[i]
        ref_array.push(HasProps._value_to_json(v))
      }
      return ref_array
    } else if (isPlainObject(value)) {
      const ref_obj: Attrs = {}
      for (const subkey in value) {
        if (value.hasOwnProperty(subkey))
          ref_obj[subkey] = HasProps._value_to_json(value[subkey])
      }
      return ref_obj
    } else
      return value
  }

  // Convert attributes to "shallow" JSON (values which are themselves models
  // are included as just references)
  attributes_as_json(include_defaults: boolean = true, value_to_json=HasProps._value_to_json): Attrs {
    const attributes: Attrs = {} // Object.create(null)
    for (const prop of this) {
      if (prop.syncable && (include_defaults || prop.dirty)) {
        attributes[prop.attr] = value_to_json(prop.get_value())
      }
    }
    return attributes
  }

  // this is like _value_record_references but expects to find refs
  // instead of models, and takes a doc to look up the refs in
  static _json_record_references(doc: Document, v: any, refs: Set<HasProps>, options: {recursive: boolean}): void {
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
      for (const k in v) {
        if (v.hasOwnProperty(k)) {
          const elem = v[k]
          HasProps._json_record_references(doc, elem, refs, {recursive})
        }
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
          const immediate = v._immediate_references()
          for (const obj of immediate)
            HasProps._value_record_references(obj, refs, {recursive: true})
        }
      }
    } else if (isArray(v)) {
      for (const elem of v)
        HasProps._value_record_references(elem, refs, {recursive})
    } else if (isPlainObject(v)) {
      for (const k in v) {
        if (v.hasOwnProperty(k)) {
          const elem = v[k]
          HasProps._value_record_references(elem, refs, {recursive})
        }
      }
    }
  }

  // Get models that are immediately referenced by our properties
  // (do not recurse, do not include ourselves)
  protected _immediate_references(): HasProps[] {
    const refs = new Set<HasProps>()
    for (const prop of this.syncable_properties()) {
      const value = prop.get_value()
      HasProps._value_record_references(value, refs, {recursive: false})
    }
    return [...refs.values()]
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

  materialize_dataspecs(source: ColumnarDataSource): {[key: string]: unknown[] | number} {
    // Note: this should be moved to a function separate from HasProps
    const data: {[key: string]: unknown[] | number} = {}
    for (const prop of this) {
      if (!(prop instanceof p.VectorSpec))
        continue
      // this skips optional properties like radius for circles
      if (prop.optional && prop.spec.value == null && !prop.dirty)
        continue

      const name = prop.attr
      const array = prop.array(source)

      data[`_${name}`] = array
      if (prop instanceof p.DistanceSpec)
        data[`max_${name}`] = max(array)
    }
    return data
  }
}

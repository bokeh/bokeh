//import {logger} from "./logging"
import {View} from "./view"
import {Class} from "./class"
import {Attrs} from "./types"
import {Signal0, Signal, Signalable, ISignalable} from "./signaling"
import * as property_mixins from "./property_mixins"
import {Struct, Ref, is_ref} from "./util/refs"
import * as p from "./properties"
import {Property} from "./properties"
import {uniqueId} from "./util/string"
import {max, copy} from "./util/array"
import {values, clone, isEmpty} from "./util/object"
import {isPlainObject, isObject, isArray, isFunction} from "./util/types"
import {isEqual} from './util/eq'
import {ColumnarDataSource} from "models/sources/columnar_data_source"
import {Document} from "../document"

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

export type PropertyGenerator = Generator<[string, Property<unknown>], void>

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
    this.prototype.mixins = []

    this.define<HasProps.Props>({
      id: [ p.String, () => uniqueId() ],
    })
  }

  // {{{ prototype
  default_view: Class<View, [View.Options]>
  _props: {[key: string]: {
    type: p.PropertyConstructor<unknown>
    default_value?: () => unknown   // T
    options: p.PropertyOptions
  }}
  mixins: string[]
  // }}}

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
        return () => clone(default_value)
    }
  }

  // TODO: don't use Partial<>, but exclude inherited properties
  static define<T>(obj: Partial<p.DefineOf<T>>): void {
    for (const name in obj) {
      const prop = obj[name]
      if (this.prototype._props[name] != null)
        throw new Error(`attempted to redefine property '${this.prototype.type}.${name}'`)

      if ((this.prototype as any)[name] != null)
        throw new Error(`attempted to redefine attribute '${this.prototype.type}.${name}'`)

      Object.defineProperty(this.prototype, name, {
        // XXX: don't use tail calls in getters/setters due to https://bugs.webkit.org/show_bug.cgi?id=164306
        get(this: HasProps): any {
          const value = this.getv(name)
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
    for (const name in obj) {
      const [type, default_value, options = {}] = obj[name]
      _object[name] = [type, default_value, {...options, internal: true}]
    }
    this.define(_object)
  }

  static mixin(...names: string[]): void {
    this.define(property_mixins.create(names) as any)
    const mixins = this.prototype.mixins.concat(names)
    this.prototype.mixins = mixins
  }

  static mixins(names: string[]): void {
    this.mixin(...names)
  }

  static override(obj: any): void {
    for (const name in obj) {
      const default_value = this._fix_default(obj[name], name)
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

  readonly properties: {[key: string]: Property<unknown>} = {} // Object.create(null)

  property(name: string): Property<unknown> {
    const prop = this.properties[name]
    if (prop != null)
      return prop
    else
      throw new Error(`unknown property ${name}`)
  }

  get attributes(): Attrs {
    const attrs: Attrs = {} // Object.create(null)
    for (const [name, prop] of this) {
      attrs[name] = prop.get_value()
    }
    return attrs
  }

  constructor(attrs: Attrs | Map<string, unknown> = {}) {
    super()

    const get = attrs instanceof Map ? attrs.get : (name: string) => attrs[name]

    for (const name in this._props) {
      const {type, default_value, options} = this._props[name]
      if (type != null)
        this.properties[name] = new type(this, name, default_value, get(name), options)
      else
        throw new Error(`undefined property type for ${this.type}.${name}`)
    }

    // allowing us to defer initialization when loading many models
    // when loading a bunch of models, we want to do initialization as a second pass
    // because other objects that this one depends on might not be loaded yet
    if (!(get("__deferred__") ?? false))
      this.finalize()
  }

  finalize(): void {
    for (const name in this.properties) {
      const prop = this.properties[name]
      if (prop.spec.transform != null)
        this.connect(prop.spec.transform.change, () => this.transformchange.emit())
    }

    this.initialize()
    this.connect_signals()
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
  private _setv(attrs: Attrs, options: HasProps.SetOptions): void {
    // Extract attributes and options.
    const check_eq   = options.check_eq
    const silent     = options.silent
    const changes    = []
    const changing   = this._changing
    this._changing = true

    for (const attr in attrs) {
      const prop = this.properties[attr]
      const val = attrs[attr]

      if (check_eq === false || !isEqual(prop.get_value(), val)) {
        prop.set_value(val)
        changes.push(prop)
      }
    }

    // Trigger all relevant attribute changes.
    if (!silent) {
      if (changes.length > 0)
        this._pending = true
      for (const prop of changes) {
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

  setv(attrs: Attrs, options: HasProps.SetOptions = {}): void {
    for (const key in attrs) {
      if (!attrs.hasOwnProperty(key))
        continue

      const prop_name = key
      if (this.properties[prop_name] == null)
        throw new Error(`property ${this.type}.${prop_name} wasn't declared`)
    }

    if (!isEmpty(attrs)) {
      const old: typeof attrs = {}
      for (const key in attrs)
        old[key] = this.getv(key)
      this._setv(attrs, options)

      const silent = options.silent
      if (silent == null || !silent) {
        for (const key in attrs)
          this._tell_document_about_change(key, old[key], this.getv(key), options)
      }
    }
  }

  getv(name: string): any {
    if (this.properties[name] != null)
      return this.properties[name].get_value()
    else
      throw new Error(`property ${this.type}.${name} wasn't declared`)
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
      yield [name, this.properties[name]]
    }
  }

  *syncable_properties(): PropertyGenerator {
    for (const entry of this) {
      const [, prop] = entry
      if (prop.syncable) {
        yield entry
      }
    }
  }

  static _value_to_json(_key: string, value: any, _optional_parent_object: any): any {
    if (value instanceof HasProps)
      return value.ref()
    else if (isArray(value)) {
      const ref_array: unknown[] = []
      for (let i = 0; i < value.length; i++) {
        const v = value[i]
        ref_array.push(HasProps._value_to_json(i.toString(), v, value))
      }
      return ref_array
    } else if (isPlainObject(value)) {
      const ref_obj: Attrs = {}
      for (const subkey in value) {
        if (value.hasOwnProperty(subkey))
          ref_obj[subkey] = HasProps._value_to_json(subkey, value[subkey], value)
      }
      return ref_obj
    } else
      return value
  }

  // Convert attributes to "shallow" JSON (values which are themselves models
  // are included as just references)
  attributes_as_json(include_defaults: boolean = true, value_to_json=HasProps._value_to_json): any {
    const attributes: Attrs = {} // Object.create(null)
    for (const [name, prop] of this) {
      if (prop.syncable && (include_defaults || prop.dirty)) {
        attributes[name] = prop.get_value()
      }
    }
    return value_to_json("attributes", attributes, this)
  }

  // this is like _value_record_references but expects to find refs
  // instead of models, and takes a doc to look up the refs in
  static _json_record_references(doc: Document, v: any, result: {[key: string]: HasProps}, options: {recursive: boolean}): void {
    const {recursive} = options
    if (is_ref(v)) {
      if (!(v.id in result)) {
        const model = doc.get_model_by_id(v.id)
        HasProps._value_record_references(model, result, {recursive})
      }
    } else if (isArray(v)) {
      for (const elem of v)
        HasProps._json_record_references(doc, elem, result, {recursive})
    } else if (isPlainObject(v)) {
      for (const k in v) {
        if (v.hasOwnProperty(k)) {
          const elem = v[k]
          HasProps._json_record_references(doc, elem, result, {recursive})
        }
      }
    }
  }

  // add all references from 'v' to 'result', if recurse
  // is true then descend into refs, if false only
  // descend into non-refs
  static _value_record_references(v: any, result: Attrs, options: {recursive: boolean}): void {
    const {recursive} = options
    if (v instanceof HasProps) {
      if (!(v.id in result)) {
        result[v.id] = v
        if (recursive) {
          const immediate = v._immediate_references()
          for (const obj of immediate)
            HasProps._value_record_references(obj, result, {recursive: true})
        }
      }
    } else if (isArray(v)) {
      for (const elem of v)
        HasProps._value_record_references(elem, result, {recursive})
    } else if (isPlainObject(v)) {
      for (const k in v) {
        if (v.hasOwnProperty(k)) {
          const elem = v[k]
          HasProps._value_record_references(elem, result, {recursive})
        }
      }
    }
  }

  // Get models that are immediately referenced by our properties
  // (do not recurse, do not include ourselves)
  protected _immediate_references(): HasProps[] {
    const result = {}
    for (const [, prop] of this.syncable_properties()) {
      const value = prop.get_value()
      HasProps._value_record_references(value, result, {recursive: false})
    }
    return values(result)
  }

  references(): HasProps[] {
    const references = {}
    HasProps._value_record_references(this, references, {recursive: true})
    return values(references)
  }

  protected _doc_attached(): void {}

  attach_document(doc: Document): void {
    // This should only be called by the Document implementation to set the document field
    if (this.document != null && this.document != doc)
      throw new Error("models must be owned by only a single document")

    this.document = doc
    this._doc_attached()
  }

  detach_document(): void {
    // This should only be called by the Document implementation to unset the document field
    this.document = null
  }

  protected _tell_document_about_change(attr: string, old: any, new_: any, options: {setter_id?: string}): void {
    if (!this.properties[attr].syncable)
      return

    if (this.document != null) {
      const new_refs: {[key: string]: HasProps} = {}
      HasProps._value_record_references(new_, new_refs, {recursive: false})

      const old_refs: {[key: string]: HasProps} = {}
      HasProps._value_record_references(old, old_refs, {recursive: false})

      let need_invalidate = false
      for (const new_id in new_refs) {
        if (!(new_id in old_refs)) {
          need_invalidate = true
          break
        }
      }

      if (!need_invalidate) {
        for (const old_id in old_refs) {
          if (!(old_id in new_refs)) {
            need_invalidate = true
            break
          }
        }
      }

      if (need_invalidate)
        this.document._invalidate_all_models()

      this.document._notify_change(this, attr, old, new_, options)
    }
  }

  materialize_dataspecs(source: ColumnarDataSource): {[key: string]: unknown[] | number} {
    // Note: this should be moved to a function separate from HasProps
    const data: {[key: string]: unknown[] | number} = {}
    for (const [name, prop] of this) {
      if (!(prop instanceof p.VectorSpec))
        continue
      // this skips optional properties like radius for circles
      if (prop.optional && prop.spec.value == null && !prop.dirty)
        continue

      const array = prop.array(source)
      data[`_${name}`] = array
      // the shapes are indexed by the column name, but when we materialize the dataspec, we should
      // store under the canonical field name, e.g. _image_shape, even if the column name is "foo"
      if (prop.spec.field != null && prop.spec.field in source._shapes)
        data[`_${name}_shape`] = source._shapes[prop.spec.field]
      if (prop instanceof p.DistanceSpec)
        data[`max_${name}`] = max(array)
    }
    return data
  }
}

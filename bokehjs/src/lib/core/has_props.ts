//import {logger} from "./logging"
import {View} from "./view"
import {Class} from "./class"
import {Signal0, Signal, Signalable} from "./signaling"
import * as property_mixins from "./property_mixins"
import {Ref, is_ref, create_ref} from "./util/refs"
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
  export interface Attrs {
    id: string
  }

  export interface Props {
    id: p.Any
  }

  export interface SetOptions {
    check_eq?: boolean
    silent?: boolean
    no_change?: boolean
    defaults?: boolean
    setter_id?: string
  }
}

export interface HasProps extends HasProps.Attrs {}

export abstract class HasProps extends Signalable() {

  static initClass(): void {
    this.prototype.type = "HasProps"

    this.prototype.props = {}
    this.prototype.mixins = []

    this.define({
      id: [ p.Any ],
    })
  }

  // {{{ prototype
  type: string
  default_view: Class<View>
  props: {[key: string]: {
    type: Class<Property<any>>,  // T
    default_value: any,          // T
    internal: boolean,
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

  static define(obj: any): void {
    for (const name in obj) {
      const prop = obj[name]
      if (this.prototype.props[name] != null)
        throw new Error(`attempted to redefine property '${this.prototype.type}.${name}'`)

      if ((this.prototype as any)[name] != null)
        throw new Error(`attempted to redefine attribute '${this.prototype.type}.${name}'`)

      Object.defineProperty(this.prototype, name, {
        // XXX: don't use tail calls in getters/setters due to https://bugs.webkit.org/show_bug.cgi?id=164306
        get: function(this: HasProps): any {
          const value = this.getv(name)
          return value
        },
        set: function(this: HasProps, value: any): HasProps {
          this.setv({[name]: value})
          return this
        },
        configurable: false,
        enumerable: true,
      })

      const [type, default_value, internal] = prop
      const refined_prop = {
        type: type,
        default_value: this._fix_default(default_value, name),
        internal: internal || false,
      }

      const props = clone(this.prototype.props)
      props[name] = refined_prop
      this.prototype.props = props
    }
  }

  static internal(obj: any): void {
    const _object: any = {}
    for (const name in obj) {
      const prop = obj[name]
      const [type, default_value] = prop
      _object[name] = [type, default_value, true]
    }
    this.define(_object)
  }

  static mixin(...names: string[]): void {
    this.define(property_mixins.create(names))
    const mixins = this.prototype.mixins.concat(names)
    this.prototype.mixins = mixins
  }

  static mixins(names: string[]): void {
    this.mixin(...names)
  }

  static override(obj: any): void {
    for (const name in obj) {
      const default_value = this._fix_default(obj[name], name)
      const value = this.prototype.props[name]
      if (value == null)
        throw new Error(`attempted to override nonexistent '${this.prototype.type}.${name}'`)
      const props = clone(this.prototype.props)
      props[name] = {...value, default_value}
      this.prototype.props = props
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

  readonly attributes: {[key: string]: any} = {}
  readonly properties: {[key: string]: any} = {}

  protected readonly _set_after_defaults: {[key: string]: boolean} = {}

  constructor(attrs: {[key: string]: any} = {}) {
    super()

    for (const name in this.props) {
      const {type, default_value} = this.props[name]
      if (type != null)
        this.properties[name] = new type(this, name, default_value)
      else
        throw new Error(`undefined property type for ${this.type}.${name}`)
    }

    // auto generating ID
    if (attrs.id == null)
      this.setv({id: uniqueId()}, {silent: true})

    const deferred = attrs.__deferred__ || false
    if (deferred) {
      attrs = clone(attrs)
      delete attrs.__deferred__
    }

    this.setv(attrs, {silent: true})

    // allowing us to defer initialization when loading many models
    // when loading a bunch of models, we want to do initialization as a second pass
    // because other objects that this one depends on might not be loaded yet

    if (!deferred)
      this.finalize()
  }

  finalize(): void {
    // This is necessary because the initial creation of properties relies on
    // model.get which is not usable at that point yet in the constructor. This
    // initializer is called when deferred initialization happens for all models
    // and insures that the Bokeh properties are initialized from Backbone
    // attributes in a consistent way.
    //
    // TODO (bev) split property creation up into two parts so that only the
    // portion of init that can be done happens in HasProps constructor and so
    // that subsequent updates do not duplicate that setup work.
    for (const name in this.properties) {
      const prop = this.properties[name]
      prop.update()
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
  private _setv(attrs: {[key: string]: any}, options: HasProps.SetOptions): void {
    // Extract attributes and options.
    const check_eq   = options.check_eq
    const silent     = options.silent
    const changes    = []
    const changing   = this._changing
    this._changing = true

    const current = this.attributes

    // For each `set` attribute, update or delete the current value.
    for (const attr in attrs) {
      const val = attrs[attr]
      if (check_eq !== false) {
        if (!isEqual(current[attr], val))
          changes.push(attr)
      } else
        changes.push(attr)
      current[attr] = val
    }

    // Trigger all relevant attribute changes.
    if (!silent) {
      if (changes.length > 0)
        this._pending = true
      for (let i = 0; i < changes.length; i++)
        this.properties[changes[i]].change.emit()
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

  setv(attrs: {[key: string]: any}, options: HasProps.SetOptions = {}): void {
    for (const key in attrs) {
      if (!attrs.hasOwnProperty(key))
        continue

      const prop_name = key
      if (this.props[prop_name] == null)
        throw new Error(`property ${this.type}.${prop_name} wasn't declared`)

      if (!(options != null && options.defaults))
        this._set_after_defaults[key] = true
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

  getv(prop_name: string): any {
    if (this.props[prop_name] == null)
      throw new Error(`property ${this.type}.${prop_name} wasn't declared`)
    else
      return this.attributes[prop_name]
  }

  ref(): Ref {
    return create_ref(this)
  }

  // we only keep the subtype so we match Python;
  // only Python cares about this
  set_subtype(subtype: string): void {
    this._subtype = subtype
  }

  attribute_is_serializable(attr: string): boolean {
    const prop = this.props[attr]
    if (prop == null)
      throw new Error(`${this.type}.attribute_is_serializable('${attr}'): ${attr} wasn't declared`)
    else
      return !prop.internal
  }

  // dict of attributes that should be serialized to the server. We
  // sometimes stick things in attributes that aren't part of the
  // Document's models, subtypes that do that have to remove their
  // extra attributes here.
  serializable_attributes(): {[key: string]: any} {
    const attrs: {[key: string]: any} = {}
    for (const name in this.attributes) {
      const value = this.attributes[name]
      if (this.attribute_is_serializable(name))
        attrs[name] = value
    }
    return attrs
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
      const ref_obj: {[key: string]: unknown} = {}
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
    const serializable = this.serializable_attributes()
    const attrs: {[key: string]: any} = {}
    for (const key in serializable) {
      if (serializable.hasOwnProperty(key)) {
        const value = serializable[key]
        if (include_defaults)
          attrs[key] = value
        else if (key in this._set_after_defaults)
          attrs[key] = value
      }
    }
    return value_to_json("attributes", attrs, this)
  }

  // this is like _value_record_references but expects to find refs
  // instead of models, and takes a doc to look up the refs in
  static _json_record_references(doc: Document, v: any, result: {[key: string]: HasProps}, recurse: boolean): void {
    if (v == null) {
    } else if (is_ref(v)) {
      if (!(v.id in result)) {
        const model = doc.get_model_by_id(v.id)
        HasProps._value_record_references(model, result, recurse)
      }
    } else if (isArray(v)) {
      for (const elem of v)
        HasProps._json_record_references(doc, elem, result, recurse)
    } else if (isPlainObject(v)) {
      for (const k in v) {
        if (v.hasOwnProperty(k)) {
          const elem = v[k]
          HasProps._json_record_references(doc, elem, result, recurse)
        }
      }
    }
  }

  // add all references from 'v' to 'result', if recurse
  // is true then descend into refs, if false only
  // descend into non-refs
  static _value_record_references(v: any, result: {[key: string]: HasProps}, recurse: boolean): void {
    if (v == null) {
    } else if (v instanceof HasProps) {
      if (!(v.id in result)) {
        result[v.id] = v
        if (recurse) {
          const immediate = v._immediate_references()
          for (const obj of immediate)
            HasProps._value_record_references(obj, result, true) // true=recurse
        }
      }
    } else if (v.buffer instanceof ArrayBuffer) {
    } else if (isArray(v)) {
      for (const elem of v)
        HasProps._value_record_references(elem, result, recurse)
    } else if (isPlainObject(v)) {
      for (const k in v) {
        if (v.hasOwnProperty(k)) {
          const elem = v[k]
          HasProps._value_record_references(elem, result, recurse)
        }
      }
    }
  }

  // Get models that are immediately referenced by our properties
  // (do not recurse, do not include ourselves)
  protected _immediate_references(): HasProps[] {
    const result = {}
    const attrs = this.serializable_attributes()
    for (const key in attrs) {
      const value = attrs[key]
      HasProps._value_record_references(value, result, false) // false = no recurse
    }

    return values(result)
  }

  references(): HasProps[] {
    const references = {}
    HasProps._value_record_references(this, references, true)
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
    if (!this.attribute_is_serializable(attr))
      return

    if (this.document != null) {
      const new_refs: {[key: string]: HasProps} = {}
      HasProps._value_record_references(new_, new_refs, false)

      const old_refs: {[key: string]: HasProps} = {}
      HasProps._value_record_references(old, old_refs, false)

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

  materialize_dataspecs(source: ColumnarDataSource): {[key: string]: any} {
    // Note: this should be moved to a function separate from HasProps
    const data: {[key: string]: any} = {}
    for (const name in this.properties) {
      const prop = this.properties[name]
      if (!prop.dataspec)
        continue
      // this skips optional properties like radius for circles
      if (prop.optional && prop.spec.value == null && !(name in this._set_after_defaults))
        continue

      data[`_${name}`] = prop.array(source)
      // the shapes are indexed by the column name, but when we materialize the dataspec, we should
      // store under the canonical field name, e.g. _image_shape, even if the column name is "foo"
      if (prop.spec.field != null && prop.spec.field in source._shapes)
        data[`_${name}_shape`] = source._shapes[prop.spec.field]
      if (prop instanceof p.DistanceSpec)
        data[`max_${name}`] = max(data[`_${name}`])
    }
    return data
  }
}
HasProps.initClass()

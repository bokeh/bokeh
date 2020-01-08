import {Models} from "../base"
import {version as js_version} from "../version"
import {logger} from "../core/logging"
import {BokehEvent, LODStart, LODEnd} from "core/bokeh_events"
import {HasProps} from "core/has_props"
import {Attrs} from "core/types"
import {Signal0} from "core/signaling"
import {Struct, is_ref} from "core/util/refs"
import {decode_column_data} from "core/util/serialization"
import {MultiDict, Set as OurSet} from "core/util/data_structures"
import {difference, intersection, copy, includes} from "core/util/array"
import {values} from "core/util/object"
import {isEqual} from "core/util/eq"
import {isArray, isPlainObject} from "core/util/types"
import {LayoutDOM} from "models/layouts/layout_dom"
import {ColumnDataSource} from "models/sources/column_data_source"
import {ClientSession} from "client/session"
import {Model} from "model"
import {
  DocumentChanged, DocumentChangedEvent,
  ModelChanged, ModelChangedEvent,
  RootAddedEvent, RootRemovedEvent,
  TitleChangedEvent,
  MessageSentEvent,
} from "./events"

export class EventManager {
  // Dispatches events to the subscribed models

  session: ClientSession | null = null
  subscribed_models: Set<string> = new Set()

  constructor(readonly document: Document) {}

  send_event(bokeh_event: BokehEvent): void {
    const event = new MessageSentEvent(this.document, "bokeh_event", bokeh_event.to_json())
    this.document._trigger_on_change(event)
  }

  trigger(event: BokehEvent): void {
    for (const id of this.subscribed_models) {
      if (event.origin != null && event.origin.id !== id)
        continue
      const model = this.document._all_models[id]
      if (model != null && model instanceof Model)
        model._process_event(event)
    }
  }
}

export interface DocJson {
  version?: string
  title?: string
  roots: {
    root_ids: string[]
    references: Struct[]
  }
}

export interface Patch {
  references: Struct[]
  events: DocumentChanged[]
}

export type References = {[key: string]: HasProps}

export const documents: Document[] = []

export const DEFAULT_TITLE = "Bokeh Application"

// This class should match the API of the Python Document class
// as much as possible.
export class Document {

  readonly event_manager: EventManager
  readonly idle: Signal0<this>

  protected readonly _init_timestamp: number
  protected _title: string
  protected _roots: Model[]
  /*protected*/ _all_models: {[key: string]: HasProps}
  protected _all_models_by_name: MultiDict<HasProps>
  protected _all_models_freeze_count: number
  protected _callbacks: ((event: DocumentChangedEvent) => void)[]
  protected _message_callbacks: Map<string, Set<(data: unknown) => void>>
  private _idle_roots: WeakMap<Model, boolean>
  protected _interactive_timestamp: number | null
  protected _interactive_plot: Model | null

  constructor() {
    documents.push(this)
    this._init_timestamp = Date.now()
    this._title = DEFAULT_TITLE
    this._roots = []
    this._all_models = {}
    this._all_models_by_name = new MultiDict()
    this._all_models_freeze_count = 0
    this._callbacks = []
    this._message_callbacks = new Map()
    this.event_manager = new EventManager(this)
    this.idle = new Signal0(this, "idle")
    this._idle_roots = new WeakMap() // TODO: WeakSet would be better
    this._interactive_timestamp = null
    this._interactive_plot = null
  }

  get layoutables(): LayoutDOM[] {
    return this._roots.filter((root): root is LayoutDOM => root instanceof LayoutDOM)
  }

  get is_idle(): boolean {
    for (const root of this.layoutables) {
      if (!this._idle_roots.has(root))
        return false
    }
    return true
  }

  notify_idle(model: Model): void {
    this._idle_roots.set(model, true)
    if (this.is_idle) {
      logger.info(`document idle at ${Date.now() - this._init_timestamp} ms`)
      this.idle.emit()
    }
  }

  clear(): void {
    this._push_all_models_freeze()
    try {
      while (this._roots.length > 0) {
        this.remove_root(this._roots[0])
      }
    } finally {
      this._pop_all_models_freeze()
    }
  }

  interactive_start(plot: Model): void {
    if (this._interactive_plot == null) {
      this._interactive_plot = plot
      this._interactive_plot.trigger_event(new LODStart())
    }
    this._interactive_timestamp = Date.now()
  }

  interactive_stop(plot: Model): void {
    if (this._interactive_plot != null && this._interactive_plot.id === plot.id) {
      this._interactive_plot.trigger_event(new LODEnd())
    }
    this._interactive_plot = null
    this._interactive_timestamp = null
  }

  interactive_duration(): number {
    if (this._interactive_timestamp == null)
      return -1
    else
      return Date.now() - this._interactive_timestamp
  }

  destructively_move(dest_doc: Document): void {
    if (dest_doc === this) {
      throw new Error("Attempted to overwrite a document with itself")
    }
    dest_doc.clear()
    // we have to remove ALL roots before adding any
    // to the new doc or else models referenced from multiple
    // roots could be in both docs at once, which isn't allowed.
    const roots = copy(this._roots)
    this.clear()

    for (const root of roots) {
      if (root.document != null)
        throw new Error(`Somehow we didn't detach ${root}`)
    }

    if (Object.keys(this._all_models).length !== 0) {
      throw new Error(`this._all_models still had stuff in it: ${this._all_models}`)
    }

    for (const root of roots) {
      dest_doc.add_root(root)
    }

    dest_doc.set_title(this._title)
  }

  // TODO other fields of doc
  protected _push_all_models_freeze(): void {
    this._all_models_freeze_count += 1
  }

  protected _pop_all_models_freeze(): void {
    this._all_models_freeze_count -= 1
    if (this._all_models_freeze_count === 0) {
      this._recompute_all_models()
    }
  }

  /*protected*/ _invalidate_all_models(): void {
    logger.debug("invalidating document models")
    // if freeze count is > 0, we'll recompute on unfreeze
    if (this._all_models_freeze_count === 0) {
      this._recompute_all_models()
    }
  }

  protected _recompute_all_models(): void {
    let new_all_models_set = new OurSet<HasProps>()
    for (const r of this._roots) {
      new_all_models_set = new_all_models_set.union(r.references())
    }
    const old_all_models_set = new OurSet(values(this._all_models))
    const to_detach = old_all_models_set.diff(new_all_models_set)
    const to_attach = new_all_models_set.diff(old_all_models_set)
    const recomputed: {[key: string]: HasProps} = {}
    for (const m of new_all_models_set.values) {
      recomputed[m.id] = m
    }
    for (const d of to_detach.values) {
      d.detach_document()
      if (d instanceof Model && d.name != null)
        this._all_models_by_name.remove_value(d.name, d)
    }
    for (const a of to_attach.values) {
      a.attach_document(this)
      if (a instanceof Model && a.name != null)
        this._all_models_by_name.add_value(a.name, a)
    }
    this._all_models = recomputed
  }

  roots(): Model[] {
    return this._roots
  }

  add_root(model: Model, setter_id?: string): void {
    logger.debug(`Adding root: ${model}`)
    if (includes(this._roots, model))
      return

    this._push_all_models_freeze()
    try {
      this._roots.push(model)
    } finally {
      this._pop_all_models_freeze()
    }
    this._trigger_on_change(new RootAddedEvent(this, model, setter_id))
  }

  remove_root(model: Model, setter_id?: string): void {
    const i = this._roots.indexOf(model)
    if (i < 0)
      return

    this._push_all_models_freeze()
    try {
      this._roots.splice(i, 1)
    } finally {
      this._pop_all_models_freeze()
    }
    this._trigger_on_change(new RootRemovedEvent(this, model, setter_id))
  }

  title(): string {
    return this._title
  }

  set_title(title: string, setter_id?: string): void {
    if (title !== this._title) {
      this._title = title
      this._trigger_on_change(new TitleChangedEvent(this, title, setter_id))
    }
  }

  get_model_by_id(model_id: string): HasProps | null {
    if (model_id in this._all_models) {
      return this._all_models[model_id]
    } else {
      return null
    }
  }

  get_model_by_name(name: string): HasProps | null {
    return this._all_models_by_name.get_one(name, `Multiple models are named '${name}'`)
  }

  on_message(msg_type: string, callback: (msg_data: unknown) => void): void {
    const message_callbacks = this._message_callbacks.get(msg_type)
    if (message_callbacks == null)
      this._message_callbacks.set(msg_type, new Set([callback]))
    else
      message_callbacks.add(callback)
  }

  remove_on_message(msg_type: string, callback: (msg_data: unknown) => void): void {
    this._message_callbacks.get(msg_type)?.delete(callback)
  }

  protected _trigger_on_message(msg_type: string, msg_data: unknown): void {
    const message_callbacks = this._message_callbacks.get(msg_type)
    if (message_callbacks != null) {
      for (const cb of message_callbacks) {
        cb(msg_data)
      }
    }
  }

  on_change(callback: (event: DocumentChangedEvent) => void): void {
    if (!includes(this._callbacks, callback))
      this._callbacks.push(callback)
  }

  remove_on_change(callback: (event: DocumentChangedEvent) => void): void {
    const i = this._callbacks.indexOf(callback)
    if (i >= 0)
      this._callbacks.splice(i, 1)
  }

  _trigger_on_change(event: DocumentChangedEvent): void {
    for (const cb of this._callbacks) {
      cb(event)
    }
  }

  // called by the model
  _notify_change(model: HasProps, attr: string, old: any, new_: any, options?: {setter_id?: string, hint?: any}): void {
    if (attr === 'name') {
      this._all_models_by_name.remove_value(old, model)
      if (new_ != null)
        this._all_models_by_name.add_value(new_, model)
    }
    const setter_id = options != null ? options.setter_id : void 0
    const hint = options != null ? options.hint : void 0
    this._trigger_on_change(new ModelChangedEvent(this, model, attr, old, new_, setter_id, hint))
  }

  static _references_json(references: HasProps[], include_defaults: boolean = true): Struct[] {
    const references_json: Struct[] = []
    for (const r of references) {
      const struct = r.struct()
      struct.attributes = r.attributes_as_json(include_defaults)
      // server doesn't want id in here since it's already in ref above
      delete struct.attributes.id
      references_json.push(struct)
    }
    return references_json
  }

  static _instantiate_object(obj_id: string, obj_type: string, obj_attrs: Attrs): HasProps {
    const full_attrs = {...obj_attrs, id: obj_id, __deferred__: true}
    const model = Models(obj_type)
    return new (model as any)(full_attrs)
  }

  // given a JSON representation of all models in a graph, return a
  // dict of new model objects
  static _instantiate_references_json(references_json: Struct[], existing_models: {[key: string]: HasProps}): References {
    // Create all instances, but without setting their props
    const references: References = {}
    for (const obj of references_json) {
      const obj_id = obj.id
      const obj_type = obj.type
      const obj_attrs = obj.attributes || {}

      let instance: HasProps
      if (obj_id in existing_models)
        instance = existing_models[obj_id]
      else {
        instance = Document._instantiate_object(obj_id, obj_type, obj_attrs)
        if (obj.subtype != null)
          instance.set_subtype(obj.subtype)
      }
      references[instance.id] = instance
    }
    return references
  }

  // if v looks like a ref, or a collection, resolve it, otherwise return it unchanged
  // recurse into collections but not into HasProps
  static _resolve_refs(value: any, old_references: References, new_references: References): any {
    function resolve_ref(v: any): any {
      if (is_ref(v)) {
        if (v.id in old_references)
          return old_references[v.id]
        else if (v.id in new_references)
          return new_references[v.id]
        else
          throw new Error(`reference ${JSON.stringify(v)} isn't known (not in Document?)`)
      } else if (isArray(v))
        return resolve_array(v)
      else if (isPlainObject(v))
        return resolve_dict(v)
      else
        return v
    }

    function resolve_array(array: unknown[]) {
      const results: unknown[] = []
      for (const v of array) {
        results.push(resolve_ref(v))
      }
      return results
    }

    function resolve_dict(dict: {[key: string]: unknown}) {
      const resolved: {[key: string]: unknown} = {}
      for (const k in dict) {
        const v = dict[k]
        resolved[k] = resolve_ref(v)
      }
      return resolved
    }

    return resolve_ref(value)
  }

  // given a JSON representation of all models in a graph and new
  // model instances, set the properties on the models from the
  // JSON
  static _initialize_references_json(references_json: Struct[], old_references: References, new_references: References): void {
    const to_update: {[key: string]: [HasProps, Attrs, boolean]} = {}
    for (const obj of references_json) {
      const obj_id = obj.id
      const obj_attrs = obj.attributes

      const was_new = !(obj_id in old_references)
      const instance = !was_new ? old_references[obj_id] : new_references[obj_id]

      // replace references with actual instances in obj_attrs
      const resolved_attrs = Document._resolve_refs(obj_attrs, old_references, new_references)
      to_update[instance.id] = [instance, resolved_attrs, was_new]
    }
    // this is so that, barring cycles, when an instance gets its
    // refs resolved, the values for those refs also have their
    // refs resolved.
    type Fn = (instance: HasProps, attrs: Attrs, was_new: boolean) => void
    function foreach_depth_first(items: typeof to_update, f: Fn): void {
      const already_started: {[key: string]: boolean} = {}
      function foreach_value(v: unknown) {
        if (v instanceof HasProps) {
          // note that we ignore instances that aren't updated (not in to_update)
          if (!(v.id in already_started) && v.id in items) {
            already_started[v.id] = true
            const [, attrs, was_new] = items[v.id]
            for (const a in attrs) {
              const e = attrs[a]
              foreach_value(e)
            }
            f(v, attrs, was_new)
          }
        } else if (isArray(v)) {
          for (const e of v)
            foreach_value(e)
        } else if (isPlainObject(v)) {
          for (const k in v) {
            const e = v[k]
            foreach_value(e)
          }
        }
      }
      for (const k in items) {
        const [instance,, ] = items[k]
        foreach_value(instance)
      }
    }

    // this first pass removes all 'refs' replacing them with real instances
    foreach_depth_first(to_update, function(instance, attrs, was_new) {
      if (was_new)
        instance.setv(attrs, {silent: true})
    })

    // after removing all the refs, we can run the initialize code safely
    foreach_depth_first(to_update, function(instance, _attrs, was_new) {
      if (was_new)
        instance.finalize()
    })
  }

  static _event_for_attribute_change(changed_obj: Struct, key: string, new_value: any, doc: Document, value_refs: {[key: string]: HasProps}): ModelChanged | null {
    const changed_model = doc.get_model_by_id(changed_obj.id)! // XXX!
    if (!changed_model.attribute_is_serializable(key))
      return null
    else {
      const event: ModelChanged = {
        kind: "ModelChanged",
        model: {id: changed_obj.id},
        attr: key,
        new: new_value,
      }
      HasProps._json_record_references(doc, new_value, value_refs, true) // true = recurse
      return event
    }
  }

  static _events_to_sync_objects(from_obj: Struct, to_obj: Struct, to_doc: Document, value_refs: {[key: string]: HasProps}): ModelChanged[] {
    const from_keys = Object.keys(from_obj.attributes!) //XXX!
    const to_keys = Object.keys(to_obj.attributes!) //XXX!
    const removed = difference(from_keys, to_keys)
    const added = difference(to_keys, from_keys)
    const shared = intersection(from_keys, to_keys)
    const events: (ModelChanged | null)[] = []

    for (const key of removed) {
      // we don't really have a "remove" event - not sure this ever
      // happens even. One way this could happen is if the server
      // does include_defaults=True and we do
      // include_defaults=false ... in that case it'd be best to
      // just ignore this probably. Warn about it, could mean
      // there's a bug if we don't have a key that the server sent.
      logger.warn(`Server sent key ${key} but we don't seem to have it in our JSON`)
    }

    for (const key of added) {
      const new_value = to_obj.attributes![key] // XXX!
      events.push(Document._event_for_attribute_change(from_obj, key, new_value, to_doc, value_refs))
    }

    for (const key of shared) {
      const old_value = from_obj.attributes![key] // XXX!
      const new_value = to_obj.attributes![key] // XXX!
      if (old_value == null && new_value == null) {
      } else if (old_value == null || new_value == null) {
        events.push(Document._event_for_attribute_change(from_obj, key, new_value, to_doc, value_refs))
      } else {
        if (!isEqual(old_value, new_value))
          events.push(Document._event_for_attribute_change(from_obj, key, new_value, to_doc, value_refs))
      }
    }

    return events.filter((e): e is ModelChanged => e != null)
  }

  // we use this to detect changes during document deserialization
  // (in model constructors and initializers)
  static _compute_patch_since_json(from_json: DocJson, to_doc: Document): Patch {
    const to_json = to_doc.to_json(false) // include_defaults=false

    function refs(json: DocJson): {[key: string]: Struct} {
      const result: {[key: string]: Struct} = {}
      for (const obj of json.roots.references)
        result[obj.id] = obj
      return result
    }

    const from_references = refs(from_json)
    const from_roots: {[key: string]: Struct} = {}
    const from_root_ids: string[] = []
    for (const r of from_json.roots.root_ids) {
      from_roots[r] = from_references[r]
      from_root_ids.push(r)
    }

    const to_references = refs(to_json)
    const to_roots: {[key: string]: Struct} = {}
    const to_root_ids: string[] = []
    for (const r of to_json.roots.root_ids) {
      to_roots[r] = to_references[r]
      to_root_ids.push(r)
    }

    from_root_ids.sort()
    to_root_ids.sort()

    if (difference(from_root_ids, to_root_ids).length > 0 ||
        difference(to_root_ids, from_root_ids).length > 0) {
      // this would arise if someone does add_root/remove_root during
      // document deserialization, hopefully they won't ever do so.
      throw new Error("Not implemented: computing add/remove of document roots")
    }

    const value_refs: {[key: string]: HasProps} = {}
    let events: DocumentChanged[] = []

    for (const id in to_doc._all_models) {
      if (id in from_references) {
        const update_model_events = Document._events_to_sync_objects(from_references[id], to_references[id], to_doc, value_refs)
        events = events.concat(update_model_events)
      }
    }
    return {
      references: Document._references_json(values(value_refs), false), // include_defaults=false
      events,
    }
  }

  to_json_string(include_defaults: boolean = true): string {
    return JSON.stringify(this.to_json(include_defaults))
  }

  to_json(include_defaults: boolean = true): DocJson {
    const root_ids = this._roots.map((r) => r.id)
    const root_references = values(this._all_models)
    return {
      version: js_version,
      title: this._title,
      roots: {
        root_ids,
        references: Document._references_json(root_references, include_defaults),
      },
    }
  }

  static from_json_string(s: string): Document {
    const json: any = JSON.parse(s)
    return Document.from_json(json)
  }

  static from_json(json: DocJson): Document {
    logger.debug("Creating Document from JSON")

    const py_version = json.version! // XXX!
    const is_dev = py_version.indexOf('+') !== -1 || py_version.indexOf('-') !== -1
    const versions_string = `Library versions: JS (${js_version}) / Python (${py_version})`
    if (!is_dev && js_version !== py_version) {
      logger.warn("JS/Python version mismatch")
      logger.warn(versions_string)
    } else
      logger.debug(versions_string)

    const roots_json = json.roots
    const root_ids = roots_json.root_ids
    const references_json = roots_json.references

    const references = Document._instantiate_references_json(references_json, {})
    Document._initialize_references_json(references_json, {}, references)

    const doc = new Document()
    for (const r of root_ids)
      doc.add_root(references[r] as Model) // XXX: HasProps
    doc.set_title(json.title!) // XXX!
    return doc
  }

  replace_with_json(json: DocJson): void {
    const replacement = Document.from_json(json)
    replacement.destructively_move(this)
  }

  create_json_patch_string(events: DocumentChangedEvent[]): string {
    return JSON.stringify(this.create_json_patch(events))
  }

  create_json_patch(events: DocumentChangedEvent[]): Patch {
    const references: References = {}
    const json_events: DocumentChanged[] = []
    for (const event of events) {
      if (event.document !== this) {
        logger.warn("Cannot create a patch using events from a different document, event had ", event.document, " we are ", this)
        throw new Error("Cannot create a patch using events from a different document")
      }
      json_events.push(event.json(references))
    }
    return {
      events: json_events,
      references: Document._references_json(values(references)),
    }
  }

  apply_json_patch(patch: Patch, buffers: [any, any][] = [], setter_id?: string): void {
    const references_json = patch.references
    const events_json = patch.events
    const references = Document._instantiate_references_json(references_json, this._all_models)

    // The model being changed isn't always in references so add it in
    for (const event_json of events_json) {
      switch (event_json.kind) {
        case "RootAdded":
        case "RootRemoved":
        case "ModelChanged": {
          const model_id = event_json.model.id
          if (model_id in this._all_models) {
            references[model_id] = this._all_models[model_id]
          } else {
            if (!(model_id in references)) {
              logger.warn("Got an event for unknown model ", event_json.model)
              throw new Error("event model wasn't known")
            }
          }
          break
        }
      }
    }

    // split references into old and new so we know whether to initialize or update
    const old_references: {[key: string]: HasProps} = {}
    const new_references: {[key: string]: HasProps} = {}
    for (const id in references) {
      const value = references[id]
      if (id in this._all_models)
        old_references[id] = value
      else
        new_references[id] = value
    }

    Document._initialize_references_json(references_json, old_references, new_references)

    for (const event_json of events_json) {
      switch (event_json.kind) {
        case 'MessageSent': {
          const msg_data = Document._resolve_refs(event_json.msg_data, old_references, new_references)
          this._trigger_on_message(event_json.msg_type, msg_data)
          break
        }
        case 'ModelChanged': {
          const patched_id = event_json.model.id
          if (!(patched_id in this._all_models)) {
            throw new Error(`Cannot apply patch to ${patched_id} which is not in the document`)
          }
          const patched_obj = this._all_models[patched_id]
          const attr = event_json.attr
          // XXXX currently still need this first branch, some updates (initial?) go through here
          if (attr === 'data' && patched_obj.type === 'ColumnDataSource') {
            const [data, shapes] = decode_column_data(event_json.new, buffers)
            patched_obj.setv({_shapes: shapes, data}, {setter_id})
          } else {
            const value = Document._resolve_refs(event_json.new, old_references, new_references)
            patched_obj.setv({[attr]: value}, {setter_id})
          }
          break
        }
        case 'ColumnDataChanged': {
          const column_source_id = event_json.column_source.id
          if (!(column_source_id in this._all_models)) {
            throw new Error(`Cannot stream to ${column_source_id} which is not in the document`)
          }
          const column_source = this._all_models[column_source_id] as ColumnDataSource
          const [data, shapes] = decode_column_data(event_json.new, buffers)
          if (event_json.cols != null) {
            for (const k in column_source.data) {
              if (!(k in data)) {
                data[k] = column_source.data[k]
              }
            }
            for (const k in column_source._shapes) {
              if (!(k in shapes)) {
                shapes[k] = column_source._shapes[k]
              }
            }
          }
          column_source.setv({
            _shapes: shapes,
            data,
          }, {
            setter_id,
            check_eq: false,
          })
          break
        }
        case 'ColumnsStreamed': {
          const column_source_id = event_json.column_source.id
          if (!(column_source_id in this._all_models)) {
            throw new Error(`Cannot stream to ${column_source_id} which is not in the document`)
          }
          const column_source = this._all_models[column_source_id]
          if (!(column_source instanceof ColumnDataSource)) {
            throw new Error("Cannot stream to non-ColumnDataSource")
          }
          const data = event_json.data
          const rollover = event_json.rollover
          column_source.stream(data, rollover, setter_id)
          break
        }
        case 'ColumnsPatched': {
          const column_source_id = event_json.column_source.id
          if (!(column_source_id in this._all_models)) {
            throw new Error(`Cannot patch ${column_source_id} which is not in the document`)
          }
          const column_source = this._all_models[column_source_id]
          if (!(column_source instanceof ColumnDataSource)) {
            throw new Error("Cannot patch non-ColumnDataSource")
          }
          const patches = event_json.patches
          column_source.patch(patches, setter_id)
          break
        }
        case 'RootAdded': {
          const root_id = event_json.model.id
          const root_obj = references[root_id]
          this.add_root(root_obj as Model, setter_id) // XXX: HasProps
          break
        }
        case 'RootRemoved': {
          const root_id = event_json.model.id
          const root_obj = references[root_id]
          this.remove_root(root_obj as Model, setter_id) // XXX: HasProps
          break
        }
        case 'TitleChanged': {
          this.set_title(event_json.title, setter_id)
          break
        }
        default:
          throw new Error("Unknown patch event " + JSON.stringify(event_json))
      }
    }
  }
}

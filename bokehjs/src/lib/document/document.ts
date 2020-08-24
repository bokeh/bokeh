import {Models} from "../base"
import {version as js_version} from "../version"
import {logger} from "../core/logging"
import {BokehEvent, DocumentReady, ModelEvent, LODStart, LODEnd} from "core/bokeh_events"
import {HasProps} from "core/has_props"
import {ID, Attrs, Data, PlainObject} from "core/types"
import {Signal0} from "core/signaling"
import {Struct, is_ref} from "core/util/refs"
import {Buffers, is_NDArray_ref, decode_NDArray} from "core/util/serialization"
import {difference, intersection, copy, includes} from "core/util/array"
import {values, entries} from "core/util/object"
import * as sets from "core/util/set"
import {isEqual} from "core/util/eq"
import {isArray, isPlainObject} from "core/util/types"
import {LayoutDOM} from "models/layouts/layout_dom"
import {ColumnDataSource} from "models/sources/column_data_source"
import {ClientSession} from "client/session"
import {Model} from "model"
import {
  DocumentEvent, DocumentEventBatch, DocumentChangedEvent, ModelChangedEvent,
  RootRemovedEvent, TitleChangedEvent, MessageSentEvent,
  DocumentChanged, ModelChanged, RootAddedEvent,
} from "./events"

// Dispatches events to the subscribed models
export class EventManager {
  session: ClientSession | null = null
  subscribed_models: Set<Model> = new Set()

  constructor(readonly document: Document) {}

  send_event(bokeh_event: BokehEvent): void {
    const event = new MessageSentEvent(this.document, "bokeh_event", bokeh_event.to_json())
    this.document._trigger_on_change(event)
  }

  trigger(event: ModelEvent): void {
    for (const model of this.subscribed_models) {
      if (event.origin != null && event.origin != model)
        continue
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

export type RefMap = Map<ID, HasProps>

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
  /*protected*/ _all_models: Map<ID, HasProps>
  protected _all_models_freeze_count: number
  protected _callbacks: Map<(event: DocumentEvent) => void, boolean>
  protected _message_callbacks: Map<string, Set<(data: unknown) => void>>
  private _idle_roots: WeakMap<Model, boolean>
  protected _interactive_timestamp: number | null
  protected _interactive_plot: Model | null

  constructor() {
    documents.push(this)
    this._init_timestamp = Date.now()
    this._title = DEFAULT_TITLE
    this._roots = []
    this._all_models = new Map()
    this._all_models_freeze_count = 0
    this._callbacks = new Map()
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
      this.event_manager.send_event(new DocumentReady())
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

  interactive_stop(): void {
    if (this._interactive_plot != null) {
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

    if (this._all_models.size != 0) {
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
    let new_all_models_set = new Set<HasProps>()
    for (const r of this._roots) {
      new_all_models_set = sets.union(new_all_models_set, r.references())
    }
    const old_all_models_set = new Set(this._all_models.values())
    const to_detach = sets.difference(old_all_models_set, new_all_models_set)
    const to_attach = sets.difference(new_all_models_set, old_all_models_set)
    const recomputed: RefMap = new Map()
    for (const model of new_all_models_set) {
      recomputed.set(model.id, model)
    }
    for (const d of to_detach) {
      d.detach_document()
    }
    for (const a of to_attach) {
      a.attach_document(this)
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
    return this._all_models.get(model_id) ?? null
  }

  get_model_by_name(name: string): HasProps | null {
    const found = []
    for (const model of this._all_models.values()) {
      if (model instanceof Model && model.name == name)
        found.push(model)
    }

    switch (found.length) {
      case 0:
        return null
      case 1:
        return found[0]
      default:
        throw new Error(`Multiple models are named '${name}'`)
    }
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

  on_change(callback: (event: DocumentEvent) => void, allow_batches: true): void
  on_change(callback: (event: DocumentChangedEvent) => void, allow_batches?: false): void

  on_change(callback: ((event: DocumentEvent) => void) | ((event: DocumentChangedEvent) => void), allow_batches: boolean = false): void {
    if (!this._callbacks.has(callback)) {
      this._callbacks.set(callback, allow_batches)
    }
  }

  remove_on_change(callback: (event: DocumentEvent) => void): void {
    this._callbacks.delete(callback)
  }

  _trigger_on_change(event: DocumentEvent): void {
    for (const [callback, allow_batches] of this._callbacks) {
      if (!allow_batches && event instanceof DocumentEventBatch) {
        for (const ev of event.events) {
          callback(ev)
        }
      } else {
        callback(event)
      }
    }
  }

  _notify_change(model: HasProps, attr: string, old_value: unknown, new_value: unknown, options?: {setter_id?: string, hint?: unknown}): void {
    this._trigger_on_change(new ModelChangedEvent(this, model, attr, old_value, new_value, options?.setter_id, options?.hint))
  }

  static _references_json(references: Iterable<HasProps>, include_defaults: boolean = true): Struct[] {
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
  static _instantiate_references_json(references_json: Struct[], existing_models: RefMap): RefMap {
    // Create all instances, but without setting their props
    const references = new Map()
    for (const obj of references_json) {
      const obj_id = obj.id
      const obj_type = obj.type
      const obj_attrs = obj.attributes || {}

      let instance = existing_models.get(obj_id)
      if (instance == null) {
        instance = Document._instantiate_object(obj_id, obj_type, obj_attrs)
        if (obj.subtype != null)
          instance.set_subtype(obj.subtype)
      }
      references.set(instance.id, instance)
    }
    return references
  }

  // if v looks like a ref, or a collection, resolve it, otherwise return it unchanged
  // recurse into collections but not into HasProps
  static _resolve_refs(value: unknown, old_references: RefMap, new_references: RefMap, buffers: Buffers): unknown {
    function resolve_ref(v: unknown): unknown {
      if (is_ref(v)) {
        if (old_references.has(v.id))
          return old_references.get(v.id)
        else if (new_references.has(v.id))
          return new_references.get(v.id)
        else
          throw new Error(`reference ${JSON.stringify(v)} isn't known (not in Document?)`)
      } else if (is_NDArray_ref(v)) {
        return decode_NDArray(v, buffers)
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

    function resolve_dict(dict: PlainObject) {
      const resolved: PlainObject = {}
      for (const [k, v] of entries(dict)) {
        resolved[k] = resolve_ref(v)
      }
      return resolved
    }

    return resolve_ref(value)
  }

  // given a JSON representation of all models in a graph and new
  // model instances, set the properties on the models from the
  // JSON
  static _initialize_references_json(references_json: Struct[], old_references: RefMap, new_references: RefMap, buffers: Buffers): void {
    const to_update = new Map<ID, {instance: HasProps, is_new: boolean}>()

    for (const {id, attributes} of references_json) {
      const is_new = !old_references.has(id)
      const instance = is_new ? new_references.get(id)! : old_references.get(id)!

      // replace references with actual instances in obj_attrs
      const resolved_attrs = Document._resolve_refs(attributes, old_references, new_references, buffers) as Attrs
      instance.setv(resolved_attrs, {silent: true})
      to_update.set(id, {instance, is_new})
    }

    const ordered_instances: HasProps[] = []
    const handled = new Set<ID>()

    function finalize_all_by_dfs(v: unknown): void {
      if (v instanceof HasProps) {
        // note that we ignore instances that aren't updated (not in to_update)
        if (to_update.has(v.id) && !handled.has(v.id)) {
          handled.add(v.id)

          const {instance, is_new} = to_update.get(v.id)!
          const {attributes} = instance

          for (const value of values(attributes)) {
            finalize_all_by_dfs(value)
          }

          if (is_new) {
            // Finalizing here just to avoid iterating
            // over `ordered_instances` twice.
            instance.finalize()
            // Preserving an ordered collection of instances
            // to avoid having to go through DFS again.
            ordered_instances.push(instance)
          }
        }
      } else if (isArray(v)) {
        for (const e of v)
          finalize_all_by_dfs(e)
      } else if (isPlainObject(v)) {
        for (const value of values(v))
          finalize_all_by_dfs(value)
      }
    }

    for (const item of to_update.values()) {
      finalize_all_by_dfs(item.instance)
    }

    // `connect_signals` has to be executed last because it
    // may rely on properties of dependencies that are initialized
    // only in `finalize`. It's a problem that appears when
    // there are circular references, e.g. as in
    // CDS -> CustomJS (on data change) -> GlyphRenderer (in args) -> CDS.
    for (const instance of ordered_instances) {
      instance.connect_signals()
    }
  }

  static _event_for_attribute_change(changed_obj: Struct, key: string, new_value: any, doc: Document, value_refs: Set<HasProps>): ModelChanged | null {
    const changed_model = doc.get_model_by_id(changed_obj.id)! // XXX!
    if (!changed_model.property(key).syncable)
      return null
    else {
      const event: ModelChanged = {
        kind: "ModelChanged",
        model: {id: changed_obj.id},
        attr: key,
        new: new_value,
      }
      HasProps._json_record_references(doc, new_value, value_refs, {recursive: true})
      return event
    }
  }

  static _events_to_sync_objects(from_obj: Struct, to_obj: Struct, to_doc: Document, value_refs: Set<HasProps>): ModelChanged[] {
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

    function refs(json: DocJson): Map<ID, Struct> {
      const result = new Map<ID, Struct>()
      for (const obj of json.roots.references)
        result.set(obj.id, obj)
      return result
    }

    const from_references = refs(from_json)
    const from_roots: Map<ID, Struct> = new Map()
    const from_root_ids: ID[] = []
    for (const r of from_json.roots.root_ids) {
      from_roots.set(r, from_references.get(r)!)
      from_root_ids.push(r)
    }

    const to_references = refs(to_json)
    const to_roots: Map<ID, Struct> = new Map()
    const to_root_ids: ID[] = []
    for (const r of to_json.roots.root_ids) {
      to_roots.set(r, to_references.get(r)!)
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

    const value_refs = new Set<HasProps>()
    let events: DocumentChanged[] = []

    for (const id of to_doc._all_models.keys()) {
      if (from_references.has(id)) {
        const update_model_events = Document._events_to_sync_objects(from_references.get(id)!, to_references.get(id)!, to_doc, value_refs)
        events = events.concat(update_model_events)
      }
    }
    return {
      references: Document._references_json(value_refs, false), // include_defaults=false
      events,
    }
  }

  to_json_string(include_defaults: boolean = true): string {
    return JSON.stringify(this.to_json(include_defaults))
  }

  to_json(include_defaults: boolean = true): DocJson {
    const root_ids = this._roots.map((r) => r.id)
    const root_references = this._all_models.values()
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

    function pyify(version: string) {
      return version.replace(/-(dev|rc)\./, "$1")
    }

    const py_version = json.version! // XXX!
    const is_dev = py_version.indexOf('+') !== -1 || py_version.indexOf('-') !== -1
    const versions_string = `Library versions: JS (${js_version}) / Python (${py_version})`
    if (!is_dev && pyify(js_version) != py_version) {
      logger.warn("JS/Python version mismatch")
      logger.warn(versions_string)
    } else
      logger.debug(versions_string)

    const roots_json = json.roots
    const root_ids = roots_json.root_ids
    const references_json = roots_json.references

    const references = Document._instantiate_references_json(references_json, new Map())
    Document._initialize_references_json(references_json, new Map(), references, new Map())

    const doc = new Document()
    for (const id of root_ids) {
      const root = references.get(id)
      if (root != null) {
        doc.add_root(root as Model) // XXX: HasProps
      }
    }
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
    const references = new Set<HasProps>()
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
      references: Document._references_json(references),
    }
  }

  apply_json_patch(patch: Patch, buffers: Buffers | ReturnType<Buffers["entries"]> = new Map(), setter_id?: string): void {
    const references_json = patch.references
    const events_json = patch.events
    const references = Document._instantiate_references_json(references_json, this._all_models)

    if (!(buffers instanceof Map)) {
      buffers = new Map(buffers)
    }

    // The model being changed isn't always in references so add it in
    for (const event_json of events_json) {
      switch (event_json.kind) {
        case "RootAdded":
        case "RootRemoved":
        case "ModelChanged": {
          const model_id = event_json.model.id
          const model = this._all_models.get(model_id)
          if (model != null) {
            references.set(model_id, model)
          } else if (!references.has(model_id)) {
            logger.warn(`Got an event for unknown model ${event_json.model}"`)
            throw new Error("event model wasn't known")
          }
          break
        }
      }
    }

    // split references into old and new so we know whether to initialize or update
    const old_references: RefMap = new Map()
    const new_references: RefMap = new Map()
    for (const [id, value] of references) {
      if (this._all_models.has(id))
        old_references.set(id, value)
      else
        new_references.set(id, value)
    }

    Document._initialize_references_json(references_json, old_references, new_references, buffers)

    for (const event_json of events_json) {
      switch (event_json.kind) {
        case 'MessageSent': {
          const {msg_type, msg_data} = event_json
          let data: unknown
          if (msg_data === undefined) {
            if (buffers.size == 1) {
              const [[, buffer]] = buffers
              data = buffer
            } else {
              throw new Error("expected exactly one buffer")
            }
          } else {
            data = Document._resolve_refs(msg_data, old_references, new_references, buffers)
          }

          this._trigger_on_message(msg_type, data)
          break
        }
        case 'ModelChanged': {
          const patched_id = event_json.model.id
          const patched_obj = this._all_models.get(patched_id)
          if (patched_obj == null) {
            throw new Error(`Cannot apply patch to ${patched_id} which is not in the document`)
          }
          const attr = event_json.attr
          const value = Document._resolve_refs(event_json.new, old_references, new_references, buffers)
          patched_obj.setv({[attr]: value}, {setter_id})
          break
        }
        case 'ColumnDataChanged': {
          const column_source_id = event_json.column_source.id
          const column_source = this._all_models.get(column_source_id) as ColumnDataSource | undefined
          if (column_source == null) {
            throw new Error(`Cannot stream to ${column_source_id} which is not in the document`)
          }
          const data = Document._resolve_refs(event_json.new, new Map(), new Map(), buffers) as Data
          if (event_json.cols != null) {
            for (const k in column_source.data) {
              if (!(k in data)) {
                data[k] = column_source.data[k]
              }
            }
          }
          column_source.setv({data}, {setter_id, check_eq: false})
          break
        }
        case 'ColumnsStreamed': {
          const column_source_id = event_json.column_source.id
          const column_source = this._all_models.get(column_source_id)
          if (column_source == null) {
            throw new Error(`Cannot stream to ${column_source_id} which is not in the document`)
          }
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
          const column_source = this._all_models.get(column_source_id)
          if (column_source == null) {
            throw new Error(`Cannot patch ${column_source_id} which is not in the document`)
          }
          if (!(column_source instanceof ColumnDataSource)) {
            throw new Error("Cannot patch non-ColumnDataSource")
          }
          const patches = event_json.patches
          column_source.patch(patches, setter_id)
          break
        }
        case 'RootAdded': {
          const root_id = event_json.model.id
          const root_obj = references.get(root_id)
          this.add_root(root_obj as Model, setter_id) // XXX: HasProps
          break
        }
        case 'RootRemoved': {
          const root_id = event_json.model.id
          const root_obj = references.get(root_id)
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

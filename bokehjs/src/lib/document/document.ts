import {default_resolver} from "../base"
import {version as js_version} from "../version"
import {logger} from "../core/logging"
import type {Class} from "core/class"
import type {HasProps} from "core/has_props"
import type {Property} from "core/properties"
import {ModelResolver} from "core/resolvers"
import type {ModelRep} from "core/serialization"
import {Serializer} from "core/serialization"
import {Deserializer} from "core/serialization/deserializer"
import {Version} from "core/util/version"
import type {Ref} from "core/util/refs"
import type {ID, Data} from "core/types"
import {Signal0} from "core/signaling"
import {isString} from "core/util/types"
import type {Equatable, Comparator} from "core/util/eq"
import {equals, is_equal} from "core/util/eq"
import {copy} from "core/util/array"
import {entries, dict} from "core/util/object"
import * as sets from "core/util/set"
import type {CallbackLike} from "core/util/callbacks"
import {execute} from "core/util/callbacks"
import {assert} from "core/util/assert"
import {Model} from "model"
import type {ModelDef} from "./defs"
import {decode_def} from "./defs"
import type {BokehEvent, BokehEventType, BokehEventMap} from "core/bokeh_events"
import {ModelEvent} from "core/bokeh_events"
import {DocumentReady, LODStart, LODEnd} from "core/bokeh_events"
import type {DocumentEvent, DocumentChangedEvent, Decoded, DocumentChanged} from "./events"
import {DocumentEventBatch, RootRemovedEvent, TitleChangedEvent, MessageSentEvent, RootAddedEvent} from "./events"
import type {ViewManager} from "core/view_manager"

Deserializer.register("model", decode_def)

export type Out<T> = T

export type DocumentEventCallback<T extends BokehEvent = BokehEvent> = CallbackLike<Document, [T]>

// Dispatches events to the subscribed models
export class EventManager {
  readonly subscribed_models: Set<Model> = new Set()

  constructor(readonly document: Document) {}

  send_event(bokeh_event: BokehEvent): void {
    if (bokeh_event.publish) {
      const event = new MessageSentEvent(this.document, "bokeh_event", bokeh_event)
      this.document._trigger_on_change(event)
    }

    this.document._trigger_on_event(bokeh_event)
  }

  trigger(event: ModelEvent): void {
    for (const model of this.subscribed_models) {
      if (event.origin != null && event.origin != model) {
        continue
      }
      model._process_event(event)
    }
  }
}

export type DocJson = {
  version?: string
  title?: string
  defs?: ModelDef[]
  roots: ModelRep[]
  callbacks?: {[key: string]: ModelRep[]}
}

export type Patch = {
  events: DocumentChanged[]
}

export const documents: Document[] = []

export const DEFAULT_TITLE = "Bokeh Application"

// This class should match the API of the Python Document class
// as much as possible.
export class Document implements Equatable {
  /** @experimental */
  views_manager?: ViewManager

  readonly event_manager: EventManager
  readonly idle: Signal0<this>

  protected readonly _init_timestamp: number
  protected readonly _resolver: ModelResolver
  protected _title: string
  protected _roots: HasProps[]
  /*protected*/ _all_models: Map<ID, Model>
  protected _new_models: Set<HasProps>
  protected _all_models_freeze_count: number
  protected _callbacks: Map<((event: DocumentEvent) => void) | ((event: DocumentChangedEvent) => void), boolean>
  protected _document_callbacks: Map<string, DocumentEventCallback[]>
  protected _message_callbacks: Map<string, Set<(data: unknown) => void>>
  private _idle_roots: WeakSet<HasProps>
  protected _interactive_timestamp: number | null
  protected _interactive_plot: Model | null
  protected _interactive_finalize: (() => void) | null

  constructor(options: {roots?: Iterable<HasProps>, resolver?: ModelResolver} = {}) {
    documents.push(this)
    this._init_timestamp = Date.now()
    this._resolver = options.resolver ?? new ModelResolver(default_resolver)
    this._title = DEFAULT_TITLE
    this._roots = []
    this._all_models = new Map()
    this._new_models = new Set()
    this._all_models_freeze_count = 0
    this._callbacks = new Map()
    this._document_callbacks = new Map()
    this._message_callbacks = new Map()
    this.event_manager = new EventManager(this)
    this.idle = new Signal0(this, "idle")
    this._idle_roots = new WeakSet()
    this._interactive_timestamp = null
    this._interactive_plot = null
    if (options.roots != null) {
      this._add_roots(...options.roots)
    }
    this.on_message("bokeh_event", (event) => {
      assert(event instanceof ModelEvent)
      this.event_manager.trigger(event)
    })
  }

  [equals](that: this, _cmp: Comparator): boolean {
    return this == that
  }

  get all_models(): Set<HasProps> {
    return new Set(this._all_models.values())
  }

  get is_idle(): boolean {
    // TODO: models without views, e.g. data models
    for (const root of this._roots) {
      if (!this._idle_roots.has(root)) {
        return false
      }
    }
    return true
  }

  notify_idle(model: HasProps): void {
    this._idle_roots.add(model)
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

  interactive_start(plot: Model, finalize: (() => void) | null = null): void {
    if (this._interactive_plot == null) {
      this._interactive_plot = plot
      this._interactive_plot.trigger_event(new LODStart())
    }
    this._interactive_finalize = finalize
    this._interactive_timestamp = Date.now()
  }

  interactive_stop(): void {
    if (this._interactive_plot != null) {
      this._interactive_plot.trigger_event(new LODEnd())
      if (this._interactive_finalize != null) {
        this._interactive_finalize()
      }
    }
    this._interactive_plot = null
    this._interactive_timestamp = null
    this._interactive_finalize = null
  }

  interactive_duration(): number {
    if (this._interactive_timestamp == null) {
      return -1
    } else {
      return Date.now() - this._interactive_timestamp
    }
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
      if (root.document != null) {
        throw new Error(`Somehow we didn't detach ${root}`)
      }
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
    const recomputed: Map<ID, HasProps> = new Map()
    for (const model of new_all_models_set) {
      recomputed.set(model.id, model)
    }
    for (const d of to_detach) {
      d.detach_document()
    }
    for (const model of to_attach) {
      model.attach_document(this)
      this._new_models.add(model)
    }
    this._all_models = recomputed as any // XXX
  }

  roots(): HasProps[] {
    return this._roots
  }

  protected _add_roots(...models: HasProps[]): boolean {
    models = models.filter((model) => !this._roots.includes(model))
    if (models.length == 0) {
      return false
    }

    this._push_all_models_freeze()
    try {
      this._roots.push(...models)
    } finally {
      this._pop_all_models_freeze()
    }

    return true
  }

  protected _remove_root(model: HasProps): boolean {
    const i = this._roots.indexOf(model)
    if (i < 0) {
      return false
    }

    this._push_all_models_freeze()
    try {
      this._roots.splice(i, 1)
    } finally {
      this._pop_all_models_freeze()
    }

    return true
  }

  protected _set_title(title: string): boolean {
    const new_title = title != this._title
    if (new_title) {
      this._title = title
    }
    return new_title
  }

  add_root(model: HasProps, {sync}: {sync?: boolean} = {}): void {
    if (this._add_roots(model)) {
      const event = new RootAddedEvent(this, model)
      event.sync = sync ?? true
      this._trigger_on_change(event)
    }
  }

  remove_root(model: HasProps, {sync}: {sync?: boolean} = {}): void {
    if (this._remove_root(model)) {
      const event = new RootRemovedEvent(this, model)
      event.sync = sync ?? true
      this._trigger_on_change(event)
    }
  }

  set_title(title: string, {sync}: {sync?: boolean} = {}): void {
    if (this._set_title(title)) {
      const event = new TitleChangedEvent(this, title)
      event.sync = sync ?? true
      this._trigger_on_change(event)
    }
  }

  title(): string {
    return this._title
  }

  get_model_by_id(model_id: string): HasProps | null {
    return this._all_models.get(model_id) ?? null
  }

  get_model_by_name(name: string): HasProps | null {
    const found = []
    for (const model of this._all_models.values()) {
      if (model instanceof Model && model.name == name) {
        found.push(model)
      }
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
    if (message_callbacks == null) {
      this._message_callbacks.set(msg_type, new Set([callback]))
    } else {
      message_callbacks.add(callback)
    }
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

  remove_on_change(callback: ((event: DocumentEvent) => void) | ((event: DocumentChangedEvent) => void)): void {
    this._callbacks.delete(callback)
  }

  _trigger_on_change(event: DocumentEvent): void {
    for (const [callback, allow_batches] of this._callbacks) {
      if (!allow_batches && event instanceof DocumentEventBatch) {
        for (const ev of event.events) {
          callback(ev)
        }
      } else {
        callback(event as any) // TODO
      }
    }
  }

  _trigger_on_event(event: BokehEvent): void {
    const callbacks = this._document_callbacks.get(event.event_name)
    if (callbacks != null) {
      for (const callback of callbacks) {
        void execute(callback, this, event)
      }
    }
  }

  on_event<T extends BokehEventType>(event: T, ...callback: DocumentEventCallback<BokehEventMap[T]>[]): void
  on_event<T extends BokehEvent>(event: Class<T>, ...callback: DocumentEventCallback<T>[]): void

  on_event(event: string | Class<BokehEvent>, ...callbacks: DocumentEventCallback[]): void {
    const name = isString(event) ? event : event.prototype.event_name

    const existing = this._document_callbacks.get(name) ?? []
    const added = callbacks

    this._document_callbacks.set(name, [...existing, ...added])
  }

  to_json_string(include_defaults: boolean = true): string {
    return JSON.stringify(this.to_json(include_defaults))
  }

  to_json(include_defaults: boolean = true): DocJson {
    const serializer = new Serializer({include_defaults})
    const roots = serializer.encode(this._roots)
    return {
      version: js_version,
      title: this._title,
      roots,
    }
  }

  static from_json_string(s: string, events?: Out<DocumentEvent[]>): Document {
    const json = JSON.parse(s)
    return Document.from_json(json, events)
  }

  private static _handle_version(json: DocJson): void {
    if (json.version == null) {
      logger.warn("'version' field is missing")
    }

    const py_version = json.version ?? "0.0.0"

    const py_ver = Version.from(py_version)
    const js_ver = Version.from(js_version)

    const message = `new document using Bokeh ${py_version} and BokehJS ${js_version}`

    if (is_equal(py_ver, js_ver)) {
      logger.debug(message)
    } else {
      logger.warn(`Bokeh/BokehJS version mismatch: ${message}`)
    }
  }

  static from_json(doc_json: DocJson, events?: Out<DocumentEvent[]>): Document {
    logger.debug("Creating Document from JSON")
    Document._handle_version(doc_json)

    const resolver = new ModelResolver(default_resolver)
    if (doc_json.defs != null) {
      const deserializer = new Deserializer(resolver)
      deserializer.decode(doc_json.defs)
    }

    const doc = new Document({resolver})
    doc._push_all_models_freeze()

    const listener = (event: DocumentEvent) => events?.push(event)
    doc.on_change(listener, true)

    const deserializer = new Deserializer(resolver, doc._all_models, (obj) => obj.attach_document(doc))

    const roots = deserializer.decode(doc_json.roots) as Model[]

    const callbacks = (() => {
      if (doc_json.callbacks != null) {
        return deserializer.decode(doc_json.callbacks) as {[key: string]: DocumentEventCallback[]}
      } else {
        return {}
      }
    })()

    doc.remove_on_change(listener)

    for (const [event, event_callbacks] of entries(callbacks)) {
      doc.on_event(event as BokehEventType, ...event_callbacks)
    }

    for (const root of roots) {
      doc.add_root(root)
    }

    if (doc_json.title != null) {
      doc.set_title(doc_json.title)
    }

    doc._pop_all_models_freeze()
    return doc
  }

  replace_with_json(json: DocJson): void {
    const replacement = Document.from_json(json)
    replacement.destructively_move(this)
  }

  create_json_patch(events: DocumentChangedEvent[]): Patch {
    for (const event of events) {
      if (event.document != this) {
        throw new Error("Cannot create a patch using events from a different document")
      }
    }

    const references: Map<HasProps, Ref> = new Map()
    for (const model of this._all_models.values()) {
      if (!this._new_models.has(model)) {
        references.set(model, model.ref())
      }
    }

    const serializer = new Serializer({references, binary: true})
    const patch = {events: serializer.encode(events)}

    this._new_models.clear()
    return patch
  }

  apply_json_patch(patch: Patch, buffers: Map<ID, ArrayBuffer> = new Map()): void {
    this._push_all_models_freeze()

    const deserializer = new Deserializer(this._resolver, this._all_models, (obj) => obj.attach_document(this))
    const events = deserializer.decode(patch.events, buffers) as Decoded.DocumentChanged[]

    for (const event of events) {
      switch (event.kind) {
        case "MessageSent": {
          const {msg_type, msg_data} = event
          this._trigger_on_message(msg_type, msg_data)
          break
        }
        case "ModelChanged": {
          const {model, attr, new: value} = event
          model.setv({[attr]: value}, {sync: false})
          break
        }
        case "ColumnDataChanged": {
          const {model, attr, data, cols} = event
          if (cols != null) {
            const new_data = dict(data)
            const current_data = dict(model.property(attr).get_value() as Data)
            for (const [name, column] of current_data) {
              if (!new_data.has(name)) {
                new_data.set(name, column)
              }
            }
          }
          model.setv({data}, {sync: false, check_eq: false})
          break
        }
        case "ColumnsStreamed": {
          const {model, attr, data, rollover} = event
          const prop = model.property(attr) as Property<Data>
          model.stream_to(prop, data, rollover, {sync: false})
          break
        }
        case "ColumnsPatched": {
          const {model, attr, patches} = event
          const prop = model.property(attr) as Property<Data>
          model.patch_to(prop, patches, {sync: false})
          break
        }
        case "RootAdded": {
          this.add_root(event.model, {sync: false})
          break
        }
        case "RootRemoved": {
          this.remove_root(event.model, {sync: false})
          break
        }
        case "TitleChanged": {
          this.set_title(event.title, {sync: false})
          break
        }
        default: {
          throw new Error(`unknown patch event type '${(event as any).kind}'`) // XXX
        }
      }
    }

    this._pop_all_models_freeze()
  }
}

import {ModelResolver} from "../base"
import {version as js_version} from "../version"
import {logger} from "../core/logging"
import {BokehEvent, DocumentReady, ModelEvent, LODStart, LODEnd} from "core/bokeh_events"
import {HasProps} from "core/has_props"
import {Serializer} from "core/serializer"
import {Deserializer, RefMap} from "core/deserializer"
import {ID} from "core/types"
import {Signal0} from "core/signaling"
import {Struct} from "core/util/refs"
import {equals, Equatable, Comparator} from "core/util/eq"
import {Buffers} from "core/util/serialization"
import {copy, includes} from "core/util/array"
import * as sets from "core/util/set"
import {LayoutDOM} from "models/layouts/layout_dom"
import {Model} from "model"
import {ModelDef, resolve_defs} from "./defs"
import {
  DocumentEvent, DocumentEventBatch, DocumentChangedEvent,
  RootRemovedEvent, TitleChangedEvent, MessageSentEvent,
  DocumentChanged, RootAddedEvent,
} from "./events"

export type Out<T> = T

// Dispatches events to the subscribed models
export class EventManager {
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

export type DocJson = {
  version?: string
  title?: string
  defs?: ModelDef[]
  roots: {
    root_ids: ID[]
    references: Struct[]
  }
}

export type Patch = {
  references: Struct[]
  events: DocumentChanged[]
}

export const documents: Document[] = []

export const DEFAULT_TITLE = "Bokeh Application"

// This class should match the API of the Python Document class
// as much as possible.
export class Document implements Equatable {
  readonly event_manager: EventManager
  readonly idle: Signal0<this>

  protected readonly _init_timestamp: number
  protected readonly _resolver: ModelResolver
  protected _title: string
  protected _roots: Model[]
  /*protected*/ _all_models: Map<ID, Model>
  protected _all_models_freeze_count: number
  protected _callbacks: Map<((event: DocumentEvent) => void) | ((event: DocumentChangedEvent) => void), boolean>
  protected _message_callbacks: Map<string, Set<(data: unknown) => void>>
  private _idle_roots: WeakSet<HasProps>
  protected _interactive_timestamp: number | null
  protected _interactive_plot: Model | null
  protected _interactive_finalize: (() => void)| null

  constructor(options?: {resolver?: ModelResolver}) {
    documents.push(this)
    this._init_timestamp = Date.now()
    this._resolver = options?.resolver ?? new ModelResolver()
    this._title = DEFAULT_TITLE
    this._roots = []
    this._all_models = new Map()
    this._all_models_freeze_count = 0
    this._callbacks = new Map()
    this._message_callbacks = new Map()
    this.event_manager = new EventManager(this)
    this.idle = new Signal0(this, "idle")
    this._idle_roots = new WeakSet()
    this._interactive_timestamp = null
    this._interactive_plot = null
  }

  [equals](that: this, _cmp: Comparator): boolean {
    return this == that
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

  interactive_start(plot: Model, finalize: (() => void)|null = null): void {
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
    this._all_models = recomputed as any // XXX
  }

  roots(): Model[] {
    return this._roots
  }

  protected _add_root(model: Model): boolean {
    if (includes(this._roots, model))
      return false

    this._push_all_models_freeze()
    try {
      this._roots.push(model)
    } finally {
      this._pop_all_models_freeze()
    }

    return true
  }

  protected _remove_root(model: Model): boolean {
    const i = this._roots.indexOf(model)
    if (i < 0)
      return false

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
    if (new_title)
      this._title = title
    return new_title
  }

  add_root(model: Model): void {
    if (this._add_root(model))
      this._trigger_on_change(new RootAddedEvent(this, model))
  }

  remove_root(model: Model): void {
    if (this._remove_root(model))
      this._trigger_on_change(new RootRemovedEvent(this, model))
  }

  set_title(title: string): void {
    if (this._set_title(title))
      this._trigger_on_change(new TitleChangedEvent(this, title))
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

  to_json_string(include_defaults: boolean = true): string {
    return JSON.stringify(this.to_json(include_defaults))
  }

  to_json(include_defaults: boolean = true): DocJson {
    const serializer = new Serializer({include_defaults})
    const roots = serializer.to_serializable(this._roots)
    return {
      version: js_version,
      title: this._title,
      roots: {
        root_ids: roots.map((r) => r.id),
        references: [...serializer.definitions],
      },
    }
  }

  static from_json_string(s: string, events?: Out<DocumentEvent[]>): Document {
    const json = JSON.parse(s)
    return Document.from_json(json, events)
  }

  private static _handle_version(json: DocJson): void {
    function pyify(version: string) {
      return version.replace(/-(dev|rc)\./, "$1")
    }

    if (json.version != null) {
      const py_version = json.version
      const is_dev = py_version.indexOf("+") !== -1 || py_version.indexOf("-") !== -1
      const versions_string = `Library versions: JS (${js_version}) / Python (${py_version})`
      if (!is_dev && pyify(js_version) != py_version) {
        logger.warn("JS/Python version mismatch")
        logger.warn(versions_string)
      } else
        logger.debug(versions_string)
    } else
      logger.warn("'version' field is missing")
  }

  static from_json(doc_json: DocJson, events?: Out<DocumentEvent[]>): Document {
    logger.debug("Creating Document from JSON")
    Document._handle_version(doc_json)

    const resolver = new ModelResolver()
    if (doc_json.defs != null) {
      resolve_defs(doc_json.defs, resolver)
    }

    const doc = new Document({resolver})
    doc._push_all_models_freeze()

    const listener = (event: DocumentEvent) => events?.push(event)
    doc.on_change(listener, true)

    const deserializer = new Deserializer(resolver, doc._all_models)

    const root_refs = doc_json.roots.root_ids.map((id) => { return {id} }) // TODO: root_ids -> roots
    const roots = deserializer.decode(root_refs, doc_json.roots.references, new Map(), doc) as Model[]

    doc.remove_on_change(listener)

    for (const root of roots) {
      doc.add_root(root)
    }

    if (doc_json.title != null)
      doc.set_title(doc_json.title)

    doc._pop_all_models_freeze()
    return doc
  }

  replace_with_json(json: DocJson): void {
    const replacement = Document.from_json(json)
    replacement.destructively_move(this)
  }

  create_json_patch(events: DocumentChangedEvent[]): Patch {
    for (const event of events) {
      if (event.document != this)
        throw new Error("Cannot create a patch using events from a different document")
    }

    const serializer = new Serializer()
    const events_repr = serializer.to_serializable(events)

    // TODO: We need a proper differential serializer. For now just remove known
    // definitions. We are doing this after a complete serialization, so that all
    // new objects are recorded.
    const need_all_models = events.some((ev) => ev instanceof RootAddedEvent)
    if (!need_all_models) {
      for (const model of this._all_models.values()) {
        serializer.remove_def(model)
      }
    }

    return {
      events: events_repr,
      references: [...serializer.definitions],
    }
  }

  apply_json_patch(patch: Patch, buffers: Buffers | ReturnType<Buffers["entries"]> = new Map()): void {
    if (!(buffers instanceof Map)) {
      buffers = new Map(buffers)
    }

    this._push_all_models_freeze()

    const deserializer = new Deserializer(this._resolver, this._all_models)
    const events = deserializer.decode(patch.events, patch.references, buffers, this) as DocumentChanged[] // not really, (De) SerializedOf

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
          const {column_source, cols, new: data} = event
          if (cols != null) {
            for (const k in column_source.data) {
              if (!(k in data)) {
                data[k] = column_source.data[k]
              }
            }
          }
          column_source.setv({data}, {sync: false, check_eq: false})
          break
        }
        case "ColumnsStreamed": {
          const {column_source, data, rollover} = event
          column_source.stream(data, rollover, {sync: false})
          break
        }
        case "ColumnsPatched": {
          const {column_source, patches} = event
          column_source.patch(patches, {sync: false})
          break
        }
        case "RootAdded": {
          this._add_root(event.model)
          break
        }
        case "RootRemoved": {
          this._remove_root(event.model)
          break
        }
        case "TitleChanged": {
          this._set_title(event.title)
          break
        }
        default:
          throw new Error(`unknown patch event type '${event.kind}'`)
      }
    }

    this._pop_all_models_freeze()
  }
}

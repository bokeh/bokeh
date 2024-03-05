import {HasProps} from "./core/has_props"
import type {Class} from "./core/class"
import type {Dict} from "./core/types"
import type {ModelEvent, ModelEventType, BokehEventMap} from "./core/bokeh_events"
import type * as p from "./core/properties"
import {isString, isPlainObject} from "./core/util/types"
import {dict} from "./core/util/object"
import type {Comparator} from "core/util/eq"
import {equals} from "core/util/eq"
import {logger} from "./core/logging"
import type {CallbackLike0} from "./core/util/callbacks"
import {execute} from "./core/util/callbacks"

export type ModelSelector<T> = Class<T> | string | {type: string}

export type ChangeCallback = CallbackLike0<Model>

export type EventCallback<T extends ModelEvent = ModelEvent> = CallbackLike0<T>

export namespace Model {
  export type Attrs = p.AttrsOf<Props>

  export type Props = HasProps.Props & {
    tags: p.Property<unknown[]>
    name: p.Property<string | null>
    js_property_callbacks: p.Property<Dict<ChangeCallback[]>>
    js_event_callbacks: p.Property<Dict<EventCallback[]>>
    subscribed_events: p.Property<Set<string>>
    syncable: p.Property<boolean>
  }
}

export interface Model extends Model.Attrs {}

export abstract class Model extends HasProps {
  declare properties: Model.Props

  private readonly _js_callbacks: Map<string, (() => void)[]> = new Map()

  override get is_syncable(): boolean {
    return this.syncable
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return (cmp.structural ? true : cmp.eq(this.id, that.id)) && super[equals](that, cmp)
  }

  constructor(attrs?: Partial<Model.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Model.Props>(({Any, Unknown, Bool, Str, List, Set, Dict, Nullable}) => ({
      tags:                  [ List(Unknown), [] ],
      name:                  [ Nullable(Str), null ],
      js_property_callbacks: [ Dict(List(Any /*TODO*/)), {} ],
      js_event_callbacks:    [ Dict(List(Any /*TODO*/)), {} ],
      subscribed_events:     [ Set(Str), new globalThis.Set() ],
      syncable:              [ Bool, true ],
    }))
  }

  override connect_signals(): void {
    super.connect_signals()

    this._update_property_callbacks()
    this.connect(this.properties.js_property_callbacks.change, () => this._update_property_callbacks())
    this.connect(this.properties.js_event_callbacks.change, () => this._update_event_callbacks())
    this.connect(this.properties.subscribed_events.change, () => this._update_event_callbacks())
  }

  /*protected*/ _process_event(event: ModelEvent): void {
    for (const callback of dict(this.js_event_callbacks).get(event.event_name) ?? []) {
      void execute(callback, event)
    }

    if (this.document != null && this.subscribed_events.has(event.event_name)) {
      this.document.event_manager.send_event(event)
    }
  }

  trigger_event(event: ModelEvent): void {
    if (this.document != null) {
      event.origin = this
      this.document.event_manager.trigger(event)
    }
  }

  protected _update_event_callbacks(): void {
    if (this.document == null) {
      logger.warn("WARNING: Document not defined for updating event callbacks")
      return
    }
    this.document.event_manager.subscribed_models.add(this)
  }

  protected _update_property_callbacks(): void {
    const signal_for = (event: string) => {
      const [evt, attr=null] = event.split(":")
      return attr != null ? (this.properties as any)[attr][evt] : (this as any)[evt]
    }

    for (const [event, callbacks] of this._js_callbacks) {
      const signal = signal_for(event)
      for (const cb of callbacks) {
        this.disconnect(signal, cb)
      }
    }
    this._js_callbacks.clear()

    for (const [event, callbacks] of dict(this.js_property_callbacks)) {
      const wrappers = callbacks.map((cb) => () => execute(cb, this))
      this._js_callbacks.set(event, wrappers)
      const signal = signal_for(event)
      for (const cb of wrappers) {
        this.connect(signal, cb)
      }
    }
  }

  protected override _doc_attached(): void {
    if (this.js_event_callbacks.size != 0 || this.subscribed_events.size != 0) {
      this._update_event_callbacks()
    }
  }

  protected override _doc_detached(): void {
    this.document!.event_manager.subscribed_models.delete(this)
  }

  select<T extends HasProps>(selector: ModelSelector<T>): T[] {
    if (isString(selector)) {
      return [...this.references()].filter((ref): ref is T => ref instanceof Model && ref.name === selector)
    } else if (isPlainObject(selector) && "type" in selector) {
      return [...this.references()].filter((ref): ref is T => ref.type == selector.type)
    } else if (selector.prototype instanceof HasProps) {
      return [...this.references()].filter((ref): ref is T => ref instanceof selector)
    } else {
      throw new Error(`invalid selector ${selector}`)
    }
  }

  select_one<T extends HasProps>(selector: ModelSelector<T>): T | null {
    const result = this.select(selector)
    switch (result.length) {
      case 0:
        return null
      case 1:
        return result[0]
      default:
        throw new Error(`found multiple objects matching the given selector ${selector}`)
    }
  }

  get_one<T extends HasProps>(selector: ModelSelector<T>): T {
    const result = this.select_one(selector)
    if (result != null) {
      return result
    } else {
      throw new Error(`could not find any objects matching the given selector ${selector}`)
    }
  }

  on_event<T extends ModelEventType>(event: T, callback: EventCallback<BokehEventMap[T]>): void
  on_event<T extends ModelEvent>(event: Class<T>, callback: EventCallback<T>): void

  on_event(event: ModelEventType | Class<ModelEvent>, callback: EventCallback): void {
    const name = isString(event) ? event : event.prototype.event_name
    const js_event_callbacks = dict(this.js_event_callbacks)
    const callbacks = js_event_callbacks.get(name) ?? []
    js_event_callbacks.set(name, [...callbacks, callback])
  }
}

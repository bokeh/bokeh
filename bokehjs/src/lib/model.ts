import {HasProps} from "./core/has_props"
import {Class} from "./core/class"
import {BokehEvent} from "./core/bokeh_events"
import * as p from "./core/properties"
import {isString} from "./core/util/types"
import {isEmpty} from "./core/util/object"
import {logger} from "./core/logging"
import {CallbackLike0} from "./models/callbacks/callback"

export namespace Model {
  export type Attrs = p.AttrsOf<Props>

  export type Props = HasProps.Props & {
    tags: p.Property<string[]>
    name: p.Property<string | null>
    js_property_callbacks: p.Property<{[key: string]: CallbackLike0<Model>[]}>
    js_event_callbacks: p.Property<{[key: string]: CallbackLike0<BokehEvent>[]}>
    subscribed_events: p.Property<string[]>
  }
}

export interface Model extends Model.Attrs {}

export class Model extends HasProps {
  properties: Model.Props

  constructor(attrs?: Partial<Model.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Model"

    this.define<Model.Props>({
      tags:                  [ p.Array, [] ],
      name:                  [ p.String    ],
      js_property_callbacks: [ p.Any,   {} ],
      js_event_callbacks:    [ p.Any,   {} ],
      subscribed_events:     [ p.Array, [] ],
    })
  }

  connect_signals(): void {
    super.connect_signals()

    for (const base_evt in this.js_property_callbacks) {
      const callbacks = this.js_property_callbacks[base_evt]
      const [evt, attr=null] = base_evt.split(':')
      for (const cb of callbacks) {
        const signal = attr != null ? (this.properties as any)[attr][evt] : (this as any)[evt]
        this.connect(signal, () => cb.execute(this))
      }
    }

    this.connect(this.properties.js_event_callbacks.change, () => this._update_event_callbacks())
    this.connect(this.properties.subscribed_events.change, () => this._update_event_callbacks())
  }

  /*protected*/ _process_event(event: BokehEvent): void {
    for (const callback of this.js_event_callbacks[event.event_name] || [])
      callback.execute(event)

    if (this.document != null && this.subscribed_events.some((m) => m == event.event_name))
      this.document.event_manager.send_event(event)
  }

  trigger_event(event: BokehEvent): void {
    if (this.document != null) {
      event.origin = this
      this.document.event_manager.trigger(event)
    }
  }

  protected _update_event_callbacks(): void {
    if (this.document == null) {
      // File an issue: SidePanel in particular seems to have this issue
      logger.warn('WARNING: Document not defined for updating event callbacks')
      return
    }
    this.document.event_manager.subscribed_models.add(this.id)
  }

  protected _doc_attached(): void {
    if (!isEmpty(this.js_event_callbacks) || !isEmpty(this.subscribed_events))
      this._update_event_callbacks()
  }

  select<T extends HasProps>(selector: Class<T> | string): T[] {
    if (isString(selector))
      return this.references().filter((ref): ref is T => ref instanceof Model && ref.name === selector)
    else if (selector.prototype instanceof HasProps)
      return this.references().filter((ref): ref is T => ref instanceof selector)
    else
      throw new Error("invalid selector")
  }

  select_one<T extends HasProps>(selector: Class<T> | string): T | null {
    const result = this.select(selector)
    switch (result.length) {
      case 0:
        return null
      case 1:
        return result[0]
      default:
        throw new Error("found more than one object matching given selector")
    }
  }
}
Model.initClass()

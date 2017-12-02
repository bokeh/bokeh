import {HasProps} from "./core/has_props"
import {Class} from "./core/aux"
import {BokehEvent} from "./core/bokeh_events"
import * as p from "./core/properties"
import {isString} from "./core/util/types"
import {isEmpty} from "./core/util/object"
import {logger} from "./core/logging"
import {CustomJS} from "./models/callbacks/customjs"

export class Model extends HasProps {

  tags: string[]
  name: string | null
  js_property_callbacks: {[key: string]: CustomJS[]}
  js_event_callbacks: {[key: string]: CustomJS[]}
  subscribed_events: string[]

  connect_signals(): void {
    super.connect_signals()

    for (const base_evt in this.js_property_callbacks) {
      const callbacks = this.js_property_callbacks[base_evt]
      const [evt, attr=null] = base_evt.split(':')
      for (const cb of callbacks) {
        const signal = attr != null ? (this.properties as any)[attr][evt] : (this as any)[evt]
        this.connect(signal, () => cb.execute(this, {}))
      }
    }

    this.connect(this.properties.js_event_callbacks.change, () => this._update_event_callbacks)
    this.connect(this.properties.subscribed_events.change, () => this._update_event_callbacks)
  }

  /*protected*/ _process_event(event: BokehEvent): void {
    if (event.is_applicable_to(this)) {
      event = event._customize_event(this)

      for (const callback of this.js_event_callbacks[event.event_name] || [])
        callback.execute(event, {})

      if (this.document != null) {
        if (this.subscribed_events.some((m) => m == event.event_name))
          this.document.event_manager.send_event(event)
      }
    }
  }

  trigger_event(event: BokehEvent): void {
    if (this.document != null)
      this.document.event_manager.trigger(event.set_model_id(this.id))
  }

  protected _update_event_callbacks(): void {
    if (this.document == null) {
      // File an issue: SidePanel in particular seems to have this issue
      logger.warn('WARNING: Document not defined for updating event callbacks')
      return
    }
    this.document.event_manager.subscribed_models.push(this.id)
  }

  protected _doc_attached(): void {
    if (!isEmpty(this.js_event_callbacks) || !isEmpty(this.subscribed_events))
      this._update_event_callbacks()
  }

  select(selector: Class<HasProps> | string): HasProps[] {
    if (isString(selector))
      return this.references().filter((ref) => ref instanceof Model && ref.name === selector)
    else if (selector.prototype instanceof HasProps)
      return this.references().filter((ref) => ref instanceof selector)
    else
      throw new Error("invalid selector")
  }

  select_one(selector: Class<HasProps> | string): HasProps | null {
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

Model.prototype.type = "Model"

Model.define({
  tags:                  [ p.Array, [] ],
  name:                  [ p.String    ],
  js_property_callbacks: [ p.Any,   {} ],
  js_event_callbacks:    [ p.Any,   {} ],
  subscribed_events:     [ p.Array, [] ],
})

import {UIElement, UIElementView} from "./ui_element"
import type * as p from "core/properties"
import {dom_ready, span, div, InlineStyleSheet} from "core/dom"
import {Signal} from "core/signaling"

import * as base_css from "styles/base.css"
import * as icons_css from "styles/icons.css"
import * as buttons_css from "styles/buttons.css"
import * as notifications_css from "styles/notifications.css"

export const notifications_el: HTMLElement = (() => {
  const el = div()
  const shadow_el = el.attachShadow({mode: "open"})
  new InlineStyleSheet(base_css.default).install(shadow_el)
  new InlineStyleSheet(icons_css.default).install(shadow_el)
  new InlineStyleSheet(buttons_css.default).install(shadow_el)
  new InlineStyleSheet(notifications_css.default).install(shadow_el)
  const entries_el = div({class: "entries"})
  shadow_el.append(entries_el)
  void dom_ready().then(() => document.body.append(el))
  return entries_el
})()

export class NotificationsView extends UIElementView {
  declare model: Notifications

  protected _connection_el: HTMLElement | null = null
  protected _connection_timer: number | null = null

  override initialize(): void {
    super.initialize()

    this.model.push.connect((message) => {
      const dismiss_el = div({class: "close", title: "Close"})
      const message_el = div({class: message.type}, message.text, dismiss_el)
      notifications_el.append(message_el)
      const clear = () => message_el.remove()
      dismiss_el.addEventListener("click", clear)
      const timeout = message.timeout ?? 5000
      if (isFinite(timeout)) {
        setTimeout(clear, timeout)
      }
    })

    const {document} = this.model
    if (document == null) {
      return // this shouldn't happen
    }

    document.on_event("connection_lost", (_, event) => {
      if (!document.config.notify_connection_status) {
        return
      }
      this._connection_el?.remove()
      if (this._connection_timer != null) {
        clearTimeout(this._connection_timer)
        this._connection_timer = null
      }
      const {timeout} = event
      if (timeout == null) {
        const try_el = span({class: "try"}, "Try")
        try_el.addEventListener("click", () => {
          this._connection_el?.remove()
          event.reconnect()
        })
        const dismiss_el = div({class: "close", title: "Close"})
        dismiss_el.addEventListener("click", () => this._connection_el?.remove())
        this._connection_el = div({class: "error"}, "Client connection was lost permanently. ", try_el, " to reconnect manually.", dismiss_el)
        notifications_el.append(this._connection_el)
      } else {
        let current_timeout = timeout
        const timeout_el = span()
        const set_timeout = () => {
          const timeout = Math.max(0, Math.round(current_timeout / 1000))
          if (timeout == 0) {
            timeout_el.textContent = "Reconnecting now."
          } else {
            timeout_el.textContent = `Reconnection will be attempted in ${timeout} s.`
          }
        }
        set_timeout()
        this._connection_el = div({class: "error"}, "Client connection was lost. ", timeout_el)
        notifications_el.append(this._connection_el)
        this._connection_timer = setInterval(() => { current_timeout -= 1000; set_timeout() }, 1000)
      }
    })

    document.on_event("client_reconnected", (_, _event) => {
      if (!document.config.notify_connection_status) {
        return
      }
      this._connection_el?.remove()
      if (this._connection_timer != null) {
        clearTimeout(this._connection_timer)
        this._connection_timer = null
      }
      this._connection_el = div({class: "success"}, "Client connect was reestablished.")
      notifications_el.append(this._connection_el)
      this._connection_timer = setTimeout(() => this._connection_el?.remove(), 5000)
    })
  }
}

export namespace Notifications {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {}
}

export interface Notifications extends Notifications.Attrs {}

export class Notifications extends UIElement {
  declare properties: Notifications.Props
  declare __view_type__: NotificationsView

  constructor(attrs?: Partial<Notifications.Attrs>) {
    super(attrs)
  }

  readonly push = new Signal<Message, this>(this, "push")

  static {
    this.prototype.default_view = NotificationsView

    this.define<Notifications.Props>(() => ({
    }))
  }
}

type Message = {
  type: "error" | "success"
  text: string
  timeout?: number
}

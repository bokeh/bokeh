import {InputWidget, InputWidgetView} from "./input_widget"

import {empty, input, label} from "core/dom"
import * as p from "core/properties"

import * as Pikaday from "pikaday"

Pikaday.prototype.adjustPosition = function(this: Pikaday & {_o: Pikaday.PikadayOptions}): void {
  if (this._o.container)
    return

  this.el.style.position = 'absolute'

  const field = this._o.trigger!
  const width = this.el.offsetWidth
  const height = this.el.offsetHeight
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight
  const scrollTop = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop

  const clientRect = field.getBoundingClientRect()
  let left = clientRect.left + window.pageXOffset
  let top = clientRect.bottom + window.pageYOffset

  // adjust left/top origin to bk-root
  left -= this.el.parentElement!.offsetLeft
  top -= this.el.parentElement!.offsetTop

  // default position is bottom & left
  if ((this._o.reposition && left + width > viewportWidth) ||
      (this._o.position!.indexOf('right') > -1 && left - width + field.offsetWidth > 0))
    left = left - width + field.offsetWidth

  if ((this._o.reposition && top + height > viewportHeight + scrollTop) ||
      (this._o.position!.indexOf('top') > -1 && top - height - field.offsetHeight > 0))
    top = top - height - field.offsetHeight

  this.el.style.left = left + 'px'
  this.el.style.top = top + 'px'
}

export class DatePickerView extends InputWidgetView {
  model: DatePicker

  labelEl: HTMLElement
  inputEl: HTMLElement

  protected _picker: Pikaday

  css_classes(): string[] {
    return super.css_classes().concat("bk-widget-form-group")
  }

  render(): void {
    super.render()

    if (this._picker != null)
      this._picker.destroy()
    empty(this.el)

    this.labelEl = label({}, this.model.title)
    this.el.appendChild(this.labelEl)

    this.inputEl = input({type: "text", class: "bk-widget-form-input", disabled: this.model.disabled})
    this.el.appendChild(this.inputEl)

    this._picker = new Pikaday({
      field: this.inputEl,
      defaultDate: new Date(this.model.value),
      setDefaultDate: true,
      minDate: this.model.min_date != null ? new Date(this.model.min_date) : undefined,
      maxDate: this.model.max_date != null ? new Date(this.model.max_date) : undefined,
      onSelect: (date) => this._on_select(date),
    })

    // move date picker's element from body to bk-root
    this._root_element.appendChild(this._picker.el)
  }

  _on_select(date: Date): void {
    // Always use toDateString()!
    // toString() breaks the websocket #4965.
    // toISOString() returns the wrong day (IE on day earlier) #7048
    // XXX: this should be handled by the serializer
    this.model.value = date.toDateString()
    this.change_input()
  }
}

export namespace DatePicker {
  export interface Attrs extends InputWidget.Attrs {
    value:    string
    min_date: string
    max_date: string
  }

  export interface Props extends InputWidget.Props {}
}

export interface DatePicker extends DatePicker.Attrs {}

export class DatePicker extends InputWidget {

  properties: DatePicker.Props

  constructor(attrs?: Partial<DatePicker.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "DatePicker"
    this.prototype.default_view = DatePickerView

    this.define({
      // TODO (bev) types
      value:    [ p.Any, new Date().toDateString() ],
      min_date: [ p.Any                            ],
      max_date: [ p.Any                            ],
    })
  }
}

DatePicker.initClass()

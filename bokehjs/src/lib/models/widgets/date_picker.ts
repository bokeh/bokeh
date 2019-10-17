import {InputWidget, InputWidgetView} from "./input_widget"

import {input} from "core/dom"
import * as p from "core/properties"

import * as Pikaday from "pikaday"

import {bk_input} from "styles/widgets/inputs"
import "styles/widgets/pikaday"

Pikaday.prototype.adjustPosition = function(this: Pikaday & {_o: Pikaday.PikadayOptions}): void {
  if (this._o.container)
    return

  this.el.style.position = 'absolute'

  const field = this._o.trigger!
  const width = this.el.offsetWidth
  const height = this.el.offsetHeight
  const viewportWidth = window.innerWidth || document.documentElement!.clientWidth
  const viewportHeight = window.innerHeight || document.documentElement!.clientHeight
  const scrollTop = window.pageYOffset || document.body.scrollTop || document.documentElement!.scrollTop

  const clientRect = field.getBoundingClientRect()
  let left = clientRect.left + window.pageXOffset
  let top = clientRect.bottom + window.pageYOffset

  // adjust left/top origin to .bk-root
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

  protected input_el: HTMLInputElement

  private _picker: Pikaday

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  render(): void {
    if (this._picker != null)
      this._picker.destroy()

    super.render()

    this.input_el = input({type: "text", class: bk_input, disabled: this.model.disabled})
    this.group_el.appendChild(this.input_el)

    this._picker = new Pikaday({
      field: this.input_el,
      defaultDate: this._unlocal_date(new Date(this.model.value)),
      setDefaultDate: true,
      minDate: this.model.min_date != null ? this._unlocal_date(new Date(this.model.min_date)) : undefined,
      maxDate: this.model.max_date != null ? this._unlocal_date(new Date(this.model.max_date)) : undefined,
      onSelect: (date) => this._on_select(date),
    })

    this._root_element.appendChild(this._picker.el)
  }

  _unlocal_date(date: Date): Date {
    //Get the UTC offset (in minutes) of date (will be based on the timezone of the user's system).
    //Then multiply to get the offset in ms.
    //This way it can be used to recreate the user specified date, agnostic to their local systems's timezone.
    const timeOffsetInMS = date.getTimezoneOffset() * 60000
    date.setTime(date.getTime() - timeOffsetInMS)

    const datestr = date.toISOString().substr(0, 10)
    const tup = datestr.split('-')
    return new Date(Number(tup[0]), Number(tup[1])-1, Number(tup[2]))
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
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    value:    p.Property<string>
    min_date: p.Property<string>
    max_date: p.Property<string>
  }
}

export interface DatePicker extends DatePicker.Attrs {}

export class DatePicker extends InputWidget {
  properties: DatePicker.Props

  constructor(attrs?: Partial<DatePicker.Attrs>) {
    super(attrs)
  }

  static init_DatePicker(): void {
    this.prototype.default_view = DatePickerView

    this.define<DatePicker.Props>({
      // TODO (bev) types
      value:    [ p.Any, new Date().toDateString() ],
      min_date: [ p.Any                            ],
      max_date: [ p.Any                            ],
    })
  }
}

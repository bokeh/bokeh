import flatpickr from "flatpickr"

import {InputWidget, InputWidgetView} from "./input_widget"
import {input} from "core/dom"
import {CalendarPosition} from "core/enums"
import * as p from "core/properties"
import {isString} from "core/util/types"

import {bk_input} from "styles/widgets/inputs"
import flatpickr_css from "styles/widgets/flatpickr.css"

type DateStr = string
type DatesList = (DateStr | [DateStr, DateStr])[]

function _convert_date_list(value: DatesList): flatpickr.Options.DateLimit[] {
  const result: flatpickr.Options.DateLimit[] = []
  for (const item of value) {
    if (isString(item))
      result.push(item)
    else {
      const [from, to] = item
      result.push({from, to})
    }
  }
  return result
}

export class DatePickerView extends InputWidgetView {
  model: DatePicker

  private _picker: flatpickr.Instance

  connect_signals(): void {
    super.connect_signals()

    const {value, min_date, max_date, disabled_dates, enabled_dates, position, inline} = this.model.properties
    this.connect(value.change, () => this._picker?.setDate(value.value()))
    this.connect(min_date.change, () => this._picker?.set("minDate", min_date.value()))
    this.connect(max_date.change, () => this._picker?.set("maxDate", max_date.value()))
    this.connect(disabled_dates.change, () => this._picker?.set("disable", disabled_dates.value()))
    this.connect(enabled_dates.change, () => this._picker?.set("enable", enabled_dates.value()))
    this.connect(position.change, () => this._picker?.set("position", position.value()))
    this.connect(inline.change, () => this._picker?.set("inline", inline.value()))
  }

  remove(): void {
    this._picker?.destroy()
    super.remove()
  }

  styles(): string[] {
    return [...super.styles(), flatpickr_css]
  }

  render(): void {
    if (this._picker != null)
      return

    super.render()

    this.input_el = input({type: "text", class: bk_input, disabled: this.model.disabled})
    this.group_el.appendChild(this.input_el)
    this._picker = flatpickr(this.input_el, {
      defaultDate: this.model.value,
      minDate: this.model.min_date,
      maxDate: this.model.max_date,
      inline: this.model.inline,
      position: this.model.position,
      disable: _convert_date_list(this.model.disabled_dates),
      enable: _convert_date_list(this.model.enabled_dates),
      onChange: (selected_dates, date_string, instance) => this._on_change(selected_dates, date_string, instance),
    })
  }

  protected _on_change(_selected_dates: Date[], date_string: string, _instance: flatpickr.Instance): void {
    this.model.value = date_string
    this.change_input()
  }
}

export namespace DatePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    value:          p.Property<string>
    min_date:       p.Property<string>
    max_date:       p.Property<string>
    disabled_dates: p.Property<DatesList>
    enabled_dates:  p.Property<DatesList>
    position:       p.Property<CalendarPosition>
    inline:         p.Property<boolean>
  }
}

export interface DatePicker extends DatePicker.Attrs {}

export class DatePicker extends InputWidget {
  properties: DatePicker.Props
  __view_type__: DatePickerView

  constructor(attrs?: Partial<DatePicker.Attrs>) {
    super(attrs)
  }

  static init_DatePicker(): void {
    this.prototype.default_view = DatePickerView

    this.define<DatePicker.Props>({
      value:          [ p.Any                      ],
      min_date:       [ p.Any                      ],
      max_date:       [ p.Any                      ],
      disabled_dates: [ p.Any,              []     ],
      enabled_dates:  [ p.Any,              []     ],
      position:       [ p.CalendarPosition, "auto" ],
      inline:         [ p.Boolean,          false  ],
    })
  }
}

import flatpickr from "flatpickr"

import {InputWidget, InputWidgetView} from "./input_widget"
import {input} from "core/dom"
import {CalendarPosition} from "core/enums"
import * as p from "core/properties"
import {isString} from "core/util/types"

import * as inputs from "styles/widgets/inputs.css"
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
  override model: DatePicker

  private _picker?: flatpickr.Instance

  override connect_signals(): void {
    super.connect_signals()

    const {value, min_date, max_date, disabled_dates, enabled_dates, position, inline} = this.model.properties
    this.connect(value.change, () => this._picker?.setDate(this.model.value))
    this.connect(min_date.change, () => this._picker?.set("minDate", this.model.min_date))
    this.connect(max_date.change, () => this._picker?.set("maxDate", this.model.max_date))
    this.connect(disabled_dates.change, () => {
      const {disabled_dates} = this.model
      this._picker?.set("disable", disabled_dates != null ? _convert_date_list(disabled_dates) : undefined)
    })
    this.connect(enabled_dates.change, () => {
      const {enabled_dates} = this.model
      this._picker?.set("enable", enabled_dates != null ? _convert_date_list(enabled_dates) : undefined)
    })
    this.connect(position.change, () => this._picker?.set("position", this.model.position))
    this.connect(inline.change, () => this._picker?.set("inline", this.model.inline))
  }

  override remove(): void {
    this._picker?.destroy()
    super.remove()
  }

  override styles(): string[] {
    return [...super.styles(), flatpickr_css]
  }

  override render(): void {
    if (this._picker != null)
      return

    super.render()

    this.input_el = input({type: "text", class: inputs.input, disabled: this.model.disabled})
    this.group_el.appendChild(this.input_el)

    const options: flatpickr.Options.Options = {
      appendTo: this.group_el,
      positionElement: this.input_el,
      defaultDate: this.model.value,
      inline: this.model.inline,
      position: this.model.position,
      onChange: (selected_dates, date_string, instance) => this._on_change(selected_dates, date_string, instance),
    }

    const {min_date, max_date, disabled_dates, enabled_dates} = this.model
    if (min_date != null)
      options.minDate = min_date
    if (max_date != null)
      options.maxDate = max_date
    if (disabled_dates != null)
      options.disable = _convert_date_list(disabled_dates)
    if (enabled_dates != null)
      options.enable = _convert_date_list(enabled_dates)

    this._picker = flatpickr(this.input_el, options)
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
    min_date:       p.Property<string | null>
    max_date:       p.Property<string | null>
    disabled_dates: p.Property<DatesList | null>
    enabled_dates:  p.Property<DatesList | null>
    position:       p.Property<CalendarPosition>
    inline:         p.Property<boolean>
  }
}

export interface DatePicker extends DatePicker.Attrs {}

export class DatePicker extends InputWidget {
  override properties: DatePicker.Props
  override __view_type__: DatePickerView

  constructor(attrs?: Partial<DatePicker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DatePickerView

    this.define<DatePicker.Props>(({Boolean, String, Array, Tuple, Or, Nullable}) => {
      const DateStr = String
      const DatesList = Array(Or(DateStr, Tuple(DateStr, DateStr)))
      return {
        value:          [ String ],
        min_date:       [ Nullable(String), null ],
        max_date:       [ Nullable(String), null ],
        disabled_dates: [ Nullable(DatesList), null ],
        enabled_dates:  [ Nullable(DatesList), null ],
        position:       [ CalendarPosition, "auto" ],
        inline:         [ Boolean, false ],
      }
    })
  }
}

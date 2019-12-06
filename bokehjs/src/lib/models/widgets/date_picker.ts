import flatpickr from "flatpickr"

import {InputWidget, InputWidgetView} from "./input_widget"
import {input} from "core/dom"
import * as p from "core/properties"
import {bk_input} from "styles/widgets/inputs"
import "styles/widgets/flatpickr"

export class DatePickerView extends InputWidgetView {
  model: DatePicker

  protected input_el: HTMLInputElement

  private _picker: flatpickr.Instance

  connect_signals(): void {
    super.connect_signals()
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
      onChange: (selected_dates, date_string, instance) => this._on_change(selected_dates, date_string, instance),
    })
  }

  _on_change(_selected_dates: any, date_string: string, _instance: flatpickr.Instance): void {
    this.model.value = date_string
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
      value:    [ p.Any ],
      min_date: [ p.Any ],
      max_date: [ p.Any ],
    })
  }
}

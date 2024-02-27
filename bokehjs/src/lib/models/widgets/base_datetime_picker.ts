import type flatpickr from "flatpickr"

import {BaseDatePicker, BaseDatePickerView} from "./base_date_picker"
import {Clock} from "core/enums"
import type * as p from "core/properties"

export abstract class BaseDatetimePickerView extends BaseDatePickerView {
  declare model: BaseDatetimePicker

  override connect_signals(): void {
    super.connect_signals()

    const {
      value, hour_increment,
      minute_increment, second_increment, seconds, clock,
    } = this.model.properties

    this.connect(value.change, () => {
      const {value} = this.model
      if (value != null) {
        this.picker.setDate(value)
      } else {
        this.picker.clear()
      }
    })
    this.connect(hour_increment.change, () => this.picker.set("hourIncrement", this.model.hour_increment))
    this.connect(minute_increment.change, () => this.picker.set("minuteIncrement", this.model.minute_increment))
    this.connect(second_increment.change, () => this._update_second_increment())
    this.connect(seconds.change, () => this.picker.set("enableSeconds", this.model.seconds))
    this.connect(clock.change, () => this.picker.set("time_24hr", this.model.clock == "24h"))
  }

  protected override get flatpickr_options(): flatpickr.Options.Options {
    const {hour_increment, minute_increment, seconds, clock} = this.model

    const options = super.flatpickr_options
    options.enableTime = true
    options.dateFormat = "Y-m-dTH:i:S"

    options.hourIncrement = hour_increment
    options.minuteIncrement = minute_increment
    options.enableSeconds = seconds
    options.time_24hr = clock == "24h"

    return options
  }

  override render(): void {
    super.render()
    this._update_second_increment()
  }

  protected _update_second_increment(): void {
    const {second_increment} = this.model
    this.picker.secondElement?.setAttribute("step", second_increment.toString())
  }
}

export namespace BaseDatetimePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseDatePicker.Props & {
    hour_increment: p.Property<number>
    minute_increment: p.Property<number>
    second_increment: p.Property<number>
    seconds: p.Property<boolean>
    clock: p.Property<Clock>
  }
}

export interface BaseDatetimePicker extends BaseDatetimePicker.Attrs {}

export abstract class BaseDatetimePicker extends BaseDatePicker {
  declare properties: BaseDatetimePicker.Props
  declare __view_type__: BaseDatetimePickerView

  constructor(attrs?: Partial<BaseDatetimePicker.Attrs>) {
    super(attrs)
  }

  static {
    this.define<BaseDatetimePicker.Props>(({Bool, Positive, Int}) => ({
      hour_increment: [ Positive(Int), 1 ],
      minute_increment: [ Positive(Int), 1 ],
      second_increment: [ Positive(Int), 1 ],
      seconds: [ Bool, false ],
      clock: [ Clock, "24h" ],
    }))

    this.override<BaseDatetimePicker.Props>({
      date_format: "Y-m-d H:i",
    })
  }
}

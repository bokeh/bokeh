import type flatpickr from "flatpickr"

import {PickerBase, PickerBaseView} from "./picker_base"
import {Str, Float, Or} from "core/kinds"
import {Clock} from "core/enums"
import type * as p from "core/properties"
import {assert} from "core/util/assert"

export type TimeLike = typeof TimeLike["__type__"]
export const TimeLike = Or(Str, Float)

export class TimePickerView extends PickerBaseView {
  declare model: TimePicker

  protected _format_time(date: Date): string {
    const {picker} = this
    return picker.formatDate(date, picker.config.dateFormat)
  }

  override connect_signals(): void {
    super.connect_signals()

    const {
      value, min_time, max_time, time_format, hour_increment,
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
    this.connect(min_time.change, () => this.picker.set("minTime", this.model.min_time))
    this.connect(max_time.change, () => this.picker.set("maxTime", this.model.max_time))
    this.connect(time_format.change, () => this.picker.set("altFormat", this.model.time_format))
    this.connect(hour_increment.change, () => this.picker.set("hourIncrement", this.model.hour_increment))
    this.connect(minute_increment.change, () => this.picker.set("minuteIncrement", this.model.minute_increment))
    this.connect(second_increment.change, () => this._update_second_increment())
    this.connect(seconds.change, () => this.picker.set("enableSeconds", this.model.seconds))
    this.connect(clock.change, () => this.picker.set("time_24hr", this.model.clock == "24h"))
  }

  protected override get flatpickr_options(): flatpickr.Options.Options {
    const {value, min_time, max_time, time_format, hour_increment, minute_increment, seconds, clock} = this.model

    const options = super.flatpickr_options

    options.enableTime = true
    options.noCalendar = true

    options.altInput = true
    options.altFormat = time_format
    options.dateFormat = "H:i:S"

    options.hourIncrement = hour_increment
    options.minuteIncrement = minute_increment
    options.enableSeconds = seconds
    options.time_24hr = clock == "24h"

    if (value != null) {
      options.defaultDate = value
    }
    if (min_time != null) {
      options.minTime = min_time
    }
    if (max_time != null) {
      options.maxTime = max_time
    }

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

  protected _on_change(selected: Date[]): void {
    assert(selected.length <= 1)
    this.model.value = (() => {
      if (selected.length == 0) {
        return null
      } else {
        const [datetime] = selected
        return this._format_time(datetime)
      }
    })()
  }
}

export namespace TimePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = PickerBase.Props & {
    value: p.Property<TimeLike | null>
    min_time: p.Property<TimeLike | null>
    max_time: p.Property<TimeLike | null>
    time_format: p.Property<string>
    hour_increment: p.Property<number>
    minute_increment: p.Property<number>
    second_increment: p.Property<number>
    seconds: p.Property<boolean>
    clock: p.Property<Clock>
  }
}

export interface TimePicker extends TimePicker.Attrs {}

export class TimePicker extends PickerBase {
  declare properties: TimePicker.Props
  declare __view_type__: TimePickerView

  constructor(attrs?: Partial<TimePicker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TimePickerView

    this.define<TimePicker.Props>(({Bool, Str, Nullable, Positive, Int}) => ({
      value: [ Nullable(TimeLike), null ],
      min_time: [ Nullable(TimeLike), null ],
      max_time: [ Nullable(TimeLike), null ],
      time_format: [ Str, "H:i" ],
      hour_increment: [ Positive(Int), 1 ],
      minute_increment: [ Positive(Int), 1 ],
      second_increment: [ Positive(Int), 1 ],
      seconds: [ Bool, false ],
      clock: [ Clock, "24h" ],
    }))
  }
}

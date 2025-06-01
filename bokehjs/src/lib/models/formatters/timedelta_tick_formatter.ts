import {ContextWhich, Location, TimedeltaResolutionType} from "core/enums"
import type * as p from "core/properties"
import {assert} from "core/util/assert"
import {sprintf} from "core/util/templating"
import {isString, isArray, isBoolean, is_undefined} from "core/util/types"
import type {Arrayable} from "core/types"
import {TickFormatter} from "models/formatters/tick_formatter"
import {ONE_DAY, ONE_HOUR, ONE_MICRO, ONE_MILLI, ONE_MINUTE, ONE_NANO, ONE_SECOND} from "models/tickers/util"

export type {TimedeltaResolutionType} from "core/enums"

// Labels of time units, from finest to coarsest.
export const resolution_order: TimedeltaResolutionType[] = [
  "nanoseconds", "microseconds", "milliseconds", "seconds", "minsec", "minutes", "hourmin", "hours", "days",
]

export const formatting_map: {[template: string]: any} = {
  "%Nano": (t: number): string => _ns(t, 1_000),
  "%nano": (t: number): string => _ns(t, null),
  "%Micro": (t: number): string => _us(t, 1_000),
  "%micro": (t: number): string => _us(t, null),
  "%Milli": (t: number): string => _ms(t, 1_000),
  "%milli": (t: number): string => _ms(t, null),
  "%Second": (t: number): string => _seconds(t, 60),
  "%second": (t: number): string => _seconds(t, null),
  "%Minute": (t: number): string => _minutes(t, 60),
  "%minute": (t: number): string => _minutes(t, null),
  "%Hour": (t: number): string => _hours(t, 24),
  "%hour": (t: number): string => _hours(t, null),
  "%day": (t: number): string => _days(t, null),
}

export function _get_resolution(resolution_secs: number, span_secs: number): TimedeltaResolutionType {
  // Our resolution boundaries should not be round numbers, because we want
  // them to fall between the possible tick intervals (which *are* round
  // numbers, as we've worked hard to ensure). Consequently, we adjust the
  // resolution upwards a small amount (less than any possible step in
  // scales) to make the effective boundaries slightly lower.
  const adjusted_ms = resolution_secs * 1.1 * 1000
  const span_ms = span_secs * 1000

  if (adjusted_ms < ONE_MICRO) {
    return "nanoseconds"
  }

  if (adjusted_ms < ONE_MILLI) {
    return "microseconds"
  }

  if (adjusted_ms < ONE_SECOND) {
    return "milliseconds"
  }

  if (adjusted_ms < ONE_MINUTE) {
    return span_ms >= ONE_MINUTE ? "minsec"  : "seconds"
  }

  if (adjusted_ms < ONE_HOUR) {
    return span_ms >= ONE_HOUR ? "hourmin" : "minutes"
  }

  if (adjusted_ms < ONE_DAY) {
    return "hours"
  }

  return "days"
}

export function _str_timedelta(t: number, format: string): string {
  for (const [k, v] of Object.entries(formatting_map)) {
    const format_template = new RegExp(`((^|[^%])(%%)*)${k}`)
    if (format_template.test(format)) {
      format = format.replace(format_template, `$1${v(t)}`)
    }
  }
  return format
}

export function _days(t: number, factor_next: number | null): string {
  const days = _calc_tick_value(t, ONE_DAY, factor_next)
  return _str_tick_value(days, factor_next)
}

export function _hours(t: number, factor_next: number | null): string {
  const hours = _calc_tick_value(t, ONE_HOUR, factor_next)
  return _str_tick_value(hours, factor_next)
}

export function _minutes(t: number, factor_next: number | null): string {
  const minutes = _calc_tick_value(t, ONE_MINUTE, factor_next)
  return _str_tick_value(minutes, factor_next)
}

export function _seconds(t: number, factor_next: number | null): string {
  const seconds = _calc_tick_value(t, ONE_SECOND, factor_next)
  return _str_tick_value(seconds, factor_next)
}

export function _ms(t: number, factor_next: number | null): string {
  const millis = _calc_tick_value(t, ONE_MILLI, factor_next)
  return _str_tick_value(millis, factor_next)
}

export function _us(t: number, factor_next: number | null): string {
  const us = _calc_tick_value(t, ONE_MICRO, factor_next)
  return _str_tick_value(us, factor_next)
}

export function _ns(t: number, factor_next: number | null): string {
  const ns = _calc_tick_value(t, ONE_NANO, factor_next)
  return _str_tick_value(ns, factor_next)
}

function _str_tick_value(v: number, factor_next: number | null) {
  return factor_next !== null? sprintf(`%0${`${factor_next-1}`.length}d`, v) : String(v)
}

function _calc_tick_value(t: number, factor_transform: number, factor_next: number | null) {
  if (factor_next !== null) {
    return _time_since_last_next(t, factor_transform, factor_next)
  } else {
    return _time_total(t, factor_transform)
  }
}

function _time_since_last_next(t: number, factor_transform: number, factor_next: number): number {
  const millis_since_last_next = t % (factor_transform * factor_next)
  if (factor_transform < 1) {
    // sub milliseconds
    // account for floating point precision by rounding at nanoseconds level
    const nanos_since_last = Math.round(millis_since_last_next * 1_000_000)
    return (nanos_since_last / (factor_transform * 1_000_000)) % factor_next
  }
  return millis_since_last_next/factor_transform
}

function _time_total(t: number, factor_transform: number): number {
  return Math.floor(t/factor_transform)
}

export namespace TimedeltaTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
    nanoseconds: p.Property<string>
    microseconds: p.Property<string>
    milliseconds: p.Property<string>
    seconds: p.Property<string>
    minsec: p.Property<string>
    minutes: p.Property<string>
    hourmin: p.Property<string>
    hours: p.Property<string>
    days: p.Property<string>
    months: p.Property<string>
    years: p.Property<string>
    strip_leading_zeros: p.Property<boolean | Arrayable<TimedeltaResolutionType>>
    hide_repeats: p.Property<boolean>
    context: p.Property<string | TimedeltaTickFormatter | null>
    context_which: p.Property<ContextWhich>
    context_location: p.Property<Location>
  }
}

export interface TimedeltaTickFormatter extends TimedeltaTickFormatter.Attrs {}

export class TimedeltaTickFormatter extends TickFormatter {
  declare properties: TimedeltaTickFormatter.Props

  constructor(attrs?: Partial<TimedeltaTickFormatter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<TimedeltaTickFormatter.Props>(({Bool, Nullable, Or, Ref, Str, Arrayable}) => ({
      nanoseconds: [ Str, "" ],
      microseconds: [ Str, "" ],
      milliseconds: [ Str, "" ],
      seconds: [ Str, "" ],
      minsec: [ Str, "" ],
      minutes: [ Str, "" ],
      hourmin: [ Str, "" ],
      hours: [ Str, "" ],
      days: [ Str, "" ],
      strip_leading_zeros: [ Or(Bool, Arrayable(TimedeltaResolutionType)), false ],
      hide_repeats: [ Bool, false ],
      context: [ Nullable(Or(Str, Ref(TimedeltaTickFormatter))), null ],
      context_which: [ ContextWhich, "start" ],
      context_location: [ Location, "below" ],
    }))
  }

  doFormat(ticks: number[], _opts: {loc: number}, _resolution?: TimedeltaResolutionType): string[] {
    if (ticks.length == 0) {
      return []
    }

    const span = Math.abs(ticks[ticks.length-1] - ticks[0])/1000.0
    const r = span / (ticks.length - 1)
    const resolution = is_undefined(_resolution) ? _get_resolution(r, span) : _resolution

    let base_labels: string[] = []
    for (const tick of ticks) {
      const base_label = this._compute_label(tick, resolution)
      base_labels.push(base_label)
    }
    if (this.hide_repeats) {
      base_labels = this._hide_repeating_labels(base_labels)
    }

    if (this.context == null) {
      return base_labels
    }

    const context_labels = this._compute_context_labels(ticks, resolution)
    return this._build_full_labels(base_labels, context_labels)
  }

  _compute_label(t: number, resolution: TimedeltaResolutionType): string {
    const s0 = _str_timedelta(t, this[resolution])

    const {strip_leading_zeros} = this
    if ((isBoolean(strip_leading_zeros) && strip_leading_zeros) ||
        (isArray(strip_leading_zeros) && strip_leading_zeros.includes(resolution))) {
      const ss = s0.replace(/^0+/g, "")
      if (ss != s0 && !Number.isInteger(Number(ss[0]))) {
        // If the string can now be parsed as starting with an integer, then
        // leave all zeros stripped, otherwise start with a zero.
        return `0${ss}`
      }
      return ss
    }
    return s0
  }

  _compute_context_labels(ticks: number[], resolution: TimedeltaResolutionType): string[] {
    const {context} = this
    assert(context != null)

    const context_labels: string[] = []
    if (isString(context)) {
      for (const tick of ticks) {
        context_labels.push(_str_timedelta(tick, context))
      }
    } else {
      context_labels.push(...context.doFormat(ticks, {loc: 0}, resolution))
    }

    const which = this.context_which
    const N = context_labels.length
    for (let i=0; i<context_labels.length; i++) {
      if ((which == "start" && i != 0) ||
        (which == "end" && i != N-1) ||
        (which == "center" && i != Math.floor(N/2))) {
        context_labels[i] = ""
      }
    }
    return context_labels
  }

  _build_full_labels(base_labels: string[], context_labels: string[]): string[] {
    const loc = this.context_location
    const full_labels: string[] = []

    if (context_labels.every(v => v === "")) {
      return base_labels
    }

    for (let i=0; i<base_labels.length; i++) {
      const label = base_labels[i]
      const context = context_labels[i]

      // In case of above and below blank strings are not trimmed in order to
      // keep the same visual format across all ticks.
      const full_label = (() => {
        switch (loc) {
          case "above": return `${context}\n${label}`
          case "below": return `${label}\n${context}`
          case "left":  return context == "" ? label : `${context} ${label}`
          case "right": return context == "" ? label :`${label} ${context}`
        }
      })()
      full_labels.push(full_label)
    }
    return full_labels
  }

  _hide_repeating_labels(labels: string[]): string[] {
    // For repeating labels only utilize the first entry
    if (labels.length <= 1) {
      return labels
    }

    const labels_h: string[] = [labels[0]]
    let index_first_entry = 0
    for (let i=1; i<labels.length; i++) {
      if (labels[index_first_entry] == labels[i]) {
        labels_h.push("")
      } else {
        labels_h.push(labels[i])
        index_first_entry = i
      }
    }
    return labels_h
  }
}

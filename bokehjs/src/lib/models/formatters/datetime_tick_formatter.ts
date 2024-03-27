import {ContextWhich, Location, ResolutionType} from "core/enums"
import type * as p from "core/properties"
import {assert} from "core/util/assert"
import {sprintf} from "core/util/templating"
import {isString, isArray, isBoolean, is_undefined} from "core/util/types"
import type {Arrayable} from "core/types"
import {TickFormatter} from "models/formatters/tick_formatter"
import {ONE_DAY, ONE_HOUR, ONE_MILLI, ONE_MINUTE, ONE_MONTH, ONE_SECOND, ONE_YEAR} from "models/tickers/util"
import tz from "timezone"

export type {ResolutionType} from "core/enums"

// Labels of time units, from finest to coarsest.
export const resolution_order: ResolutionType[] = [
  "microseconds", "milliseconds", "seconds", "minsec", "minutes", "hourmin", "hours", "days", "months", "years",
]

// This dictionary maps the name of a time resolution (in @resolution_order)
// to its index in a time.localtime() time tuple. The default is to map
// everything to index 0, which is year. This is not ideal; it might cause
// a problem with the tick at midnight, january 1st, 0 a.d. being incorrectly
// promoted at certain tick resolutions.
export const tm_index_for_resolution: {[key in ResolutionType]: number} = {
  microseconds: 0,
  milliseconds: 0,
  seconds: 5,
  minsec: 4,
  minutes: 4,
  hourmin: 3,
  hours: 3,
  days: 0,
  months: 0,
  years: 0,
}

export function _get_resolution(resolution_secs: number, span_secs: number): ResolutionType {
  // Our resolution boundaries should not be round numbers, because we want
  // them to fall between the possible tick intervals (which *are* round
  // numbers, as we've worked hard to ensure). Consequently, we adjust the
  // resolution upwards a small amount (less than any possible step in
  // scales) to make the effective boundaries slightly lower.
  const adjusted_ms = resolution_secs * 1.1 * 1000
  const span_ms = span_secs * 1000

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

  if (adjusted_ms < ONE_MONTH) {
    return "days"
  }

  if (adjusted_ms < ONE_YEAR) {
    return "months"
  }

  return "years"
}

export function _mktime(t: number): number[] {
  return tz(t, "%Y %m %d %H %M %S").split(/\s+/).map(e => parseInt(e, 10))
}

export function _strftime(t: number, format: string): string {
  // Python's datetime library augments the microsecond directive %f, which is not
  // supported by the javascript library timezone: http://bigeasy.github.io/timezone/.
  // Use a regular expression to replace %f directive with microseconds.
  const microsecond_replacement_string = sprintf("$1%06d", _us(t))
  format = format.replace(/((^|[^%])(%%)*)%f/, microsecond_replacement_string)

  // timezone seems to ignore any strings without any formatting directives,
  // and just return the time argument back instead of the string argument.
  // But we want the string argument, in case a user supplies a format string
  // which doesn't contain a formatting directive or is only using %f.
  if (format.indexOf("%") == -1) {
    return format
  }

  return tz(t, format)
}

export function _us(t: number): number {
  // From double-precision unix (millisecond) timestamp, get microseconds since
  // last second. Precision seems to run out around the hundreds of nanoseconds
  // scale, so rounding to the nearest microsecond should round to a nice
  // microsecond / millisecond tick.
  // Note: for negative timestamps (pre epoch) the microsecond scale needs to be
  // inverted as we are counting backwards.
  let us = Math.round(((t / 1000) % 1) * 1000000)
  if (t < 0.0) {
    us = (1000000 + us) % 1000000
  }
  return us
}

export namespace DatetimeTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
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
    strip_leading_zeros: p.Property<boolean | Arrayable<ResolutionType>>
    boundary_scaling: p.Property<boolean>
    hide_repeats: p.Property<boolean>
    context: p.Property<string | DatetimeTickFormatter | null>
    context_which: p.Property<ContextWhich>
    context_location: p.Property<Location>
  }
}

export interface DatetimeTickFormatter extends DatetimeTickFormatter.Attrs {}

export class DatetimeTickFormatter extends TickFormatter {
  declare properties: DatetimeTickFormatter.Props

  constructor(attrs?: Partial<DatetimeTickFormatter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<DatetimeTickFormatter.Props>(({Bool, Nullable, Or, Ref, Str, Arrayable}) => ({
      microseconds: [ Str, "%fus" ],
      milliseconds: [ Str, "%3Nms" ],
      seconds: [ Str, "%Ss" ],
      minsec: [ Str, ":%M:%S" ],
      minutes: [ Str, ":%M" ],
      hourmin: [ Str, "%H:%M" ],
      hours: [ Str, "%Hh" ],
      days: [ Str, "%m/%d" ],
      months: [ Str, "%m/%Y" ],
      years: [ Str, "%Y" ],
      strip_leading_zeros: [ Or(Bool, Arrayable(ResolutionType)), false ],
      boundary_scaling: [ Bool, true ],
      hide_repeats: [ Bool, false ],
      context: [ Nullable(Or(Str, Ref(DatetimeTickFormatter))), null ],
      context_which: [ ContextWhich, "start" ],
      context_location: [ Location, "below" ],
    }))
  }

  doFormat(ticks: number[], _opts: {loc: number}, _resolution?: ResolutionType): string[] {
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

  _compute_label(t: number, resolution: ResolutionType): string {
    const s0 = _strftime(t, this[resolution])
    const tm = _mktime(t)
    const resolution_index = resolution_order.indexOf(resolution)
    let final_resolution = resolution
    let s = s0

    if (this.boundary_scaling) {
      let hybrid_handled = false
      let next_index = resolution_index
      let next_resolution = resolution

      // As we format each tick, check to see if we are at a boundary of the
      // next higher unit of time. If so, replace the current format with one
      // from that resolution. This is not the best heuristic but it works.
      while (tm[tm_index_for_resolution[resolution_order[next_index]]] == 0) {
        next_index += 1

        if (next_index == resolution_order.length) {
          break
        }

        // The way to check that we are at the boundary of the next unit of
        // time is by checking that we have 0 units of the resolution, i.e.
        // we are at zero minutes, so display hours, or we are at zero seconds,
        // so display minutes (and if that is zero as well, then display hours).
        if ((resolution == "minsec" || resolution == "hourmin") && !hybrid_handled) {
          if ((resolution == "minsec" && tm[4] == 0 && tm[5] != 0) || (resolution == "hourmin" && tm[3] == 0 && tm[4] != 0)) {
            next_resolution = resolution_order[resolution_index-1]
            s = _strftime(t, this[next_resolution])
            break
          } else {
            hybrid_handled = true
          }
        }

        next_resolution = resolution_order[next_index]
        s = _strftime(t, this[next_resolution])
      }
      final_resolution = next_resolution
    }

    const {strip_leading_zeros} = this
    if ((isBoolean(strip_leading_zeros) && strip_leading_zeros) ||
        (isArray(strip_leading_zeros) && strip_leading_zeros.includes(final_resolution))) {
      const ss = s.replace(/^0+/g, "")
      if (ss != s && !Number.isInteger(Number(ss[0]))) {
        // If the string can now be parsed as starting with an integer, then
        // leave all zeros stripped, otherwise start with a zero.
        return `0${ss}`
      }
      return ss
    }
    return s
  }

  _compute_context_labels(ticks: number[], resolution: ResolutionType): string[] {
    const {context} = this
    assert(context != null)

    const context_labels: string[] = []
    if (isString(context)) {
      for (const tick of ticks) {
        context_labels.push(_strftime(tick, context))
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

import {ContextWhich, Location, ResolutionType} from "core/enums"
import type * as p from "core/properties"
import {enumerate} from "core/util/iterator"
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
// to its index in a time.localtime() timetuple.  The default is to map
// everything to index 0, which is year.  This is not ideal; it might cause
// a problem with the tick at midnight, january 1st, 0 a.d. being incorrectly
// promoted at certain tick resolutions.
export const tm_index_for_resolution: Map<ResolutionType, number> = new Map()
for (const fmt of resolution_order) {
  tm_index_for_resolution.set(fmt, 0)
}
tm_index_for_resolution.set("seconds", 5)
tm_index_for_resolution.set("minsec", 4)
tm_index_for_resolution.set("minutes", 4)
tm_index_for_resolution.set("hourmin", 3)
tm_index_for_resolution.set("hours", 3)

export function _get_resolution(resolution_secs: number, span_secs: number): ResolutionType {
  // Our resolution boundaries should not be round numbers, because we want
  // them to fall between the possible tick intervals (which *are* round
  // numbers, as we've worked hard to ensure).  Consequently, we adjust the
  // resolution upwards a small amount (less than any possible step in
  // scales) to make the effective boundaries slightly lower.
  const adjusted_ms = resolution_secs * 1.1 * 1000
  const span_ms = span_secs * 1000

  if (adjusted_ms < ONE_MILLI)
    return "microseconds"

  if (adjusted_ms < ONE_SECOND)
    return "milliseconds"

  if (adjusted_ms < ONE_MINUTE)
    return span_ms >= ONE_MINUTE ? "minsec"  : "seconds"

  if (adjusted_ms < ONE_HOUR)
    return span_ms >= ONE_HOUR ? "hourmin" : "minutes"

  if (adjusted_ms < ONE_DAY)
    return "hours"

  if (adjusted_ms < ONE_MONTH)
    return "days"

  if (adjusted_ms < ONE_YEAR)
    return "months"

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
    this.define<DatetimeTickFormatter.Props>(({Boolean, Nullable, Or, Ref, String, Arrayable}) => ({
      microseconds: [ String, "%fus" ],
      milliseconds: [ String, "%3Nms" ],
      seconds: [ String, "%Ss" ],
      minsec: [ String, ":%M:%S" ],
      minutes: [ String, ":%M" ],
      hourmin: [ String, "%H:%M" ],
      hours: [ String, "%Hh" ],
      days: [ String, "%m/%d" ],
      months: [ String, "%m/%Y" ],
      years: [ String, "%Y" ],
      strip_leading_zeros: [ Or(Boolean, Arrayable(ResolutionType)), false ],
      context: [ Nullable(Or(String, Ref(DatetimeTickFormatter))), null ],
      context_which: [ ContextWhich, "start" ],
      context_location: [ Location, "below" ],
    }))
  }

  doFormat(ticks: number[], _opts: {loc: number}, _resolution?: ResolutionType): string[] {
    if (ticks.length == 0)
      return []

    const span = Math.abs(ticks[ticks.length-1] - ticks[0])/1000.0
    const r = span / (ticks.length - 1)
    const resolution = is_undefined(_resolution) ? _get_resolution(r, span) : _resolution

    const labels: string[] = []
    for (const [tick, i] of enumerate(ticks)) {
      const base_label = this._compute_label(tick, resolution)
      const full_label = this._add_context(tick, base_label, i, ticks.length, resolution)
      labels.push(full_label)
    }
    return labels
  }

  _compute_label(t: number, resolution: ResolutionType): string {
    const s0 = _strftime(t, this[resolution])
    const tm = _mktime(t)
    const resolution_index = resolution_order.indexOf(resolution)

    let s = s0
    let hybrid_handled = false
    let next_index = resolution_index
    let next_resolution = resolution

    // As we format each tick, check to see if we are at a boundary of the
    // next higher unit of time. If so, replace the current format with one
    // from that resolution. This is not the best heuristic but it works.
    while (tm[tm_index_for_resolution.get(resolution_order[next_index])!] == 0) {
      next_index += 1

      if (next_index == resolution_order.length)
        break

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

    const final_resolution = next_resolution
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

  _add_context(tick: number, label: string, i: number, N: number, resolution: ResolutionType): string {
    const loc = this.context_location
    const which = this.context_which

    if (this.context == null)
      return label

    if ((which == "start" && i == 0) ||
        (which == "end" && i == N-1) ||
        (which == "center" && i == Math.floor(N/2)) ||
        (which == "all")) {

      const context = isString(this.context) ?
        _strftime(tick, this.context) : this.context.doFormat([tick], {loc: 0}, resolution)[0]

      if (context == "")
        return label

      switch (loc) {
        case "above": return `${context}\n${label}`
        case "below": return `${label}\n${context}`
        case "left":  return `${context} ${label}`
        case "right": return `${label} ${context}`
      }
    }
    return label
  }

}

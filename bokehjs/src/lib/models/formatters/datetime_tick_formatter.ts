import tz from "timezone"

import {TickFormatter} from "./tick_formatter"
import {logger} from "core/logging"
import * as p from "core/properties"
import {sprintf} from "core/util/templating"

function _us(t: number): number {
  // From double-precision unix (millisecond) timestamp get
  // microsecond since last second. Precision seems to run
  // out around the hundreds of nanoseconds scale, so rounding
  // to the nearest microsecond should round to a nice
  // microsecond / millisecond tick.
  return Math.round(((t / 1000) % 1) * 1000000)
}

function _array(t: number): number[] {
  return tz(t, "%Y %m %d %H %M %S").split(/\s+/).map(e => parseInt(e, 10))
}

function _strftime(t: number, format: string): string {
  // Python's datetime library augments the microsecond directive %f, which is not
  // supported by the javascript library timezone: http://bigeasy.github.io/timezone/.
  // Use a regular expression to replace %f directive with microseconds.
  // TODO: what should we do for negative microsecond strings?
  const microsecond_replacement_string = sprintf("$1%06d", _us(t))
  format = format.replace(/((^|[^%])(%%)*)%f/, microsecond_replacement_string)

  if (format.indexOf("%") == -1) {
    // timezone seems to ignore any strings without any formatting directives,
    // and just return the time argument back instead of the string argument.
    // But we want the string argument, in case a user supplies a format string
    // which doesn't contain a formatting directive or is only using %f.
    return format
  }

  return tz(t, format)
}

type FormatType = "microseconds" | "milliseconds" | "seconds" | "minsec" | "minutes" | "hourmin" | "hours" | "days" | "months" | "years"

// Labels of time units, from finest to coarsest.
const format_order: FormatType[] = [
  "microseconds", "milliseconds", "seconds", "minsec", "minutes", "hourmin", "hours", "days", "months", "years",
]

// This dictionary maps the name of a time resolution (in @format_order)
// to its index in a time.localtime() timetuple.  The default is to map
// everything to index 0, which is year.  This is not ideal; it might cause
// a problem with the tick at midnight, january 1st, 0 a.d. being incorrectly
// promoted at certain tick resolutions.
const time_tuple_ndx_for_resol: Map<FormatType, number> = new Map()
for (const fmt of format_order) {
  time_tuple_ndx_for_resol.set(fmt, 0)
}
time_tuple_ndx_for_resol.set("seconds", 5)
time_tuple_ndx_for_resol.set("minsec", 4)
time_tuple_ndx_for_resol.set("minutes", 4)
time_tuple_ndx_for_resol.set("hourmin", 3)
time_tuple_ndx_for_resol.set("hours", 3)

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
    strip_leading_zeros: p.Property<boolean>
  }
}

export interface DatetimeTickFormatter extends DatetimeTickFormatter.Attrs {}

export class DatetimeTickFormatter extends TickFormatter {
  override properties: DatetimeTickFormatter.Props

  constructor(attrs?: Partial<DatetimeTickFormatter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<DatetimeTickFormatter.Props>(({Boolean, String}) => ({
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
      strip_leading_zeros: [Boolean, true],
    }))
  }

  override initialize(): void {
    super.initialize()
  }

  protected _get_resolution_str(resolution_secs: number, span_secs: number): FormatType {
    // Our resolution boundaries should not be round numbers, because we want
    // them to fall between the possible tick intervals (which *are* round
    // numbers, as we've worked hard to ensure).  Consequently, we adjust the
    // resolution upwards a small amount (less than any possible step in
    // scales) to make the effective boundaries slightly lower.
    const adjusted_secs = resolution_secs * 1.1

    switch (false) {
      case !(adjusted_secs < 1e-3):          return "microseconds"
      case !(adjusted_secs < 1.0):           return "milliseconds"
      case !(adjusted_secs < 60):            return span_secs >= 60   ? "minsec"  : "seconds"
      case !(adjusted_secs < 3600):          return span_secs >= 3600 ? "hourmin" : "minutes"
      case !(adjusted_secs < (24*3600)):     return "hours"
      case !(adjusted_secs < (31*24*3600)):  return "days"
      case !(adjusted_secs < (365*24*3600)): return "months"
      default:                               return "years"
    }
  }

  doFormat(ticks: number[], _opts: {loc: number}): string[] {
    // In order to pick the right set of labels, we need to determine
    // the resolution of the ticks.  We can do this using a ticker if
    // it's provided, or by computing the resolution from the actual
    // ticks we've been given.
    if (ticks.length == 0)
      return []

    const labels: string[] = []

    const span = Math.abs(ticks[ticks.length-1] - ticks[0])/1000.0
    const r = span / (ticks.length - 1)
    const resol = this._get_resolution_str(r, span)
    const resol_ndx = format_order.indexOf(resol)

    // As we format each tick, check to see if we are at a boundary of the
    // next higher unit of time.  If so, replace the current format with one
    // from that resolution.  This is not the best heuristic in the world,
    // but it works!  There is some trickiness here due to having to deal
    // with hybrid formats in a reasonable manner.
    for (const t of ticks) {
      let s, tm
      try {
        tm = _array(t)
        s = _strftime(t, this[resol])
      } catch (error) {
        logger.warn(`unable to format tick for timestamp value ${t} - ${error}`)
        labels.push("ERR")
        continue
      }

      let hybrid_handled = false
      let next_ndx = resol_ndx

      // The way to check that we are at the boundary of the next unit of
      // time is by checking that we have 0 units of the resolution, i.e.
      // we are at zero minutes, so display hours, or we are at zero seconds,
      // so display minutes (and if that is zero as well, then display hours).
      while (tm[time_tuple_ndx_for_resol.get(format_order[next_ndx])!] == 0) {
        let next_format: FormatType
        next_ndx += 1

        if (next_ndx == format_order.length)
          break

        if ((resol == "minsec" || resol == "hourmin") && !hybrid_handled) {
          if ((resol == "minsec" && tm[4] == 0 && tm[5] != 0) || (resol == "hourmin" && tm[3] == 0 && tm[4] != 0)) {
            next_format = format_order[resol_ndx-1]
            s = _strftime(t, this[next_format])
            break
          } else {
            hybrid_handled = true
          }
        }

        next_format = format_order[next_ndx]
        s = _strftime(t, this[next_format])
      }

      const final = (() => {
        if (this.strip_leading_zeros) {
          const ss = s.replace(/^0+/g, "")
          if (ss != s && isNaN(parseInt(ss))) {
            // If the string can now be parsed as starting with an integer, then
            // leave all zeros stripped, otherwise start with a zero. Hence:
            // A label such as '000ms' should leave one zero.
            // A label such as '001ms' or '0-1ms' should not leave a leading zero.
            return `0${ss}`
          }
          return ss
        }
        return s
      })()

      labels.push(final)
    }

    return labels
  }
}

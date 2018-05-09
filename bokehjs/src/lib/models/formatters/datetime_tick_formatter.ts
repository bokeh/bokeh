import {sprintf} from "sprintf-js"
import tz = require("timezone")

import {TickFormatter} from "./tick_formatter"
import {Axis} from "../axes/axis"
import {logger} from "core/logging"
import * as p from "core/properties"
import {zip, unzip, sortBy} from "core/util/array"
import {isFunction} from "core/util/types"

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

function _strftime(t: number, format: string | ((t: number) => string)): string {
  if (isFunction(format)) {
    return format(t)
  } else {
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
}

// Labels of time units, from finest to coarsest.
const format_order = [
  'microseconds', 'milliseconds', 'seconds', 'minsec', 'minutes', 'hourmin', 'hours', 'days', 'months', 'years',
]

export namespace DatetimeTickFormatter {
  export interface Attrs extends TickFormatter.Attrs {
    microseconds: string[]
    milliseconds: string[]
    seconds: string[]
    minsec: string[]
    minutes: string[]
    hourmin: string[]
    hours: string[]
    days: string[]
    months: string[]
    years: string[]
  }

  export interface Props extends TickFormatter.Props {}
}

export interface DatetimeTickFormatter extends DatetimeTickFormatter.Attrs {}

export class DatetimeTickFormatter extends TickFormatter {

  properties: DatetimeTickFormatter.Props

  constructor(attrs?: Partial<DatetimeTickFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'DatetimeTickFormatter'

    this.define({
      microseconds: [ p.Array, ['%fus'] ],
      milliseconds: [ p.Array, ['%3Nms', '%S.%3Ns'] ],
      seconds:      [ p.Array, ['%Ss'] ],
      minsec:       [ p.Array, [':%M:%S'] ],
      minutes:      [ p.Array, [':%M', '%Mm'] ],
      hourmin:      [ p.Array, ['%H:%M'] ],
      hours:        [ p.Array, ['%Hh', '%H:%M'] ],
      days:         [ p.Array, ['%m/%d', '%a%d'] ],
      months:       [ p.Array, ['%m/%Y', '%b %Y'] ],
      years:        [ p.Array, ['%Y'] ],
    })
  }

  // Whether or not to strip the leading zeros on tick labels.
  protected strip_leading_zeros = true
  protected _width_formats: {[key: string]: [number[], string[]]}

  initialize(): void {
    super.initialize()
    // TODO (bev) trigger update on format change
    this._update_width_formats()
  }

  protected _update_width_formats(): void {
    const now = +tz(new Date())

    const _widths = function(fmt_strings: string[]): [number[], string[]] {
      const sizes = fmt_strings.map((fmt_string) => _strftime(now, fmt_string).length)
      const sorted = sortBy(zip(sizes, fmt_strings), ([size]) => size)
      return unzip(sorted)
    }

    this._width_formats = {
      microseconds: _widths(this.microseconds),
      milliseconds: _widths(this.milliseconds),
      seconds:      _widths(this.seconds),
      minsec:       _widths(this.minsec),
      minutes:      _widths(this.minutes),
      hourmin:      _widths(this.hourmin),
      hours:        _widths(this.hours),
      days:         _widths(this.days),
      months:       _widths(this.months),
      years:        _widths(this.years),
    }
  }

  // FIXME There is some unfortunate flicker when panning/zooming near the
  // span boundaries.
  // FIXME Rounding is weird at the 20-us scale and below.
  protected _get_resolution_str(resolution_secs: number, span_secs: number): string {
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

  doFormat(ticks: number[], _axis: Axis): string[] {
    // In order to pick the right set of labels, we need to determine
    // the resolution of the ticks.  We can do this using a ticker if
    // it's provided, or by computing the resolution from the actual
    // ticks we've been given.
    if (ticks.length == 0)
      return []

    const span = Math.abs(ticks[ticks.length-1] - ticks[0])/1000.0
    const r = span / (ticks.length - 1)
    const resol = this._get_resolution_str(r, span)

    const [, [format]] = this._width_formats[resol]

    // Apply the format to the tick values
    const labels: string[] = []
    const resol_ndx = format_order.indexOf(resol)

    // This dictionary maps the name of a time resolution (in @format_order)
    // to its index in a time.localtime() timetuple.  The default is to map
    // everything to index 0, which is year.  This is not ideal; it might cause
    // a problem with the tick at midnight, january 1st, 0 a.d. being incorrectly
    // promoted at certain tick resolutions.
    const time_tuple_ndx_for_resol: {[key: string]: number} = {}
    for (const fmt of format_order) {
      time_tuple_ndx_for_resol[fmt] = 0
    }
    time_tuple_ndx_for_resol["seconds"] = 5
    time_tuple_ndx_for_resol["minsec"] = 4
    time_tuple_ndx_for_resol["minutes"] = 4
    time_tuple_ndx_for_resol["hourmin"] = 3
    time_tuple_ndx_for_resol["hours"] = 3

    // As we format each tick, check to see if we are at a boundary of the
    // next higher unit of time.  If so, replace the current format with one
    // from that resolution.  This is not the best heuristic in the world,
    // but it works!  There is some trickiness here due to having to deal
    // with hybrid formats in a reasonable manner.
    for (const t of ticks) {
      let s, tm
      try {
        tm = _array(t)
        s = _strftime(t, format)
      } catch (error) {
        logger.warn(`unable to format tick for timestamp value ${t}`)
        logger.warn(` - ${error}`)
        labels.push("ERR")
        continue
      }

      let hybrid_handled = false
      let next_ndx = resol_ndx

      // The way to check that we are at the boundary of the next unit of
      // time is by checking that we have 0 units of the resolution, i.e.
      // we are at zero minutes, so display hours, or we are at zero seconds,
      // so display minutes (and if that is zero as well, then display hours).
      while (tm[time_tuple_ndx_for_resol[format_order[next_ndx]]] == 0) {
        let next_format
        next_ndx += 1

        if (next_ndx == format_order.length)
          break

        if ((resol == "minsec" || resol == "hourmin") && !hybrid_handled) {
          if ((resol == "minsec" && tm[4] == 0 && tm[5] != 0) || (resol == "hourmin" && tm[3] == 0 && tm[4] != 0)) {
            next_format = this._width_formats[format_order[resol_ndx-1]][1][0]
            s = _strftime(t, next_format)
            break
          } else {
            hybrid_handled = true
          }
        }

        next_format = this._width_formats[format_order[next_ndx]][1][0]
        s = _strftime(t, next_format)
      }

      // TODO: should expose this in api. %H, %d, etc use leading zeros and
      // users might prefer to see them lined up correctly.
      if (this.strip_leading_zeros) {
        let ss = s.replace(/^0+/g, "")
        if (ss != s && isNaN(parseInt(ss))) {
          // If the string can now be parsed as starting with an integer, then
          // leave all zeros stripped, otherwise start with a zero. Hence:
          // A label such as '000ms' should leave one zero.
          // A label such as '001ms' or '0-1ms' should not leave a leading zero.
          ss = `0${ss}`
        }
        labels.push(ss)
      } else
        labels.push(s)
    }

    return labels
  }
}
DatetimeTickFormatter.initClass()

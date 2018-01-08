import {sprintf} from "sprintf-js"
import * as tz from "timezone"

import {TickFormatter} from "./tick_formatter"
import {logger} from "core/logging"
import * as p from "core/properties"
import {zip, unzip, sortBy} from "core/util/array"
import {isFunction} from "core/util/types"

_us = (t) ->
  # From double-precision unix (millisecond) timestamp get
  # microsecond since last second. Precision seems to run
  # out around the hundreds of nanoseconds scale, so rounding
  # to the nearest microsecond should round to a nice
  # microsecond / millisecond tick.
  return Math.round(((t / 1000) % 1) * 1000000)

_array = (t) ->
  return tz(t, "%Y %m %d %H %M %S").split(/\s+/).map( (e) -> return parseInt(e, 10) );

_strftime = (t, format) ->
  if isFunction(format)
    return format(t)
  else
    # Python's datetime library augments the microsecond directive %f, which is not
    # supported by the javascript library timezone: http://bigeasy.github.io/timezone/.
    # Use a regular expression to replace %f directive with microseconds.
    # TODO: what should we do for negative microsecond strings?
    microsecond_replacement_string = sprintf("$1%06d", _us(t))
    format = format.replace(/((^|[^%])(%%)*)%f/, microsecond_replacement_string)

    if format.indexOf("%") == -1
      # timezone seems to ignore any strings without any formatting directives,
      # and just return the time argument back instead of the string argument.
      # But we want the string argument, in case a user supplies a format string
      # which doesn't contain a formatting directive or is only using %f.
      return format
    return tz(t, format)

export class DatetimeTickFormatter extends TickFormatter
  type: 'DatetimeTickFormatter'

  @define {
    microseconds: [ p.Array, ['%fus'] ]
    milliseconds: [ p.Array, ['%3Nms', '%S.%3Ns'] ]
    seconds:      [ p.Array, ['%Ss'] ]
    minsec:       [ p.Array, [':%M:%S'] ]
    minutes:      [ p.Array, [':%M', '%Mm'] ]
    hourmin:      [ p.Array, ['%H:%M'] ]
    hours:        [ p.Array, ['%Hh', '%H:%M'] ]
    days:         [ p.Array, ['%m/%d', '%a%d'] ]
    months:       [ p.Array, ['%m/%Y', '%b%y'] ]
    years:        [ p.Array, ['%Y'] ]
  }

  # Labels of time units, from finest to coarsest.
  format_order: [
    'microseconds', 'milliseconds', 'seconds', 'minsec', 'minutes', 'hourmin', 'hours', 'days', 'months', 'years'
  ]

  # Whether or not to strip the leading zeros on tick labels.
  strip_leading_zeros: true

  initialize: (attrs, options) ->
    super(attrs, options)
    # TODO (bev) trigger update on format change
    @_update_width_formats()

  _update_width_formats: () ->
    now = tz(new Date())

    _widths = (fmt_strings) ->
      sizes = (_strftime(now, fmt_string).length for fmt_string in fmt_strings)
      sorted = sortBy(zip(sizes, fmt_strings), ([size, fmt]) -> size)
      return unzip(sorted)

    @_width_formats = {
      microseconds: _widths(@microseconds)
      milliseconds: _widths(@milliseconds)
      seconds:      _widths(@seconds)
      minsec:       _widths(@minsec)
      minutes:      _widths(@minutes)
      hourmin:      _widths(@hourmin)
      hours:        _widths(@hours)
      days:         _widths(@days)
      months:       _widths(@months)
      years:        _widths(@years)
    }

  # FIXME There is some unfortunate flicker when panning/zooming near the
  # span boundaries.
  # FIXME Rounding is weird at the 20-us scale and below.
  _get_resolution_str: (resolution_secs, span_secs) ->
    # Our resolution boundaries should not be round numbers, because we want
    # them to fall between the possible tick intervals (which *are* round
    # numbers, as we've worked hard to ensure).  Consequently, we adjust the
    # resolution upwards a small amount (less than any possible step in
    # scales) to make the effective boundaries slightly lower.
    adjusted_secs = resolution_secs * 1.1

    return switch
      when adjusted_secs < 1e-3        then "microseconds"
      when adjusted_secs < 1.0         then "milliseconds"
      when adjusted_secs < 60          then (if span_secs >= 60   then "minsec"  else "seconds")
      when adjusted_secs < 3600        then (if span_secs >= 3600 then "hourmin" else "minutes")
      when adjusted_secs < 24*3600     then "hours"
      when adjusted_secs < 31*24*3600  then "days"
      when adjusted_secs < 365*24*3600 then "months"
      else                                  "years"

  # TODO (bev) remove these unused "default" params and associated logic
  doFormat: (ticks, axis, num_labels=null, char_width=null, fill_ratio=0.3, ticker=null) ->

    # In order to pick the right set of labels, we need to determine
    # the resolution of the ticks.  We can do this using a ticker if
    # it's provided, or by computing the resolution from the actual
    # ticks we've been given.
    if ticks.length == 0
        return []

    span = Math.abs(ticks[ticks.length-1] - ticks[0])/1000.0
    if ticker
      r = ticker.resolution
    else
      r = span / (ticks.length - 1)
    resol = @_get_resolution_str(r, span)

    [widths, formats] = @_width_formats[resol]
    format = formats[0]
    # FIXME I'm pretty sure this code won't work; luckily it doesn't seem to
    # be used.
    if char_width
      # If a width is provided, then we pick the most appropriate scale,
      # otherwise just use the widest format
      good_formats = []
      for i in [0...widths.length]
        if widths[i] * ticks.length < fill_ratio * char_width
          good_formats.push(@_width_formats[i])
      if good_formats.length > 0
        format = good_formats[good_formats.length-1]

    # Apply the format to the tick values
    labels = []
    resol_ndx = @format_order.indexOf(resol)

    # This dictionary maps the name of a time resolution (in @format_order)
    # to its index in a time.localtime() timetuple.  The default is to map
    # everything to index 0, which is year.  This is not ideal; it might cause
    # a problem with the tick at midnight, january 1st, 0 a.d. being incorrectly
    # promoted at certain tick resolutions.
    time_tuple_ndx_for_resol = {}
    for fmt in @format_order
      time_tuple_ndx_for_resol[fmt] = 0
    time_tuple_ndx_for_resol["seconds"] = 5
    time_tuple_ndx_for_resol["minsec"] = 4
    time_tuple_ndx_for_resol["minutes"] = 4
    time_tuple_ndx_for_resol["hourmin"] = 3
    time_tuple_ndx_for_resol["hours"] = 3

    # As we format each tick, check to see if we are at a boundary of the
    # next higher unit of time.  If so, replace the current format with one
    # from that resolution.  This is not the best heuristic in the world,
    # but it works!  There is some trickiness here due to having to deal
    # with hybrid formats in a reasonable manner.
    for t in ticks
      try
        tm = _array(t)
        s = _strftime(t, format)
      catch error
        logger.warn("unable to format tick for timestamp value #{t}")
        logger.warn(" - #{error}")
        labels.push("ERR")
        continue

      hybrid_handled = false
      next_ndx = resol_ndx

      # The way to check that we are at the boundary of the next unit of
      # time is by checking that we have 0 units of the resolution, i.e.
      # we are at zero minutes, so display hours, or we are at zero seconds,
      # so display minutes (and if that is zero as well, then display hours).
      while tm[ time_tuple_ndx_for_resol[@format_order[next_ndx]] ] == 0
        next_ndx += 1
        if next_ndx == @format_order.length
          break
        if resol in ["minsec", "hourmin"] and not hybrid_handled
          if (resol == "minsec" and tm[4] == 0 and tm[5] != 0) or (resol == "hourmin" and tm[3] == 0 and tm[4] != 0)
            next_format = @_width_formats[@format_order[resol_ndx-1]][1][0]
            s = _strftime(t, next_format)
            break
          else
            hybrid_handled = true

        next_format = @_width_formats[@format_order[next_ndx]][1][0]
        s = _strftime(t, next_format)

      # TODO: should expose this in api. %H, %d, etc use leading zeros and
      # users might prefer to see them lined up correctly.
      if @strip_leading_zeros
        ss = s.replace(/^0+/g, "")
        if ss != s and isNaN(parseInt(ss))
          # If the string can now be parsed as starting with an integer, then
          # leave all zeros stripped, otherwise start with a zero. Hence:
          # A label such as '000ms' should leave one zero.
          # A label such as '001ms' or '0-1ms' should not leave a leading zero.
          ss = '0' + ss
        labels.push(ss)
      else
        labels.push(s)

    return labels

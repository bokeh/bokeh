define [
  "underscore"
  "common/collection"
  "sprintf"
  "timezone"
  "common/has_properties"
  "common/logging"
], (_, Collection, SPrintf, tz, HasProperties, Logging) ->

  logger = Logging.logger

  _us = (t) ->
    return SPrintf.sprintf("%3dus", Math.floor((t % 1) * 1000))

  _ms_dot_us = (t) ->
    ms = Math.floor(((t / 1000) % 1) * 1000)
    us = Math.floor((t % 1) * 1000)
    return SPrintf.sprintf("%3d.%3dms", ms, us)

  _two_digit_year = (t) ->
    # Round to the nearest Jan 1, roughly.
    dt = new Date(t)
    year = dt.getFullYear()
    if dt.getMonth() >= 7
        year += 1
    return SPrintf.sprintf("'%02d", (year % 100))

  _four_digit_year = (t) ->
    # Round to the nearest Jan 1, roughly.
    dt = new Date(t)
    year = dt.getFullYear()
    if dt.getMonth() >= 7
        year += 1
    return SPrintf.sprintf("%d", year)

  _array = (t) ->
    return tz(t, "%Y %m %d %H %M %S").split(/\s+/).map( (e) -> return parseInt(e, 10) );

  _strftime = (t, format) ->
    if _.isFunction(format)
      return format(t)
    else
      return tz(t, format)

  class DatetimeTickFormatter extends HasProperties
    type: 'DatetimeTickFormatter'

    # Labels of time units, from finest to coarsest.
    format_order: [
      'microseconds', 'milliseconds', 'seconds', 'minsec', 'minutes', 'hourmin', 'hours', 'days', 'months', 'years'
    ]

    # This table of formats is convert into the 'formats' dict.
    _formats: {
      'microseconds': [_us, _ms_dot_us]
      'milliseconds': ['%3Nms', '%S.%3Ns']
      'seconds':      ['%Ss']
      'minsec':       [':%M:%S']
      'minutes':      [':%M', '%Mm']
      'hourmin':      ['%H:%M']
      'hours':        ['%Hh', '%H:%M']
      'days':         ['%m/%d', '%a%d']
      'months':       ['%m/%Y', '%b%y']
      'years':        ['%Y', _two_digit_year, _four_digit_year]
    }

    # Whether or not to strip the leading zeros on tick labels.
    strip_leading_zeros: true

    initialize: (attrs, options) ->
      super(attrs, options)

      fmt = _.extend({}, @_formats, @get("formats"))
      now = tz(new Date())
      @formats = {}

      for fmt_name, fmt_strings of fmt
        sizes = (_strftime(now, fmt_string).length for fmt_string in fmt_strings)
        sorted = _.sortBy(_.zip(sizes, fmt_strings), ([size, fmt]) -> size)
        @formats[fmt_name] = _.zip.apply(_, sorted)

    # FIXME There is some unfortunate flicker when panning/zooming near the
    # span boundaries.
    # FIXME Rounding is weird at the 20-us scale and below.
    _get_resolution_str: (resolution_secs, span_secs) ->
      # Our resolution boundaries should not be round numbers, because we want
      # them to fall between the possible tick intervals (which *are* round
      # numbers, as we've worked hard to ensure).  Consequently, we adjust the
      # resolution upwards a small amount (less than any possible step in
      # scales) to make the effective boundaries slightly lower.
      adjusted_resolution_secs = resolution_secs * 1.1

      if adjusted_resolution_secs < 1e-3
        str = "microseconds"
      else if adjusted_resolution_secs < 1.0
        str = "milliseconds"
      else if adjusted_resolution_secs < 60
        if span_secs >= 60
          str = "minsec"
        else
          str = "seconds"
      else if adjusted_resolution_secs < 3600
        if span_secs >= 3600
          str = "hourmin"
        else
          str = "minutes"
      else if adjusted_resolution_secs < 24*3600
        str = "hours"
      else if adjusted_resolution_secs < 31*24*3600
        str = "days"
      else if adjusted_resolution_secs < 365*24*3600
        str = "months"
      else
        str = "years"
      return str

    format: (ticks, num_labels=null, char_width=null, fill_ratio=0.3, ticker=null) ->

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

      [widths, formats] = @formats[resol]
      format = formats[0]
      # FIXME I'm pretty sure this code won't work; luckily it doesn't seem to
      # be used.
      if char_width
        # If a width is provided, then we pick the most appropriate scale,
        # otherwise just use the widest format
        good_formats = []
        for i in [0...widths.length]
          if widths[i] * ticks.length < fill_ratio * char_width
            # FIXME I think "@formats" should be "formats".  (Perhaps they
            # should have more distinct names.)
            good_formats.push(@formats[i])
        if good_formats.length > 0
          format = _.last(good_formats)

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
              next_format = @formats[@format_order[resol_ndx-1]][1][0]
              s = _strftime(t, next_format)
              break
            else
              hybrid_handled = true

          next_format = @formats[@format_order[next_ndx]][1][0]
          s = _strftime(t, next_format)

        if @strip_leading_zeros
          ss = s.replace(/^0+/g, "")
          if ss != s and (ss == '' or not isFinite(ss[0]))
            # A label such as '000ms' should leave one zero.
            ss = '0' + ss
          labels.push(ss)
        else
          labels.push(s)

      return labels

    defaults: ->
      return _.extend {}, super(), {
        formats: {}
      }

  class DatetimeTickFormatters extends Collection
    model: DatetimeTickFormatter

  return {
    "Model": DatetimeTickFormatter,
    "Collection": new DatetimeTickFormatters()
  }



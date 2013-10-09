
sprintf = window.sprintf
tz = window.tz

log10 = (num) ->
  """
  Returns the base 10 logarithm of a number.
  """

  # prevent errors when log is 0
  if num == 0.0
    num += 1.0e-16

  return Math.log(num) / Math.LN10


log2 = (num) ->
    """
    Returns the base 2 logarithm of a number.
    """

    # prevent errors when log is 0
    if num == 0.0
        num += 1.0e-16

    return Math.log(num) / Math.LN2

is_base2 = (rng) ->
  """ Returns True if rng is a positive multiple of 2 """
  if rng <= 0
    false
  else
    lg = log2(rng)
    return ((lg > 0.0) and (lg == Math.floor(lg)))

nice_2_5_10 = (x, round=false) ->
    """ if round is false, then use Math.ceil(range) """
    expv = Math.floor(log10(x))
    f = x / Math.pow(10.0, expv)
    if round
        if f < 1.5
            nf = 1.0
        else if f < 3.0
            nf = 2.0
        else if f < 7.5
            nf = 5.0
        else
            nf = 10.0
    else
        if f <= 1.0
            nf = 1.0
        else if f <= 2.0
            nf = 2.0
        else if f <= 5.0
            nf = 5.0
        else
            nf = 10.0
    return nf * Math.pow(10, expv)


nice_10 = (x, round=false) ->
  expv = Math.floor(log10(x*1.0001))
  return Math.pow(10.0, expv)


heckbert_interval = (min, max, numticks=8, nice=nice_2_5_10,loose=false) ->
    """
    Returns a "nice" range and interval for a given data range and a preferred
    number of ticks.  From Paul Heckbert's algorithm in Graphics Gems.
    """

    range = nice(max-min)
    d = nice(range/(numticks-1), true)

    if loose
        graphmin = Math.floor(min/d) * d
        graphmax = Math.ceil(max/d) * d
    else
        graphmin = Math.ceil(min/d) * d
        graphmax = Math.floor(max/d) * d

    return [graphmin, graphmax, d]


arange = (start, end=false, step=false) ->
  if not end
    end = start
    start = 0
  if start > end
    if step == false
      step = -1
    else if step > 0
        "the loop will never terminate"
        1/0
  else if step < 0
    "the loop will never terminate"
    1/0
  if not step
    step = 1

  ret_arr = []
  i = start
  if start < end
    while i < end
      ret_arr.push(i)
      i += step
  else
    while i > end
      ret_arr.push(i)
      i += step
  return ret_arr


auto_ticks = (data_low, data_high, bound_low, bound_high, tick_interval, use_endpoints=false, zero_always_nice=true) ->
    """ Finds locations for axis tick marks.

        Calculates the locations for tick marks on an axis. The *bound_low*,
        *bound_high*, and *tick_interval* parameters specify how the axis end
        points and tick interval are calculated.

        Parameters
        ----------

        data_low, data_high : number
            The minimum and maximum values of the data along this axis.
            If any of the bound settings are 'auto' or 'fit', the axis
            bounds are calculated automatically from these values.
        bound_low, bound_high : 'auto', 'fit', or a number.
            The lower and upper bounds of the axis. If the value is a number,
            that value is used for the corresponding end point. If the value is
            'auto', then the end point is calculated automatically. If the
            value is 'fit', then the axis bound is set to the corresponding
            *data_low* or *data_high* value.
        tick_interval : can be 'auto' or a number
            If the value is a positive number, it specifies the length
            of the tick interval; a negative integer specifies the
            number of tick intervals; 'auto' specifies that the number and
            length of the tick intervals are automatically calculated, based
            on the range of the axis.
        use_endpoints : Boolean
            If True, the lower and upper bounds of the data are used as the
            lower and upper end points of the axis. If False, the end points
            might not fall exactly on the bounds.
        zero_always_nice : Boolean
            If True, ticks much closer to zero than the tick interval will be
            coerced to have a value of zero

        Returns
        -------
        An array of tick mark locations. The first and last tick entries are the
        axis end points.
    """

    is_auto_low  = (bound_low  == 'auto')
    is_auto_high = (bound_high == 'auto')

    if typeof(bound_low) == "string"
        lower = data_low
    else
        lower = bound_low

    if typeof(bound_high) == "string"
        upper = data_high
    else
        upper = bound_high

    if (tick_interval == 'auto') or (tick_interval == 0.0)
        rng = Math.abs( upper - lower )

        if rng == 0.0
            tick_interval = 0.5
            lower         = data_low  - 0.5
            upper         = data_high + 0.5
        else if is_base2( rng ) and is_base2( upper ) and rng > 4
            if rng == 2
                tick_interval = 1
            else if rng == 4
                tick_interval = 4
            else
                tick_interval = rng / 4   # maybe we want it 8?
        else
            tick_interval = auto_interval( lower, upper )
    else if tick_interval < 0
        intervals     = -tick_interval
        tick_interval = tick_intervals( lower, upper, intervals )
        if is_auto_low and is_auto_high
            is_auto_low = is_auto_high = false
            lower = tick_interval * Math.floor( lower / tick_interval )
            while ((Math.abs( lower ) >= tick_interval) and
                   ((lower + tick_interval * (intervals - 1)) >= upper))
                lower -= tick_interval
            upper = lower + tick_interval * intervals

    # If the lower or upper bound are set to 'auto',
    # calculate them based on the newly chosen tick_interval:
    if is_auto_low or is_auto_high
        delta = 0.01 * tick_interval * (data_low == data_high)
        [auto_lower, auto_upper] = auto_bounds(
            data_low - delta, data_high + delta, tick_interval)
        if is_auto_low
            lower = auto_lower
        if is_auto_high
            upper = auto_upper

    # Compute the range of ticks values:
    start = Math.floor( lower / tick_interval ) * tick_interval
    end   = Math.floor( upper / tick_interval ) * tick_interval
    # If we return the same value for the upper bound and lower bound, the
    # layout code will not be able to lay out the tick marks (divide by zero).
    if start == end
        lower = start = start - tick_interval
        upper = end = start - tick_interval

    if upper > end
        end += tick_interval
    ticks = arange( start, end + (tick_interval / 2.0), tick_interval )

    if zero_always_nice
        for i in [0..ticks.length-1]
            if Math.abs(ticks[i]) < tick_interval/1000
                ticks[i] = 0

    # FIXME
    # if len( ticks ) < 2
    #  ticks = array( ( ( lower - lower * 1.0e-7 ), lower ) )

    if (not is_auto_low) and use_endpoints
        ticks[0] = lower

    if (not is_auto_high) and use_endpoints
        ticks[ticks.length-1] = upper

    return (tick for tick in ticks when (tick >= bound_low and tick <= bound_high))

arr_div2 = (numerator, denominators) ->
  output_arr = []
  for val in denominators
    output_arr.push(numerator/val)
  return output_arr


arr_div3 = (numerators, denominators) ->
  output_arr = []
  for val, i in denominators
    output_arr.push(numerators[i]/val)
  return output_arr

argsort = (arr) ->
  sorted_arr =
    _.sortBy(arr, _.identity)
  ret_arr = []
  #for y, i in arr
  #  ret_arr[i] = sorted_arr.indexOf(y)
  for y, i in sorted_arr
    ret_arr[i] = arr.indexOf(y)

    #ret_arr.push(sorted_arr.indexOf(y))
  return ret_arr

float = (x) ->
  return x + 0.0

auto_interval_temp = (data_low, data_high) ->
    """ Calculates the tick interval for a range.

        The boundaries for the data to be plotted on the axis are::

            data_bounds = (data_low,data_high)

        The function chooses the number of tick marks, which can be between
        3 and 9 marks (including end points), and chooses tick intervals at
        1, 2, 2.5, 5, 10, 20, ...

        Returns
        -------
        interval : float
            tick mark interval for axis
    """
    range = float( data_high ) - float( data_low )

    # We'll choose from between 2 and 8 tick marks.
    # Preference is given to more ticks:
    #   Note reverse order and see kludge below...
    #divisions = arange( 8.0, 2.0, -1.0 ) # ( 7, 6, ..., 3 )
    divisions = [8.0, 7.0, 6.0, 5.0, 4.0, 3.0]
    # Calculate the intervals for the divisions:
    #candidate_intervals = range / divisions
    candidate_intervals = arr_div2(range, divisions)

    # Get magnitudes and mantissas for each candidate:

    magnitudes = candidate_intervals.map((candidate) ->
      return Math.pow(10.0, Math.floor(log10(candidate))))
    mantissas  = arr_div3(candidate_intervals, magnitudes)

    # List of "pleasing" intervals between ticks on graph.
    # Only the first magnitude are listed, higher mags others are inferred:
    magic_intervals = [1.0, 2.0, 2.5, 5.0, 10.0 ]


    best_mantissas = []
    best_magics = []
    for mi in magic_intervals
      diff_arr = mantissas.map((x) -> Math.abs(mi - x))
      best_magics.push(_.min(diff_arr))
    for ma in mantissas
      diff_arr = magic_intervals.map((x) -> Math.abs(ma - x))
      best_mantissas.push(_.min(diff_arr))
    # Calculate the absolute differences between the candidates
    # (with magnitude removed) and the magic intervals:


    # Find the division and magic interval combo that produce the
    # smallest differences:
    magic_index    = argsort(best_magics )[0]

    mantissa_index = argsort(best_mantissas )[0]


    # The best interval is the magic_interval multiplied by the magnitude
    # of the best mantissa:
    interval  = magic_intervals[ magic_index ]
    magnitude = magnitudes[ mantissa_index ]
    result    = interval * magnitude
    #if result == 0.0
    #    result = finfo(float).eps
    return result

auto_interval = memoize(auto_interval_temp)


class BasicTickFormatter
  constructor: (@precision='auto', @use_scientific=true, @power_limit_high=5, @power_limit_low=-3) ->
    @scientific_limit_low  = Math.pow(10.0, power_limit_low)
    @scientific_limit_high = Math.pow(10.0, power_limit_high)
    @last_precision = 3

  format: (ticks) ->
    if ticks.length == 0
      return []

    zero_eps = 0
    if ticks.length >= 2
      zero_eps = Math.abs(ticks[1] - ticks[0]) / 10000;

    need_sci = false;
    if @use_scientific
      for tick in ticks
        tick_abs = Math.abs(tick)
        if tick_abs > zero_eps and (tick_abs >= @scientific_limit_high or tick_abs <= @scientific_limit_low)
          need_sci = true
          break

    if _.isNumber(@precision)
      labels = new Array(ticks.length)
      if need_sci
        for i in [0..ticks.length-1]
          labels[i] = ticks[i].toExponential(@precision)
      else
        for i in [0..ticks.length-1]
          labels[i] = ticks[i].toPrecision(@precision).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "")
      return labels

    else if @precision == 'auto'
      labels = new Array(ticks.length)
      for x in [@last_precision..15]
        is_ok = true
        if need_sci
          for i in [0..ticks.length-1]
            labels[i] = ticks[i].toExponential(x)
            if i > 0
              if labels[i] == labels[i-1]
                is_ok = false
                break
          if is_ok
            break
        else
          for i in [0..ticks.length-1]
            labels[i] = ticks[i].toPrecision(x).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "")
            if i > 0
              if labels[i] == labels[i-1]
                is_ok = false
                break
          if is_ok
            break

        if is_ok
          @last_precision = x
          return labels

    return labels

_us = (t) ->
  return sprintf("%3dus", Math.floor((t % 1) * 1000))

_ms_dot_us = (t) ->
  ms = Math.floor(((t / 1000) % 1) * 1000)
  us = Math.floor((t % 1) * 1000)
  return sprintf("%3d.%3dms", ms, us)


_two_digit_year = (t) ->
  # Round to the nearest Jan 1, roughly.
  dt = new Date(t)
  year = dt.getFullYear()
  if dt.getMonth() >= 7
      year += 1
  return sprintf("'%02d", (year % 100))

_four_digit_year = (t) ->
  # Round to the nearest Jan 1, roughly.
  dt = new Date(t)
  year = dt.getFullYear()
  if dt.getMonth() >= 7
      year += 1
  return sprintf("%d", year)

_array = (t) ->
  return tz(t, "%Y %m %d %H %M %S").split(/\s+/).map( (e) -> return parseInt(e, 10) );

_strftime = (t, format) ->
  if _.isFunction(format)
    return format(t)
  else
    return tz(t, format)

class DatetimeFormatter

  # Labels of time units, from finest to coarsest.
  format_order: [
    'microseconds', 'milliseconds', 'seconds', 'minsec', 'minutes', 'hourmin', 'hours', 'days', 'months', 'years'
  ]

  # A dict whose are keys are the strings in **format_order**; each value is
  # two arrays, (widths, format strings/functions).

  # Whether or not to strip the leading zeros on tick labels.
  strip_leading_zeros: true

  constructor: () ->
    # This table of format is convert into the 'formats' dict.  Each tuple of
    # formats must be ordered from shortest to longest.
    @_formats = {
      'microseconds': [_us, _ms_dot_us]
      'milliseconds': ['%3Nms', '%S.%3Ns']
      'seconds':      [':%S', '%Ss']
      'minsec':       ['%M:%S']
      'minutes':      ['%Mm']
      'hourmin':      ['%H:%M']
      'hours':        ['%Hh', '%H:%M']
      'days':         ['%m/%d', '%a%d']
      'months':       ['%m/%Y', '%b%y']
      'years':        ['%Y', _two_digit_year, _four_digit_year]
    }
    @formats = {}
    for fmt_name of @_formats
      fmt_strings = @_formats[fmt_name]
      sizes = []
      tmptime = tz(new Date())
      for fmt in fmt_strings
          size = (_strftime(tmptime, fmt)).length
          sizes.push(size)
      @formats[fmt_name] = [sizes, fmt_strings]
    return

  _get_resolution: (resolution, interval) ->
    r = resolution
    span = interval
    if r < 5e-4
      resol = "microseconds"
    else if r < 0.5
      resol = "milliseconds"
    else if r < 60
      if span > 60
        resol = "minsec"
      else
        resol = "seconds"
    else if r < 3600
      if span > 3600
        resol = "hourmin"
      else
        resol = "minutes"
    else if r < 24*3600
      resol = "hours"
    else if r < 30*24*3600
      resol = "days"
    else if r < 365*24*3600
      resol = "months"
    else
      resol = "years"
    return resol

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
    resol = @_get_resolution(r, span)

    [widths, formats] = @formats[resol]
    format = formats[0]
    if char_width
      # If a width is provided, then we pick the most appropriate scale,
      # otherwise just use the widest format
      good_formats = []
      for i in [0..widths.length-1]
        if widths[i] * ticks.length < fill_ratio * char_width
          good_formats.push(@formats[i])
      if good_formats.length > 0
        format = good_formats[ticks.length-1]

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
        dt = Date(t)
        tm = _array(t)
        s = _strftime(t, format)
      catch error
        console.log error
        console.log("Unable to convert tick for timestamp " + t)
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


exports.nice_2_5_10 = nice_2_5_10
exports.nice_10 = nice_10
exports.heckbert_interval = heckbert_interval
exports.auto_ticks = auto_ticks
exports.auto_interval = auto_interval
exports.BasicTickFormatter = BasicTickFormatter
exports.DatetimeFormatter = DatetimeFormatter



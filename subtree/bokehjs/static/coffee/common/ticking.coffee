


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

auto_interval = (data_low, data_high) ->
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


exports.nice_2_5_10 = nice_2_5_10
exports.nice_10 = nice_10
exports.heckbert_interval = heckbert_interval
exports.auto_ticks = auto_ticks
exports.auto_interval = auto_interval
exports.BasicTickFormatter = BasicTickFormatter


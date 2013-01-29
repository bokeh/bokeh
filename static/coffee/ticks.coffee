#-------------------------------------------------------------------------------
#
#
#  Written by: David C. Morrill (based on similar routines written by Eric Jones)
#
#  Date: 2007-05-01
#
#  (c) Copyright 2002-7 by Enthought, Inc.
#
#-------------------------------------------------------------------------------
""" Tick generator classes and helper functions for calculating axis
tick-related values (i.e., bounds and intervals).

"""
# Major library imports
#from numpy import arange, argsort, array, ceil, concatenate, equal, finfo, \
#    float64, floor, linspace, log10, minimum, ndarray, newaxis, \
#    putmask, shape

# Enthought library imports
#from traits.api import HasTraits, Any

#class AbstractTickGenerator(HasTraits):
class AbstractTickGenerator
    """ Abstract class for tick generators.
    """
    get_ticks: 
      (data_low, data_high, bounds_low, bounds_high, interval,\
      use_endpoints=False, scale='linear') ->
        """ Returns a list of ticks points in data space.

        Parameters
        ----------
        data_low, data_high : float
            The actual minimum and maximum of index values of the entire
            dataset.
        bounds_low, bounds_high : "auto", "fit", float
            The range for which ticks should be generated.
        interval : "auto", float
            If the value is a positive number, it specifies the length
            of the tick interval; a negative integer specifies the
            number of tick intervals; 'auto' specifies that the number and
            length of the tick intervals are automatically calculated, based
            on the range of the axis.
        use_endpoints : Boolean
            If True, the lower and upper bounds of the data are used as the
            lower and upper end points of the axis. If False, the end points
            might not fall exactly on the bounds.
        scale : 'linear' or 'log'
            The type of scale the ticks are for.

        Returns
        -------
        tick_list : array of floats
            Where ticks are to be placed.


        Example
        -------
        If the range of x-values in a line plot span from -15.0 to +15.0, but
        the plot is currently displaying only the region from 3.1 to 6.83, and
        the user wants the interval to be automatically computed to be some
        nice value, then call get_ticks() thusly::

            get_ticks(-15.0, 15.0, 3.1, 6.83, "auto")

        A reasonable return value in this case would be::

            [3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5]
        """

      


class DefaultTickGenerator extends AbstractTickGenerator
    """ An implementation of AbstractTickGenerator that simply uses the
    auto_ticks() and log_auto_ticks() functions.
    """
    get_ticks : (data_low, data_high, bounds_low,\
      bounds_high, interval, use_endpoints=False, scale='linear') ->
        if scale == 'linear'
            ""
            #FIXME
            #return array(auto_ticks(data_low, data_high, bounds_low, bounds_high,
            #             interval, use_endpoints=False), float64)
        elif scale == 'log':
            ""
            #FIXME
            #return array(log_auto_ticks(data_low, data_high, bounds_low, bounds_high,
            #                                  interval, use_endpoints=False), float64)
            # 

class ShowAllTickGenerator extends AbstractTickGenerator 
    """ Uses the abstract interface, but returns all "positions" instead
        of decimating the ticks.

        You must provide a sequence of values as a *positions* keyword argument
        to the constructor.
    """
    # A sequence of positions for ticks.
    #positions = Any

    get_ticks : (data_low, data_high, bounds_low, bounds_high, interval,\
      use_endpoints=False, scale='linear') ->
        """ Returns an array based on **positions**.
        """
        # ignore all the high, low, etc. data and just return every position

        #FIXME
        #return array(self.positions, float64)

#-------------------------------------------------------------------------------
#  Code imported from plt/plot_utility.py:
#-------------------------------------------------------------------------------

auto_ticks =  ( data_low, data_high, bound_low, bound_high, tick_interval,\
                 use_endpoints = true) ->
    """ Finds locations for axis tick marks.

        Calculates the locations for tick marks on an axis. The *bound_low*,
        *bound_high*, and *tick_interval* parameters specify how the axis end
        points and tick interval are calculated.

        Parameters
        ----------

        data_low, data_high : number
            The minimum and maximum values of the data along this axis.
            If any of the bound settings are 'auto' or 'fit', the axis
            traits are calculated automatically from these values.
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
            lower = tick_interval * floor( lower / tick_interval )
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
    start = floor( lower / tick_interval ) * tick_interval
    end   = floor( upper / tick_interval ) * tick_interval
    # If we return the same value for the upper bound and lower bound, the
    # layout code will not be able to lay out the tick marks (divide by zero).
    if start == end
        lower = start = start - tick_interval
        upper = end = start - tick_interval

    if upper > end
        end += tick_interval
    ticks = arange( start, end + (tick_interval / 2.0), tick_interval )

    if len( ticks ) < 2
        ""
        #FIXME
        #ticks = array( ( ( lower - lower * 1.0e-7 ), lower ) )
    if (not is_auto_low) and use_endpoints
        ticks[0] = lower
    if (not is_auto_high) and use_endpoints
        ticks[-1] = upper

    #FIXME
    return [tick for tick in ticks if tick >= bound_low and tick <= bound_high]

#--------------------------------------------------------------------------------
#  Determine if a number is a power of 2:
#--------------------------------------------------------------------------------

is_base2 = (range) ->
    """ Returns True if *range* is a positive base-2 number (2, 4, 8, 16, ...).
    """
    if range <= 0.0
        return false
    else
        lg = log2(range)
        return ((lg == Math.floor( lg )) and (lg > 0.0))

log10 = (num) ->
  if num == 0.0
    num += 1.0e-16

  return (Math.log(num)/ Math.log(10))

#--------------------------------------------------------------------------------
#  Compute n log 2:
#--------------------------------------------------------------------------------

log2 = (num) ->
    """ Returns the base 2 logarithm of a number (or array).

    """
    #    !! 1e-16 is here to prevent errors when log is 0
    if num == 0.0
        num += 1.0e-16
    #elif type( num ) is ndarray:
    #    putmask( num, equal( num, 0.0), 1.0e-16 )
    return Math.log(num)
    #return log10( num ) / log10( 2 )

#--------------------------------------------------------------------------------
#  Compute the best tick interval for a specified data range:
#--------------------------------------------------------------------------------

heckbert_interval = (data_low, data_high, numticks=8) ->
    """
    Returns a "nice" range and interval for a given data range and a preferred
    number of ticks.  From Paul Heckbert's algorithm in Graphics Gems.
    """
    range = _nice(data_high - data_low)
    d = _nice(range / (numticks-1), true)
    graphmin = Math.floor(data_low / d) * d
    graphmax = Math.ceil(data_high / d) * d
    #nfrac = max(-Math.floor(log10(d)), 0)
    return [graphmin, graphmax, d]


_nice = (x, round=false) ->
    """ if round is false, then use Math.ceil(range) """
    expv = Math.floor(log10(x))
    f = x / Math.pow(10, expv)
    if round
        if f < 1.5
            nf = 1.0
        else if f < 3.0
            nf = 2.0
        else if f < 7.0
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

arr_div = (numerators, denominator) ->
  output_arr = []
  for val in numerators
    output_arr.push(val/denominator)
  return output_arr

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

arr_pow2 = (base, exponents) ->
  output_arr = []
  for val in exponents
    output_arr.push(Math.pow(base, val))
  return output_arr



window._.sorted = (arr) ->
  return _.sortBy(arr, _.identity)


window.argsort = (arr) ->
  sorted_arr =   _.sortBy(arr, _.identity)
  ret_arr = []
  #for y, i in arr
  #  ret_arr[i] = sorted_arr.indexOf(y)
  for y, i in sorted_arr
    ret_arr[i] = arr.indexOf(y)
  
    #ret_arr.push(sorted_arr.indexOf(y))
  return ret_arr

#window.argsort = (arr) ->
#  arr.map((x) -> _.sortedIndex(arr, x))
  #_.sortedIndex

window.auto_interval = (data_low, data_high) ->
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

#--------------------------------------------------------------------------------
#  Compute the best tick interval length to achieve a specified number of tick
#  intervals:
#--------------------------------------------------------------------------------
window.float = (x) ->
  return x + 0.0
window.tick_intervals =  ( data_low, data_high, intervals ) ->
    """ Computes the best tick interval length to achieve a specified number of
    tick intervals.

    Parameters
    ----------
    data_low, data_high : number
        The minimum and maximum values of the data along this axis.
        If any of the bound settings are 'auto' or 'fit', the axis
        traits are calculated automatically from these values.
    intervals : number
        The desired number of intervals

    Returns
    -------
    Returns a float indicating the tick interval length.
    """
    range     = float( data_high - data_low )
    if range == 0.0
        range = 1.0
    interval  = range / intervals
    exp_ = Math.floor( log10( interval ) )

    factor    = Math.pow(10, exp_)
    console.log("exp_ #{exp_}  pre_factor #{factor} pre_interval #{interval}")
    interval = interval / factor
    console.log(" factor #{factor} initial_interval #{interval}")
    if interval < 2.0
        interval = 2.0
        index    = 0
    else if interval < 2.5
        interval = 2.5
        index    = 1
    else if interval < 5.0
        interval = 5.0
        index    = 2
    else
        interval = 10.0
        index    = 3

    while true

        result = interval * factor
        console.log("result #{result} index #{index} interval #{interval}")
        if (Math.floor( data_low / result ) * result) + (intervals * result) >= data_high
            return result
        index     = (index + 1) % 4
        interval  = interval *  [2.0, 1.25, 2.0, 2.0] [ index ]


"""
I'll worry about this after getting linear ticks working
log_auto_ticks = (data_low, data_high,
                   bound_low, bound_high,
                   tick_interval, use_endpoints=true) ->
    #Like auto_ticks(), but for log scales.
    tick_goal = 15
    magic_numbers = [1, 2, 5]
    explicit_ticks = false

    if data_low <= 0.0
        return []

    if tick_interval != 'auto'
        if tick_interval < 0
            tick_goal = -tick_interval
        else
            magic_numbers = [tick_interval]
            explicit_ticks = true

    if data_low>data_high
        [data_low, data_high] = data_high, data_low

    log_low = log10(data_low)
    log_high = log10(data_high)
    log_interval = log_high-log_low

    if log_interval < 1.0
        # If less than a factor of 10 separates the data, just use the normal
        # linear approach
        return auto_ticks(data_low, data_high,
                          bound_low, bound_high,
                          tick_interval,
                          use_endpoints = false)

    else if log_interval < (tick_goal+1)/2 or explicit_ticks
        # If there's enough space, try to put lines at the magic number multipliers
        # inside each power of ten

        # Try each interval to see how many ticks we get
        for interval in magic_numbers
            ticklist = []
            for exp in [Math.floor(log_low).,Math.ceil(log_high)]
                for multiplier in linspace(interval, 10.0, round(10.0/interval),
                                           endpoint=1)
                    tick = Math.exp(10, exp*multiplier)
                    if tick >= data_low and tick <= data_high:
                        ticklist.append(tick)
            if len(ticklist)<tick_goal+3 or explicit_ticks:
                return ticklist
    else:
        # We put lines at every power of ten or less
        startlog = Math.ceil(log_low)
        endlog = Math.floor(log_high)
        interval = Math.ceil((endlog-startlog)/9.0)
        expticks = arange(startlog, endlog, interval)
        # There's no function that is like arange but inclusive, so
        # we have to check whether the endpoint should be included.
        if (endlog-startlog) % interval == 0.0:
            expticks = concatenate([expticks, [endlog]])
        return 10**expticks
"""

#-------------------------------------------------------------------------------
#  Compute the best lower and upper axis bounds for a range of data:
#-------------------------------------------------------------------------------

auto_bounds = ( data_low, data_high, tick_interval ) ->
    """ Calculates appropriate upper and lower bounds for the axis from
        the data bounds and the given axis interval.

        The boundaries  hit either exactly on the lower and upper values
        or on the tick mark just beyond the lower and upper values.
    """
    return [calc_bound( data_low,  tick_interval, false ),
             calc_bound( data_high, tick_interval, true  ) ]

#-------------------------------------------------------------------------------
#  Compute the best axis endpoint for a specified data value:
#-------------------------------------------------------------------------------
window.divmod = (x,y) ->
  quot = Math.floor(x/y)
  rem = x % y

  return [quot, rem]
  
window.calc_bound =  ( end_point, tick_interval, is_upper ) ->
    """ Finds an axis end point that includes the value *end_point*.

    If the tick mark interval results in a tick mark hitting directly on the
    end point, *end_point* is returned.  Otherwise, the location of the tick
    mark just past *end_point* is returned. The *is_upper* parameter
    specifies whether *end_point* is at the upper (True) or lower (false)
    end of the axis.
    """
    [quotient, remainder] = divmod( end_point, tick_interval )
    rem_p = remainder == 0.0
    tick_p = ((tick_interval - remainder) / tick_interval) < 0.00001
    if rem_p or tick_p
        return end_point

    c1 = (quotient + 1.0) * tick_interval
    c2 = quotient         * tick_interval
    if is_upper
        return Math.max( c1, c2 )
    return Math.min( c1, c2 )

window.ticks = {}
ticks.auto_interval = auto_interval
ticks.auto_bounds = auto_bounds

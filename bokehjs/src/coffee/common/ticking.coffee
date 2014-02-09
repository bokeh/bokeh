
# TODO Clear out debugging code, etc.
# TODO Organize helper functions.
# TODO The years scale doesn't always use the roundest numbers; it should
# probably use a special scale.
# TODO Add tests.
# TODO There used to be a TODO: restore memoization.  So.... do that?
# TODO Instead of a get_ticks() method, there used to be an auto_ticks()
# function that took a lot of fancy arguments, but those arguments weren't
# used anywhere.  Should we restore them?

define [
  "underscore",
  "timezone",
  "sprintf",
], (_, tz, sprintf) ->

  # ---------------------------------------------------------------------------
  # Utility functions
  # ---------------------------------------------------------------------------

  # Similar to Python's range function.  Returns an array of values from start
  # (inclusive) to end (exclusive), in steps of step.  If step is negative,
  # starts at end and counts down to start.  If step is not specified, it
  # defaults to sign(end - start).  (XXX Not sure I approve of this; Python's
  # range is not this clever.)
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

  # A hacky analogue to repr() in Python.
  repr = (obj) ->
    if obj == null
      return "null"

    else if obj.constructor == Array
      elems_str = (repr(elem) for elem in obj).join(", ")
      return "[#{elems_str}]"

    else if obj.constructor == Object
      props_str = ("#{key}: #{repr(obj[key])}" for key of obj).join(", ")
      return "{#{props_str}}"

    else if obj.constructor == String
      return "\"#{obj}\""

    else if obj.constructor == Function
      return "<Function: #{obj.name}>"

    else
      obj_as_string = obj.toString()
      if obj_as_string == "[object Object]"
        return "<#{obj.constructor.name}>"
      else
        return obj_as_string

  # Returns an array containing the valid indices of the input array arr.
  indices = (arr) ->
    return _.range(arr.length)

  # Returns the index of the minimum element of an array.
  argmin = (arr) ->
    ret = _.min(indices(arr), ((i) -> return arr[i]))
    return ret

  # Forces a number x into a specified range [min_val, max_val].
  clamp = (x, min_val, max_val) ->
    return Math.max(min_val, Math.min(max_val, x))

  # A log function with an optional base.
  log = (x, base=Math.E) ->
    return Math.log(x) / Math.log(base)

  # ---------------------------------------------------------------------------
  # Date/time utility functions
  # ---------------------------------------------------------------------------

  # Makes a copy of a date object.
  copy_date = (date) ->
    return new Date(date.getTime())

  # Rounds a date down to the month.
  last_month_no_later_than = (date) ->
    date = copy_date(date)
    date.setUTCDate(1)
    date.setUTCHours(0)
    date.setUTCMinutes(0)
    date.setUTCSeconds(0)
    date.setUTCMilliseconds(0)
    return date


  # Rounds a date down to the year.
  last_year_no_later_than = (date) ->
    date = last_month_no_later_than(date)
    date.setUTCMonth(0)
    return date

  # Given a start and end time in millis, returns the shortest array of
  # consecutive years (as Dates) that surrounds both times.
  date_range_by_year = (start_time, end_time) ->
    start_date = last_year_no_later_than(new Date(start_time))

    end_date = last_year_no_later_than(new Date(end_time))
    end_date.setUTCFullYear(end_date.getUTCFullYear() + 1)

    dates = []
    date = start_date
    while true
      dates.push(copy_date(date))

      date.setUTCFullYear(date.getUTCFullYear() + 1)
      if date > end_date
        break

    return dates

  # Given a start and end time in millis, returns the shortest array of
  # consecutive months (as Dates) that surrounds both times.
  date_range_by_month = (start_time, end_time) ->
    start_date = last_month_no_later_than(new Date(start_time))

    end_date = last_month_no_later_than(new Date(end_time))
    # XXX This is not a reliable technique in general, but it should be
    # safe when the day of the month is 1.  (The problem case is this:
    # Mar 31 -> Apr 31, which becomes May 1.)
    prev_end_date = copy_date(end_date)
    end_date.setUTCMonth(end_date.getUTCMonth() + 1)

    dates = []
    date = start_date
    while true
      dates.push(copy_date(date))

      date.setUTCMonth(date.getUTCMonth() + 1)
      if date > end_date
        break

    return dates

  # ---------------------------------------------------------------------------
  # Scale classes
  # ---------------------------------------------------------------------------

  DEFAULT_DESIRED_N_TICKS = 6

  # The base class for all Scale objects.  It needs to be subclassed before
  # being used.  The simplest subclass is SingleIntervalScale.
  #
  # The main value of a Scale is its get_ticks() method, which takes a min and
  # max value and (optionally) a desired number of ticks, and returns an array
  # of approximately that many ticks, evenly spaced, with nice round values,
  # within that range.
  #
  # Different Scales are suited to different types of data or different
  # magnitudes.  To make it possible to select Scales programmatically, they
  # also support some additional methods: get_interval(), get_min_interval(),
  # and get_max_interval().
  class AbstractScale
    # Creates a new AbstractScale.  The toString_properties argument is an
    # optional list of member names which be shown when toString() is called.
    constructor: (@toString_properties=[]) ->

    # Generates a nice series of ticks for a given range.
    get_ticks: (data_low, data_high, range, {desired_n_ticks}) ->
      desired_n_ticks ?= DEFAULT_DESIRED_N_TICKS
      return @get_ticks_no_defaults(data_low, data_high, desired_n_ticks)

    # The version of get_ticks() that does the work (and the version that
    # should be overridden in subclasses).
    get_ticks_no_defaults: (data_low, data_high, desired_n_ticks) ->
      interval = @get_interval(data_low, data_high, desired_n_ticks)
      start_factor = Math.floor(data_low / interval)
      end_factor   = Math.ceil(data_high / interval)
      factors = arange(start_factor, end_factor + 1)
      ticks = (factor * interval for factor in factors)
      return ticks

    # Given min and max values and a number of ticks, returns a tick interval
    # that produces approximately the right number of nice ticks.  (If you just
    # implement this method, get_ticks_no_defaults() will work.  However, if
    # you want to return ticks that aren't evenly spaced, you'll need to
    # override get_ticks_no_defaults() directly.  In that case, you should
    # still implement get_interval(), because users can call it to get a sense
    # of what the spacing will be for a given range.)
    # FIXME Is that necessary?  Maybe users should just call get_ticks() and
    # figure it out from that.
    get_interval: undefined

    # Returns the smallest interval that can be returned by get_interval().
    get_min_interval: () -> @min_interval

    # Returns the largest interval that can be returned by get_interval().
    get_max_interval: () -> @max_interval

    # Since min and max intervals generally don't change, subclasses can just
    # set these in the constructor.
    min_interval: undefined
    max_interval: undefined

    # Returns a string representation of this object.
    toString: () ->
      # FIXME Should we use typeof() instead of constructor.name?
      class_name = @constructor.name
      props = @toString_properties
      params_str = ("#{key}=#{repr(this[key])}" for key in props).join(", ")
      return "#{class_name}(#{params_str})"

    # Returns the interval size that would produce exactly the number of
    # desired ticks.  (In general we won't use exactly this interval, because
    # we want the ticks to be round numbers.)
    get_ideal_interval: (data_low, data_high, desired_n_ticks) ->
      data_range = data_high - data_low
      return data_range / desired_n_ticks

  # The SingleIntervalScale is a Scale that always uses the same tick spacing,
  # regardless of the input range.  It's not very useful by itself, but can
  # be used as part of a CompositeScale below.
  class SingleIntervalScale extends AbstractScale
    constructor: (@interval) ->
      super(['interval'])
      @min_interval = @interval
      @max_interval = @interval

    get_interval: (data_low, data_high, n_desired_ticks) ->
      return @interval

  # This Scale takes a collection of Scales and picks the one most appropriate
  # for a given range.
  class CompositeScale extends AbstractScale
    # The scales should be in order of increasing interval size; specifically,
    # if S comes before T, then it should be the case that
    # S.get_max_interval() < T.get_min_interval().
    # FIXME Enforce this automatically.
    constructor: (@scales) ->
      super()

      @min_intervals = _.invoke(@scales, 'get_min_interval')
      @max_intervals = _.invoke(@scales, 'get_max_interval')

      @min_interval = _.first(@min_intervals)
      @max_interval =  _.last(@max_intervals)

    get_best_scale: (data_low, data_high, desired_n_ticks) ->
      data_range = data_high - data_low
      ideal_interval = @get_ideal_interval(data_low, data_high,
                                           desired_n_ticks)
      scale_ndxs = [
        _.sortedIndex(@min_intervals, ideal_interval) - 1,
        _.sortedIndex(@max_intervals, ideal_interval)
      ]
      intervals = [@min_intervals[scale_ndxs[0]],
                   @max_intervals[scale_ndxs[1]]]
      errors = intervals.map((interval) ->
        return Math.abs(desired_n_ticks - (data_range / interval)))

      best_scale_ndx = scale_ndxs[argmin(errors)]
      best_scale = @scales[best_scale_ndx]

      return best_scale

    get_interval: (data_low, data_high, desired_n_ticks) ->
      best_scale = @get_best_scale(data_low, data_high, desired_n_ticks)
      return best_scale.get_interval(data_low, data_high, desired_n_ticks)

    get_ticks_no_defaults: (data_low, data_high, desired_n_ticks) ->
      best_scale = @get_best_scale(data_low, data_high, desired_n_ticks)
      return best_scale.get_ticks_no_defaults(data_low, data_high,
                                              desired_n_ticks)

  # This Scale produces nice round ticks at any magnitude.
  # AdaptiveScale([1, 2, 5]) will choose the best tick interval from the
  # following:
  # ..., 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, ...
  class AdaptiveScale extends AbstractScale
    # These arguments control the range of possible intervals.  The interval I
    # returned by get_interval() will be the one that most closely matches the
    # desired number of ticks, subject to the following constraints:
    # I = (M * B^N), where
    # M is a member of mantissas,
    # B is base,
    # and N is an integer;
    # and min_interval <= I <= max_interval.
    constructor: (@mantissas, @base=10.0, @min_interval=0.0,
                  @max_interval=Infinity)->
      super(['mantissas', 'base', 'min_magnitude', 'max_magnitude'])

      prefix_mantissa =  _.last(@mantissas) / @base
      suffix_mantissa = _.first(@mantissas) * @base
      @extended_mantissas = _.flatten([prefix_mantissa, @mantissas,
                                       suffix_mantissa])

      @base_factor = if @min_interval == 0.0 then 1.0 else @min_interval

    get_interval: (data_low, data_high, desired_n_ticks) ->
      data_range = data_high - data_low
      ideal_interval = @get_ideal_interval(data_low, data_high,
                                           desired_n_ticks)

      interval_exponent = Math.floor(log(ideal_interval / @base_factor, @base))
      ideal_magnitude = Math.pow(@base, interval_exponent) * @base_factor
      ideal_mantissa = ideal_interval / ideal_magnitude

      # An untested optimization.
#       index = _.sortedIndex(@extended_mantissas, ideal_mantissa)
#       candidate_mantissas = @extended_mantissas[index..index + 1]
      candidate_mantissas = @extended_mantissas

      errors = candidate_mantissas.map((mantissa) ->
        Math.abs(desired_n_ticks -
                 (data_range / (mantissa * ideal_magnitude))))
      best_mantissa = candidate_mantissas[argmin(errors)]

      interval = best_mantissa * ideal_magnitude

      return clamp(interval, @min_interval, @max_interval)

  # A MonthsScale produces ticks from a fixed subset of months of the year.
  # E.g., MonthsScale([0, 3, 6, 9]) produces ticks of the 1st of January,
  # April, July, and October of each year.
  class MonthsScale extends SingleIntervalScale
    constructor: (@months) ->
      @typical_interval = if @months.length > 1
          (@months[1] - @months[0]) * ONE_MONTH
        else
          12 * ONE_MONTH
      super(@typical_interval)

      @toString_properties = ['months']

    get_ticks_no_defaults: (data_low, data_high, desired_n_ticks) ->
      year_dates = date_range_by_year(data_low, data_high)

      months = @months
      months_of_year = (year_date) ->
        return months.map((month) ->
          month_date = copy_date(year_date)
          month_date.setUTCMonth(month)
          return month_date)

      month_dates = _.flatten(months_of_year(date) for date in year_dates)

      all_ticks = _.invoke(month_dates, 'getTime')
      ticks_in_range = _.filter(all_ticks,
                                ((tick) -> data_low <= tick <= data_high))

      return ticks_in_range

  # A DaysScale produces ticks from a fixed subset of calendar days.
  # E.g., DaysScale([1, 15]) produces ticks on the 1st and 15th days of each
  # month.
  class DaysScale extends SingleIntervalScale
    constructor: (@days) ->
      @typical_interval = if @days.length > 1
          (@days[1] - @days[0]) * ONE_DAY
        else
          31 * ONE_DAY
      super(@typical_interval)

      @toString_properties = ['days']

    get_ticks_no_defaults: (data_low, data_high, desired_n_ticks) ->
      month_dates = date_range_by_month(data_low, data_high)

      days = @days
      typical_interval = @typical_interval
      days_of_month = (month_date) ->
        dates = []
        for day in days
          day_date = copy_date(month_date)
          day_date.setUTCDate(day)
          # We can't use all of the values in @days, because they may not fall
          # within the current month.  In fact, if, e.g., our month is 28 days
          # and we're marking every third day, we don't want day 28 to show up
          # because it'll be right next to the 1st of the next month.  So we
          # make sure we have a bit of room before we include a day.
          future_date = new Date(day_date.getTime() + (typical_interval / 2))
          if future_date.getUTCMonth() == month_date.getUTCMonth()
            dates.push(day_date)
        return dates

      day_dates = _.flatten(days_of_month(date) for date in month_dates)

      all_ticks = _.invoke(day_dates, 'getTime')
      # FIXME Since the ticks are sorted, this could be done more efficiently.
      ticks_in_range = _.filter(all_ticks,
                                ((tick) -> data_low <= tick <= data_high))

      return ticks_in_range

  # Some time constants, in milliseconds.
  ONE_MILLI = 1.0
  ONE_SECOND = 1000.0
  ONE_MINUTE = 60.0 * ONE_SECOND
  ONE_HOUR = 60 * ONE_MINUTE
  ONE_DAY = 24 * ONE_HOUR
  ONE_MONTH = 30 * ONE_DAY # An approximation, obviously.
  ONE_YEAR = 365 * ONE_DAY

  # This is a good default scale for generic numerical data.
  class BasicScale extends AdaptiveScale
    constructor: () ->
      super([1, 2, 5])

  # This is a decent scale for time data (in milliseconds).
  # It could certainly be improved:
  # FIXME There should probably be a special scale for years.
  # FIXME Some of the adaptive scales probably have too many mantissas, which
  # leads to too-frequent tick transitions.
  class DatetimeScale extends CompositeScale
    constructor: () ->
      super([
        # Sub-second.
        new AdaptiveScale([1, 2, 5], 10, 0, 500 * ONE_MILLI),

        # Seconds, minutes.
        new AdaptiveScale([1, 2, 5, 10, 15, 20, 30], 60,
                          ONE_SECOND, 30 * ONE_MINUTE),

        # Hours.
        new AdaptiveScale([1, 2, 4, 6, 8, 12], 24.0, ONE_HOUR, 12 * ONE_HOUR),

        # Days.
        new DaysScale(arange(1, 32)),
        new DaysScale(arange(1, 31, 3)),
        new DaysScale([1, 8, 15, 22]),
        new DaysScale([1, 15]),

        # Months.
        new MonthsScale(arange(0, 12)),
        new MonthsScale(arange(0, 12, 2)),
        new MonthsScale(arange(0, 12, 4)),
        new MonthsScale(arange(0, 12, 6)),

        # Catchall for large timescales.
        new AdaptiveScale([1, 2, 5], 10, ONE_YEAR, Infinity),
      ])

  # ---------------------------------------------------------------------------
  # Formatter classes
  # ---------------------------------------------------------------------------

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
          for i in [0...ticks.length]
            labels[i] = ticks[i].toExponential(@precision)
        else
          for i in [0...ticks.length]
            labels[i] = ticks[i].toPrecision(@precision).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "")
        return labels

      else if @precision == 'auto'
        labels = new Array(ticks.length)
        for x in [@last_precision..15]
          is_ok = true
          if need_sci
            for i in [0...ticks.length]
              labels[i] = ticks[i].toExponential(x)
              if i > 0
                if labels[i] == labels[i-1]
                  is_ok = false
                  break
            if is_ok
              break
          else
            for i in [0...ticks.length]
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
        'seconds':      ['%Ss']
        'minsec':       [':%M:%S']
        'minutes':      [':%M', '%Mm']
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
          # FIXME I think this should be:
          #   format = good_formats[good_formats.length - 1]
          # or better yet:
          #   format = _.last(good_formats)
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
          # FIXME This should be:
          #   dt = new Date(t)
          # Or rather, if anyone used dt, that's what it should be.
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
#           console.log("  #{t} -> #{new Date(t)} : #{tm} : #{s} -> #{ss}")
        else
          labels.push(s)

      return labels

  return {
    "BasicScale": BasicScale,
    "DatetimeScale": DatetimeScale,

    "BasicTickFormatter": BasicTickFormatter,
    "DatetimeFormatter": DatetimeFormatter,
  }



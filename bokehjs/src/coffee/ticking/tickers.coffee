
# TODO Clear out debugging code, etc.
# TODO Organize helper functions.
# TODO The years ticker doesn't always use the roundest numbers; it should
# probably use a special ticker.
# TODO Add tests.
# TODO There used to be a TODO: restore memoization.  So.... do that?
# TODO Instead of a get_ticks() method, there used to be an auto_ticks()
# function that took a lot of fancy arguments, but those arguments weren't
# used anywhere.  Should we restore them?

define [
  "underscore",
  "backbone",
  "timezone",
  "sprintf",
  "common/has_properties"
], (_, Backbone, tz, sprintf, HasProperties) ->

  # Some time constants, in milliseconds.
  ONE_MILLI = 1.0
  ONE_SECOND = 1000.0
  ONE_MINUTE = 60.0 * ONE_SECOND
  ONE_HOUR = 60 * ONE_MINUTE
  ONE_DAY = 24 * ONE_HOUR
  ONE_MONTH = 30 * ONE_DAY # An approximation, obviously.
  ONE_YEAR = 365 * ONE_DAY

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
  # Ticker classes
  # ---------------------------------------------------------------------------

  DEFAULT_DESIRED_N_TICKS = 6

  # The base class for all Ticker objects.  It needs to be subclassed before
  # being used.  The simplest subclass is SingleIntervalTicker.
  #
  # The main value of a Ticker is its get_ticks() method, which takes a min and
  # max value and (optionally) a desired number of ticks, and returns an array
  # of approximately that many ticks, evenly spaced, with nice round values,
  # within that range.
  #
  # Different Tickers are suited to different types of data or different
  # magnitudes.  To make it possible to select Tickers programmatically, they
  # also support some additional methods: get_interval(), get_min_interval(),
  # and get_max_interval().
  class AbstractTicker extends HasProperties
    # Initializes a new AbstractTicker.  The toString_properties argument is an
    # optional list of member names which be shown when toString() is called.
    initialize: (attrs, options) ->
      super(attrs, options)

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
    get_min_interval: () -> @get('min_interval')

    # Returns the largest interval that can be returned by get_interval().
    get_max_interval: () -> @get('max_interval')

    # Since min and max intervals generally don't change, subclasses can just
    # set these in the constructor.
    min_interval: undefined
    max_interval: undefined

    # Returns a string representation of this object.
    toString: () ->
      class_name = typeof @
      props = @get('toString_properties')
      params_str = ("#{key}=#{repr(this[key])}" for key in props).join(", ")
      return "#{class_name}(#{params_str})"

    # Returns the interval size that would produce exactly the number of
    # desired ticks.  (In general we won't use exactly this interval, because
    # we want the ticks to be round numbers.)
    get_ideal_interval: (data_low, data_high, desired_n_ticks) ->
      data_range = data_high - data_low
      return data_range / desired_n_ticks

    defaults: () ->
      return _.extend(super(), {
        toString_properties: []
      })

  # The SingleIntervalTicker is a Ticker that always uses the same tick spacing,
  # regardless of the input range.  It's not very useful by itself, but can
  # be used as part of a CompositeTicker below.
  class SingleIntervalTicker extends AbstractTicker
    initialize: (attrs, options) ->
      super(attrs, options)
      @register_property('min_interval',
          () -> @get('interval')
        , true)
      @add_dependencies('min_interval', this, ['interval'])

      @register_property('max_interval',
          () -> @get('interval')
        , true)
      @add_dependencies('max_interval', this, ['interval'])

    get_interval: (data_low, data_high, n_desired_ticks) ->
      return @get('interval')

    defaults: () ->
      return _.extend(super(), {
        toString_properties: ['interval']
      })

  # This Ticker takes a collection of Tickers and picks the one most appropriate
  # for a given range.
  class CompositeTicker extends AbstractTicker
    # The tickers should be in order of increasing interval size; specifically,
    # if S comes before T, then it should be the case that
    # S.get_max_interval() < T.get_min_interval().
    # FIXME Enforce this automatically.
    initialize: (attrs, options) ->
      super(attrs, options)

      tickers = @get('tickers')
      @register_property('min_intervals',
          () -> _.invoke(tickers, 'get_min_interval')
        , true)
      @add_dependencies('min_intervals', this, ['tickers'])

      @register_property('max_intervals',
          () -> _.invoke(tickers, 'get_max_interval')
        , true)
      @add_dependencies('max_intervals', this, ['tickers'])

      @register_property('min_interval',
          () -> _.first(@get('min_intervals'))
        , true)
      @add_dependencies('min_interval', this, ['min_intervals'])

      @register_property('max_interval',
          () -> _.first(@get('max_intervals'))
        , true)
      @add_dependencies('max_interval', this, ['max_interval'])

    get_best_ticker: (data_low, data_high, desired_n_ticks) ->
      data_range = data_high - data_low
      ideal_interval = @get_ideal_interval(data_low, data_high,
                                           desired_n_ticks)
      ticker_ndxs = [
        _.sortedIndex(@get('min_intervals'), ideal_interval) - 1,
        _.sortedIndex(@get('max_intervals'), ideal_interval)
      ]
      intervals = [@get('min_intervals')[ticker_ndxs[0]],
                   @get('max_intervals')[ticker_ndxs[1]]]
      errors = intervals.map((interval) ->
        return Math.abs(desired_n_ticks - (data_range / interval)))

      best_ticker_ndx = ticker_ndxs[argmin(errors)]
      best_ticker = @get('tickers')[best_ticker_ndx]

      return best_ticker

    get_interval: (data_low, data_high, desired_n_ticks) ->
      best_ticker = @get_best_ticker(data_low, data_high, desired_n_ticks)
      return best_ticker.get_interval(data_low, data_high, desired_n_ticks)

    get_ticks_no_defaults: (data_low, data_high, desired_n_ticks) ->
      best_ticker = @get_best_ticker(data_low, data_high, desired_n_ticks)
      return best_ticker.get_ticks_no_defaults(data_low, data_high,
                                              desired_n_ticks)

    defaults: () ->
      super()

  # This Ticker produces nice round ticks at any magnitude.
  # AdaptiveTicker([1, 2, 5]) will choose the best tick interval from the
  # following:
  # ..., 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, ...
  class AdaptiveTicker extends AbstractTicker
    # These arguments control the range of possible intervals.  The interval I
    # returned by get_interval() will be the one that most closely matches the
    # desired number of ticks, subject to the following constraints:
    # I = (M * B^N), where
    # M is a member of mantissas,
    # B is base,
    # and N is an integer;
    # and min_interval <= I <= max_interval.
    initialize: (attrs, options) ->
      super(attrs, options)

      prefix_mantissa =  _.last(@get('mantissas')) / @base
      suffix_mantissa = _.first(@get('mantissas')) * @base
      @extended_mantissas = _.flatten([prefix_mantissa, @get('mantissas'), suffix_mantissa])

      @base_factor = if @get('min_interval') == 0.0 then 1.0 else @get('min_interval')

    get_interval: (data_low, data_high, desired_n_ticks) ->
      data_range = data_high - data_low
      ideal_interval = @get_ideal_interval(data_low, data_high,
                                           desired_n_ticks)

      interval_exponent = Math.floor(log(ideal_interval / @base_factor, @get('base')))
      ideal_magnitude = Math.pow(@get('base'), interval_exponent) * @base_factor
      ideal_mantissa = ideal_interval / ideal_magnitude

      # An untested optimization.
#       index = _.sortedIndex(@extended_mantissas, ideal_mantissa)
#       candidate_mantissas = @extended_mantissas[index..index + 1]
      candidate_mantissas = @extended_mantissas

      errors = candidate_mantissas.map((mantissa) ->
        Math.abs(desired_n_ticks - (data_range / (mantissa * ideal_magnitude))))
      best_mantissa = candidate_mantissas[argmin(errors)]

      interval = best_mantissa * ideal_magnitude

      return clamp(interval, @get('min_interval'), @get('max_interval'))

    defaults: () ->
      return _.extend(super(), {
        toString_properties: ['mantissas', 'base', 'min_magnitude', 'max_magnitude'],
        base: 10.0,
        min_interval: 0.0,
        max_interval: Infinity,
      })

  # A MonthsTicker produces ticks from a fixed subset of months of the year.
  # E.g., MonthsTicker([0, 3, 6, 9]) produces ticks of the 1st of January,
  # April, July, and October of each year.
  class MonthsTicker extends SingleIntervalTicker
    initialize: (attrs, options) ->
      super(attrs, options)
      months = @get('months')
      interval = if months.length > 1
          (months[1] - months[0]) * ONE_MONTH
        else
          12 * ONE_MONTH
      @set('interval', interval)

    get_ticks_no_defaults: (data_low, data_high, desired_n_ticks) ->
      year_dates = date_range_by_year(data_low, data_high)

      months = @get('months')
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

    defaults: () ->
      return _.extend(super(), {
        toString_properties: ['months']
      })

  # A DaysTicker produces ticks from a fixed subset of calendar days.
  # E.g., DaysTicker([1, 15]) produces ticks on the 1st and 15th days of each
  # month.
  class DaysTicker extends SingleIntervalTicker
    initialize: (attrs, options) ->
      super(attrs, options)
      days = @get('days')
      interval = if days.length > 1
          (days[1] - days[0]) * ONE_DAY
        else
          31 * ONE_DAY
      @set('interval', interval)

    get_ticks_no_defaults: (data_low, data_high, desired_n_ticks) ->
      month_dates = date_range_by_month(data_low, data_high)

      days = @get('days')
      days_of_month = (month_date, interval) =>
        dates = []
        for day in days
          day_date = copy_date(month_date)
          day_date.setUTCDate(day)
          # We can't use all of the values in @get('days'), because they may not
          # fall within the current month.  In fact, if, e.g., our month is 28 days
          # and we're marking every third day, we don't want day 28 to show up
          # because it'll be right next to the 1st of the next month.  So we
          # make sure we have a bit of room before we include a day.
          future_date = new Date(day_date.getTime() + (interval / 2))
          if future_date.getUTCMonth() == month_date.getUTCMonth()
            dates.push(day_date)
        return dates

      interval = @get('interval')
      day_dates = _.flatten(days_of_month(date, interval) for date in month_dates)

      all_ticks = _.invoke(day_dates, 'getTime')
      # FIXME Since the ticks are sorted, this could be done more efficiently.
      ticks_in_range = _.filter(all_ticks,
                                ((tick) -> data_low <= tick <= data_high))

      return ticks_in_range

    defaults: () ->
      return _.extend(super(), {
        toString_properties: ['days']
      })

  return {
    "arange":               arange,
    "ONE_MILLI":            ONE_MILLI,
    "ONE_SECOND":           ONE_SECOND,
    "ONE_MINUTE":           ONE_MINUTE,
    "ONE_HOUR":             ONE_HOUR,
    "ONE_DAY":              ONE_DAY,
    "ONE_MONTH":            ONE_MONTH,
    "ONE_YEAR":             ONE_YEAR,
    "AbstractTicker":       AbstractTicker,
    "AdaptiveTicker":       AdaptiveTicker,
    "CompositeTicker":      CompositeTicker,
    "DaysTicker":           DaysTicker,
    "MonthsTicker":         MonthsTicker,
    "SingleIntervalTicker": SingleIntervalTicker
  }


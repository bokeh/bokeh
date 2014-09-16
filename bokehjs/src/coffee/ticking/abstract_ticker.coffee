define [
  "underscore",
  "common/collection",
  "common/has_properties",
], (_, Collection, HasProperties) ->
  # A hacky analogue to repr() in Python.
  repr = (obj) ->
    if obj == null
      return "null"

    if not obj?
      return "undefined"

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
    type: 'AbstractTicker'

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
      if _.isNaN(start_factor) or _.isNaN(end_factor)
        factors = []
      else
        factors = _.range(start_factor, end_factor + 1)
      ticks = (factor * interval for factor in factors)
      num_minor_ticks = @get("num_minor_ticks")
      minor_ticks = []
      if num_minor_ticks > 1
        minor_interval = interval / num_minor_ticks
        minor_offsets = (i*minor_interval for i in [1..num_minor_ticks])
        for x in minor_offsets
          minor_ticks.push(ticks[0]-x)
        for tick in ticks
          for x in minor_offsets
            minor_ticks.push(tick+x)
      return {
        "major": ticks
        "minor": minor_ticks
      }

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

    defaults: ->
      return _.extend {}, super(), {
        toString_properties: []
        num_minor_ticks: 5
      }

  class AbstractTickers extends Collection
    model: AbstractTicker

  return {
    "Model": AbstractTicker,
    "Collection": new AbstractTickers()
  }

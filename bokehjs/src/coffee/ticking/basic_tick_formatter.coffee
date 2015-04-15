_ = require "underscore"
HasProperties = require "../common/has_properties"

class BasicTickFormatter extends HasProperties
  type: 'BasicTickFormatter'

  initialize: (attrs, options) ->
    super(attrs, options)
    @register_property('scientific_limit_low',
        () -> Math.pow(10.0, @get('power_limit_low'))
      , true)
    @add_dependencies('scientific_limit_low', this, ['power_limit_low'])

    @register_property('scientific_limit_high',
        () -> Math.pow(10.0, @get('power_limit_high'))
      , true)
    @add_dependencies('scientific_limit_high', this, ['power_limit_high'])

    @last_precision = 3

  format: (ticks) ->
    if ticks.length == 0
      return []

    zero_eps = 0
    if ticks.length >= 2
      zero_eps = Math.abs(ticks[1] - ticks[0]) / 10000

    need_sci = false
    if @get('use_scientific')
      for tick in ticks
        tick_abs = Math.abs(tick)
        if (tick_abs > zero_eps and
            (tick_abs >= @get('scientific_limit_high') or
            tick_abs <= @get('scientific_limit_low')))
          need_sci = true
          break

    precision = @get('precision')

    if not precision? or _.isNumber(precision)
      labels = new Array(ticks.length)
      if need_sci
        for i in [0...ticks.length]
          labels[i] = ticks[i].toExponential(precision or undefined)
      else
        for i in [0...ticks.length]
          labels[i] = ticks[i].toFixed(precision or undefined).replace(
            /(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "")
      return labels

    else if precision == 'auto'
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
            labels[i] = ticks[i].toFixed(x).replace(
              /(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "")
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

  defaults: () ->
    return _.extend {}, super(), {
      precision: 'auto'
      use_scientific: true
      power_limit_high: 5
      power_limit_low: -3
    }

module.exports =
  Model: BasicTickFormatter
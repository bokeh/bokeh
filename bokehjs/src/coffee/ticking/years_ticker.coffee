_ = require "underscore"
BasicTicker = require "./basic_ticker"
SingleIntervalTicker = require "./single_interval_ticker"
util = require "./util"

last_year_no_later_than = util.last_year_no_later_than
ONE_YEAR = util.ONE_YEAR

class YearsTicker extends SingleIntervalTicker.Model
  type: 'YearsTicker'

  initialize: (attrs, options) ->
    super(attrs, options)
    @set('interval', ONE_YEAR)
    @basic_ticker = new BasicTicker.Model({num_minor_ticks:0})

  get_ticks_no_defaults: (data_low, data_high, desired_n_ticks) ->
    start_year = last_year_no_later_than(new Date(data_low)).getUTCFullYear()
    end_year = last_year_no_later_than(new Date(data_high)).getUTCFullYear()

    years = @basic_ticker.get_ticks_no_defaults(start_year, end_year, desired_n_ticks).major

    all_ticks = (Date.UTC(year, 0, 1) for year in years)

    ticks_in_range = _.filter(all_ticks,
                              ((tick) -> data_low <= tick <= data_high))

    return {
      major: ticks_in_range
      minor: []
    }

  defaults: () ->
    return _.extend {}, super(), {
      toString_properties: ['years']
    }

module.exports =
  Model: YearsTicker
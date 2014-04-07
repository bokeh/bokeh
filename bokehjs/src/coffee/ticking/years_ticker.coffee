define [
  "underscore",
  "backbone",
  "ticking/basic_ticker",
  "ticking/single_interval_ticker",
  "ticking/util",
], (_, Backbone, BasicTicker, SingleIntervalTicker, util) ->

  last_year_no_later_than = util.last_year_no_later_than
  ONE_YEAR = util.ONE_YEAR

  class YearsTicker extends SingleIntervalTicker.Model
    type: 'YearsTicker'

    initialize: (attrs, options) ->
      super(attrs, options)
      @set('interval', ONE_YEAR)
      @basic_ticker = new BasicTicker.Model()

    get_ticks_no_defaults: (data_low, data_high, desired_n_ticks) ->
      start_year = last_year_no_later_than(new Date(data_low)).getUTCFullYear()
      end_year = last_year_no_later_than(new Date(data_high)).getUTCFullYear()

      years = @basic_ticker.get_ticks_no_defaults(start_year, end_year, desired_n_ticks)

      all_ticks = (Date.UTC(year, 0, 1) for year in years)

      ticks_in_range = _.filter(all_ticks,
                                ((tick) -> data_low <= tick <= data_high))

      return ticks_in_range

    defaults: () ->
      return _.extend(super(), {
        toString_properties: ['years']
      })

  class YearsTickers extends Backbone.Collection
    model: YearsTicker

  return {
    "Model": YearsTicker,
    "Collection": new YearsTickers()
  }

import {BasicTicker} from "./basic_ticker"
import {SingleIntervalTicker} from "./single_interval_ticker"
import * as util from "./util"

last_year_no_later_than = util.last_year_no_later_than
ONE_YEAR = util.ONE_YEAR

export class YearsTicker extends SingleIntervalTicker
  type: 'YearsTicker'

  initialize: (attrs, options) ->
    super(attrs, options)
    @interval = ONE_YEAR
    @basic_ticker = new BasicTicker({num_minor_ticks:0})

  get_ticks_no_defaults: (data_low, data_high, cross_loc, desired_n_ticks) ->
    start_year = last_year_no_later_than(new Date(data_low)).getUTCFullYear()
    end_year = last_year_no_later_than(new Date(data_high)).getUTCFullYear()

    years = @basic_ticker.get_ticks_no_defaults(start_year, end_year, cross_loc, desired_n_ticks).major

    all_ticks = (Date.UTC(year, 0, 1) for year in years)
    ticks_in_range = all_ticks.filter((tick) -> data_low <= tick <= data_high)

    return {
      major: ticks_in_range
      minor: []
    }

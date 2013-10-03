
linear_axis = require('./linear_axis')
ticking = require('../../common/ticking')

class DatetimeAxisView extends linear_axis.LinearAxisView
  initialize: (attrs, options) ->
    super(attrs, options)

    @formatter = new ticking.DatetimeFormatter()

class DatetimeAxis extends linear_axis.LinearAxis
  default_view: DatetimeAxisView
  type: 'GuideRenderer'

  initialize: (attrs, options)->
    super(attrs, options)


class DatetimeAxes extends Backbone.Collection
  model: DatetimeAxis

exports.datetimeaxes = new DatetimeAxes()
exports.DatetimeAxis = DatetimeAxis
exports.DatetimeAxisView = DatetimeAxisView
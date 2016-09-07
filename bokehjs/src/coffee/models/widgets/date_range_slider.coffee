_ = require "underscore"
$ = require "jquery"
$1 = require "jqrangeslider/jQRangeSlider"
$6 = require "jqrangeslider/jQRangeSliderMouseTouch"
$3 = require "jqrangeslider/jQRangeSliderDraggable"
$2 = require "jqrangeslider/jQRangeSliderBar"
$4 = require "jqrangeslider/jQRangeSliderHandle"
$5 = require "jqrangeslider/jQRangeSliderLabel"
$7 = require "jqrangeslider/jQDateRangeSlider"
$8 = require "jqrangeslider/jQDateRangeSliderHandle"

p = require "../../core/properties"

InputWidget = require "./input_widget"


class DateRangeSliderView extends InputWidget.View

  initialize: (options) ->
    super(options)
    @$el.empty()
    [value_min, value_max] = @mget("value")
    [range_min, range_max] = @mget("range")
    [bounds_min, bounds_max] = @mget("bounds")

    @slider = $("<div>").dateRangeSlider({
      defaultValues: { min: new Date(value_min), max: new Date(value_max) },
      bounds: { min: new Date(bounds_min), max: new Date(bounds_max) },
      range: {
          min: if _.isObject(range_min) then range_min else false,
          max: if _.isObject(range_max) then range_max else false,
      },
      step: @mget("step") or {},
      # formatter
      # scales
      enabled: @mget("enabled"),
      arrows: @mget("arrows"),
      valueLabels: @mget("value_labels"),
      wheelMode: @mget("wheel_mode"),
    })

    @$el.on "userValuesChanged", (event, data) =>
      @mset('value', [Date(data.values.min), Date(data.values.max)])
      @mget('callback')?.execute(@model)

    @$el.append([@slider])
    return @

class DateRangeSlider extends InputWidget.Model
  type: "DateRangeSlider"
  default_view: DateRangeSliderView

  @define {
      # TODO (bev) types
      value:        [ p.Any            ]
      range:        [ p.Any            ]
      bounds:       [ p.Any            ]
      step:         [ p.Any,    {}     ]
      enabled:      [ p.Bool,   true   ]
      arrows:       [ p.Bool,   true   ]
      value_labels: [ p.String, "show" ]
      wheel_mode:   [ p.Any            ]
      ###
      formatter
      scales
      ###
    }

module.exports =
  Model: DateRangeSlider
  View: DateRangeSliderView

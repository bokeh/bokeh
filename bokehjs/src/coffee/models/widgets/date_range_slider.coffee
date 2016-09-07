_ = require "underscore"
$ = require "jquery"
$1 = require "jqrangeslider/jQDateRangeSlider"

p = require "../../core/properties"

InputWidget = require "./input_widget"


class DateRangeSliderView extends InputWidget.View

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', () => @render)

  render: () ->
    super()
    @$el.empty()

    [value_min, value_max] = @model.get("value")
    [range_min, range_max] = @model.get("range")
    [bounds_min, bounds_max] = @model.get("bounds")

    @$el.dateRangeSlider({
      defaultValues: { min: new Date(value_min), max: new Date(value_max) },
      bounds: { min: new Date(bounds_min), max: new Date(bounds_max) },
      range: {
          min: if _.isObject(range_min) then range_min else false,
          max: if _.isObject(range_max) then range_max else false,
      },
      step: @model.get("step") or {},
      # formatter
      # scales
      enabled: @model.get("enabled"),
      arrows: @model.get("arrows"),
      valueLabels: @model.get("value_labels"),
      wheelMode: @model.get("wheel_mode"),
    })

    @$el.on "userValuesChanged", (event, data) =>
      @mset('value', [data.values.min, data.values.max])
      @model.get('callback')?.execute(@model)

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

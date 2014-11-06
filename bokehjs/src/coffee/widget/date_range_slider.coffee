define [
  "underscore"
  "jquery"
  "jqrangeslider/jQDateRangeSlider"
  "common/collection"
  "common/continuum_view"
  "common/has_properties"
], (_, $, $1, Collection, ContinuumView, HasProperties) ->

  class DateRangeSliderView extends ContinuumView

    initialize : (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change', () => @render)

    render: () ->
      @$el.empty()

      [value_min, value_max] = @mget("value")
      [range_min, range_max] = @mget("range")
      [bounds_min, bounds_max] = @mget("bounds")

      @$el.dateRangeSlider({
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
        @mset('value', [data.values.min, data.values.max])
        @model.save()

  class DateRangeSlider extends HasProperties
    type: "DateRangeSlider"
    default_view: DateRangeSliderView
    defaults: ->
      return _.extend {}, super(), {
        ###
        value
        range
        bounds
        step
        formatter
        scales
        enabled
        arrows
        value_labels
        wheel_mode
        ###
      }

  class DateRangeSliders extends Collection
    model: DateRangeSlider

  return {
    Model: DateRangeSlider
    Collection: new DateRangeSliders()
    View: DateRangeSliderView
  }

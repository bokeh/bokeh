

define [
  "common/plot_widget",
  "common/has_parent"
], (PlotWidget, HasParent) ->

  class DataSliderView extends PlotWidget
    attributes:
      class: "dataslider pull-left"

    initialize: (options) ->
      super(options)
      @render_init()
      @select = _.throttle(@_select, 50)

    delegateEvents: (events) ->
      super(events)
      "pass"

    label: (min, max) ->
      @$(".minlabel").text(min)
      @$(".maxlabel").text(max)

    render_init: () ->
      @$el.html("")
      @$el.append("<div class='maxlabel'></div>")
      @$el.append("<div class='slider'></div>")
      @$el.append("<div class='minlabel'></div>")
      @plot_view.$(".plotarea").append(@$el)
      column = @mget_obj('data_source').getcolumn(@mget('field'))
      [min, max] = [_.min(column), _.max(column)]
      @$el.find(".slider").slider(
        orientation: "vertical",
        animate: "fast",
        step: (max - min) / 50.0 ,
        min: min
        max: max
        values: [min, max]
        slide: ( event, ui ) =>
          @set_selection_range(event, ui)
          @select(event, ui)
      )
      @label(min, max)
      @$el.find(".slider").height(@plot_view.view_state.get('inner_height'))

    set_selection_range: (event, ui) ->
      min = _.min(ui.values)
      max = _.max(ui.values)
      @label(min, max)
      data_source = @mget_obj('data_source')
      field = @mget('field')
      if not data_source.range_selections?
        data_source.range_selections = {}
      data_source.range_selections[field] = [min,max]

    _select: () ->
      data_source = @mget_obj('data_source')
      columns = {}
      numrows = 0
      for own colname, value of data_source.range_selections
        columns[colname] = data_source.getcolumn(colname)
        numrows = columns[colname].length
      selected = []
      for i in [0...numrows]
        select = true
        for own colname, value of data_source.range_selections
          [min, max] = value
          val = columns[colname][i]
          if val < min or val > max
            select = false
            break
        if select
          selected.push(i)
      data_source.save(
          selected:selected
        ,
          {patch: true}
      )

  class DataSlider extends HasParent
    type: "DataSlider"
    default_view: DataSliderView

    defaults: () ->
      return {
        data_source: null
        field: null
      }

    display_defaults: () ->
      return {
        level: 'tool'
      }

  class DataSliders extends Backbone.Collection
    model: DataSlider

  return {
    "Model": DataSlider
    "Collection": new DataSliders()
  }



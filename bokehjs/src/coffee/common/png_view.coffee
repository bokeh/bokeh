
define [
  "./continuum_view",
], (ContinuumView) ->

  class PNGView extends ContinuumView.View

    initialize: (options) ->
      super(options)
      @thumb_x = options.thumb_x or 40
      @thumb_y = options.thumb_y or 40
      @render()
      return this

    render: () ->
      @$el.html('')
      png = @model.get('png')
      @$el.append($("<p> #{@model.get('title')} </p>"))
      @$el.append($("<img modeltype='#{@model.type}' modelid='#{@model.get('id')}' class='pngview' width='#{@thumb_x}'  height='#{@thumb_y}'  src='#{png}'/>"))


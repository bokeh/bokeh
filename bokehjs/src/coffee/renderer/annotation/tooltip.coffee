
define [
  "underscore",
  "common/has_parent",
  "common/plot_widget",
  "common/collection",
], (_, HasParent, PlotWidget, Collection) ->

  class TooltipView extends PlotWidget

    initialize: (options) ->
      super(options)
      @div = $('<div class="bokeh_tooltip" />').appendTo(@plot_view.$el.find('.bokeh_canvas_wrapper'))
      @listenTo(@model, 'change:data', @_draw_tips)

    render: () ->

    _draw_tips: () ->
      @div.empty()
      @div.hide()

      if _.isEmpty(@mget('data'))
        return

      irh = @plot_view.frame.get('h_range')
      irv = @plot_view.frame.get('v_range')
      xstart = irh.get('start')
      xend = irh.get('end')
      ystart = irv.get('start')
      yend = irv.get('end')

      for val in @mget('data')
        [vx, vy, content] = val
        if vx < xstart  or vx > xend or vy < ystart or vy > yend
          continue
        tip = $('<div />').appendTo(@div)
        tip.append(content)
      sx = @plot_view.mget('canvas').vx_to_sx(vx)
      sy = @plot_view.mget('canvas').vy_to_sy(vy)
      ow = @plot_view.frame.get('width')
      if vx < ow/2
        @div.removeClass('right')
        @div.addClass('left')
        @div.css({
          top:  sy - @div.height()/2,
          left: sx + 18,
        })
      else
        @div.removeClass('left')
        @div.addClass('right')
        @div.css({
          top:  sy - @div.height()/2,
          left: sx - @div.width() - 23,
        })
      @div.show()

  class Tooltip extends HasParent
    default_view: TooltipView
    type: 'Tooltip'

    clear: () ->
      @set('data', [])

    add: (vx, vy, content) ->
      data = @get('data')
      data.push([vx, vy, content])
      @set('data', data)

    defaults: ->
      return _.extend {}, super(), {
        level: 'overlay'
        orientation: "auto"
      }

  class Tooltips extends Collection
    model: Tooltip

  return {
    "Model": Tooltip,
    "Collection": new Tooltips()
    "View": TooltipView,
  }

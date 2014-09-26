
define [
  "underscore"
  "common/has_parent"
  "common/plot_widget"
  "common/collection"
  "common/logging"
], (_, HasParent, PlotWidget, Collection, Logging) ->

  logger = Logging.logger

  class TooltipView extends PlotWidget

    initialize: (options) ->
      super(options)
      # TODO (bev) really probably need multiple divs
      @div = $('<div class="bokeh_tooltip" />').appendTo(@plot_view.$el.find('.bokeh_canvas_wrapper'))
      @div.hide()
      @listenTo(@model, 'change:data', @_draw_tips)

    render: () ->

    _draw_tips: () ->
      @div.empty()
      @div.hide()

      if _.isEmpty(@mget('data'))
        return

      for val in @mget('data')
        [vx, vy, content] = val
        if @mget('inner_only') and not @plot_view.frame.contains(vx, vy)
            continue
        tip = $('<div />').appendTo(@div)
        tip.append(content)
      sx = @plot_view.mget('canvas').vx_to_sx(vx)
      sy = @plot_view.mget('canvas').vy_to_sy(vy)

      side = @mget('side')
      if side == 'auto'
        ow = @plot_view.frame.get('width')
        if vx - @plot_view.frame.get('left') < ow/2
          side = 'right'
        else
          side = 'left'

      @div.removeClass('right')
      @div.removeClass('left')

      if side == "right"
        @div.addClass("left")
        top  = sy - @div.height()/2
        left = sx + 18
      else if side == "left"
        @div.addClass("right")
        top  = sy - @div.height()/2
        left = sx - @div.width() - 23
      else
        logger.warn("invalid tooltip side: '#{side}'")
        return

      # TODO (bev) this is not currently bulletproof. If there are
      # two hits, not colocated and one is off the screen, that can
      # be problematic
      if @div.children().length > 0
        @div.css({top: top, left: left})
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
        side: "auto"
        inner_only: true
      }

  class Tooltips extends Collection
    model: Tooltip

  return {
    "Model": Tooltip,
    "Collection": new Tooltips()
    "View": TooltipView,
  }

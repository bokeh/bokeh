$ = require "jquery"
_ = require "underscore"

Annotation = require "./annotation"
{logger} = require "../../core/logging"
p = require "../../core/properties"

class TooltipView extends Annotation.View
  className: "bk-tooltip"

  initialize: (options) ->
    super(options)
    # TODO (bev) really probably need multiple divs
    @$el.appendTo(@plot_view.$el.find('div.bk-canvas-overlays'))
    @$el.css({'z-index': 1010})
    @$el.hide()

  bind_bokeh_events: () ->
    @listenTo(@model, 'change:data', @_draw_tips)

  render: () ->
    @_draw_tips()

  _draw_tips: () ->
    @$el.empty()
    @$el.hide()

    @$el.toggleClass("bk-tooltip-custom", @mget("custom"))

    if _.isEmpty(@mget('data'))
      return

    for val in @mget('data')
      [vx, vy, content] = val
      if @mget('inner_only') and not @plot_view.frame.contains(vx, vy)
          continue
      tip = $('<div />').appendTo(@$el)
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

    @$el.removeClass('bk-right')
    @$el.removeClass('bk-left')

    arrow_width = 10

    switch side
      when "right"
        @$el.addClass("bk-left")
        left = sx + (@$el.outerWidth() - @$el.innerWidth()) + arrow_width
      when "left"
        @$el.addClass("bk-right")
        left = sx - @$el.outerWidth() - arrow_width

    top = sy - @$el.outerHeight()/2

    # TODO (bev) this is not currently bulletproof. If there are
    # two hits, not colocated and one is off the screen, that can
    # be problematic
    if @$el.children().length > 0
      @$el.css({top: top, left: left})
      @$el.show()

class Tooltip extends Annotation.Model
  default_view: TooltipView

  type: 'Tooltip'

  @define {
      side:       [ p.String, 'auto' ] # TODO (bev) enum?
      inner_only: [ p.Bool,   true   ]
  }

  @override {
    level: 'overlay'
  }

  @internal {
    data: [ p.Any ]
    custom: [ p.Any ]
  }

  clear: () ->
    @set('data', [])

  add: (vx, vy, content) ->
    data = @get('data')
    data.push([vx, vy, content])
    @set('data', data)



module.exports =
  Model: Tooltip
  View: TooltipView

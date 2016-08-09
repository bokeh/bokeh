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
    data = @model.data
    @$el.empty()
    @$el.hide()

    @$el.toggleClass("bk-tooltip-custom", @mget("custom"))

    if _.isEmpty(data)
      return

    for val in data
      [vx, vy, content] = val
      if @mget('inner_only') and not @plot_view.frame.contains(vx, vy)
          continue
      tip = $('<div />').appendTo(@$el)
      tip.append(content)
    sx = @plot_view.mget('canvas').vx_to_sx(vx)
    sy = @plot_view.mget('canvas').vy_to_sy(vy)

    attachment = @model.attachment
    switch attachment
      when "horizontal"
        width = @plot_view.frame.get('width')
        left = @plot_view.frame.get('left')
        if vx - left < width/2
          side = 'right'
        else
          side = 'left'
      when "vertical"
        height = @plot_view.frame.get('height')
        bottom = @plot_view.frame.get('bottom')
        if vy - bottom < height/2
          side = 'below'
        else
          side = 'above'
      else
        side = attachment

    @$el.removeClass('bk-right bk-left bk-above bk-below')

    arrow_size = 10 # XXX: keep in sync with less

    switch side
      when "right"
        @$el.addClass("bk-left")
        left = sx + (@$el.outerWidth() - @$el.innerWidth()) + arrow_size
        top = sy - @$el.outerHeight()/2
      when "left"
        @$el.addClass("bk-right")
        left = sx - @$el.outerWidth() - arrow_size
        top = sy - @$el.outerHeight()/2
      when "above"
        @$el.addClass("bk-above")
        top = sy + (@$el.outerHeight() - @$el.innerHeight()) + arrow_size
        left = Math.round(sx - @$el.outerWidth()/2)
      when "below"
        @$el.addClass("bk-below")
        top = sy - @$el.outerHeight() - arrow_size
        left = Math.round(sx - @$el.outerWidth()/2)

    if @model.show_arrow
        @$el.addClass("bk-tooltip-arrow")

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
    attachment: [ p.String, 'horizontal' ] # TODO enum: "horizontal" | "vertical" | "left" | "right" | "above" | "below"
    inner_only: [ p.Bool,   true         ]
    show_arrow: [ p.Bool,   true         ]
  }

  @override {
    level: 'overlay'
  }

  @internal {
    data:   [ p.Any, [] ]
    custom: [ p.Any     ]
  }

  clear: () ->
    @data = []

  add: (vx, vy, content) ->
    data = @data
    data.push([vx, vy, content])
    @data = data

    # TODO (bev) not sure why this is now necessary
    @trigger('change:data')

module.exports =
  Model: Tooltip
  View: TooltipView

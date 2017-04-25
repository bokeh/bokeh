import {Annotation, AnnotationView} from "./annotation"
import {div, show, hide, empty} from "core/dom"
import * as p from "core/properties"

export class TooltipView extends AnnotationView
  className: "bk-tooltip"

  initialize: (options) ->
    super(options)
    # TODO (bev) really probably need multiple divs
    @plot_view.canvas_overlays.appendChild(@el)
    @el.style.zIndex = 1010
    hide(@el)

  bind_bokeh_events: () ->
    @listenTo(@model, 'change:data', @_draw_tips)

  render: () ->
    if not @model.visible
      return
    @_draw_tips()

  _draw_tips: () ->
    data = @model.data
    empty(@el)
    hide(@el)

    if @model.custom
      @el.classList.add("bk-tooltip-custom")
    else
      @el.classList.remove("bk-tooltip-custom")

    if data.length == 0
      return

    for val in data
      [vx, vy, content] = val
      if @model.inner_only and not @plot_view.frame.contains(vx, vy)
          continue
      tip = div({}, content)
      @el.appendChild(tip)
    sx = @plot_view.model.canvas.vx_to_sx(vx)
    sy = @plot_view.model.canvas.vy_to_sy(vy)

    attachment = @model.attachment
    switch attachment
      when "horizontal"
        width = @plot_view.frame.width
        left = @plot_view.frame.left
        if vx - left < width/2
          side = 'right'
        else
          side = 'left'
      when "vertical"
        height = @plot_view.frame.height
        bottom = @plot_view.frame.bottom
        if vy - bottom < height/2
          side = 'below'
        else
          side = 'above'
      else
        side = attachment

    @el.classList.remove("bk-right")
    @el.classList.remove("bk-left")
    @el.classList.remove("bk-above")
    @el.classList.remove("bk-below")

    arrow_size = 10 # XXX: keep in sync with less

    show(@el) # XXX: {offset,client}Width() gives 0 when display="none"

    switch side
      when "right"
        @el.classList.add("bk-left")
        left = sx + (@el.offsetWidth - @el.clientWidth) + arrow_size
        top = sy - @el.offsetHeight/2
      when "left"
        @el.classList.add("bk-right")
        left = sx - @el.offsetWidth - arrow_size
        top = sy - @el.offsetHeight/2
      when "above"
        @el.classList.add("bk-above")
        top = sy + (@el.offsetHeight - @el.clientHeight) + arrow_size
        left = Math.round(sx - @el.offsetWidth/2)
      when "below"
        @el.classList.add("bk-below")
        top = sy - @el.offsetHeight - arrow_size
        left = Math.round(sx - @el.offsetWidth/2)

    if @model.show_arrow
        @el.classList.add("bk-tooltip-arrow")

    # TODO (bev) this is not currently bulletproof. If there are
    # two hits, not colocated and one is off the screen, that can
    # be problematic
    if @el.childNodes.length > 0
      @el.style.top = "#{top}px"
      @el.style.left = "#{left}px"
    else
      hide(@el)

export class Tooltip extends Annotation
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

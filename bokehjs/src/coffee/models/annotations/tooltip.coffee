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

  connect_signals: () ->
    super()
    @connect(@model.properties.data.change, () -> @_draw_tips())

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

    frame = @plot_view.frame

    for val in data
      [sx, sy, content] = val
      if @model.inner_only and not frame.bbox.contains(sx, sy)
          continue
      tip = div({}, content)
      @el.appendChild(tip)

    attachment = @model.attachment
    switch attachment
      when "horizontal"
        side = if sx < frame._hcenter.value then 'right' else 'left'
      when "vertical"
        side = if sy < frame._vcenter.value then 'below' else 'above'
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

  add: (sx, sy, content) ->
    data = @data
    data.push([sx, sy, content])
    @data = data

    # TODO (bev) not sure why this is now necessary
    @properties.data.change.emit()

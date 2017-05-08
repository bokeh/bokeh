import * as p from "core/properties"

import {AbstractIcon} from "models/widgets/abstract_icon"
import {WidgetView} from "models/widgets/widget"

import "./fontawesome.less"

export class FontAwesomeIconView extends WidgetView
  tagName: "span"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    @el.className = "" # erase all CSS classes if re-rendering

    @el.classList.add("bk-u-fa")
    @el.classList.add("bk-u-fa-#{@model.icon_name}")

    @el.style.fontSize = "#{@model.size}em"

    if @model.flip?
      @el.classList.add("bk-u-fa-flip-#{@model.flip}")

    if @model.spin
      @el.classList.add("bk-u-fa-spin")

    return @

export class FontAwesomeIcon extends AbstractIcon
  type: "FontAwesomeIcon"
  default_view: FontAwesomeIconView

  @define {
    icon_name: [ p.String, "check" ] # TODO (bev) enum?
    size:      [ p.Number, 1       ]
    flip:      [ p.Any             ] # TODO (bev)
    spin:      [ p.Bool,   false   ]
  }

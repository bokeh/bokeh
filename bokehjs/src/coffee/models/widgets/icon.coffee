import * as _ from "underscore"

import * as p from "../../core/properties"

import {AbstractIcon} from "./abstract_icon"
import {WidgetView} from "./widget"

export class IconView extends WidgetView
  tagName: "i"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    @$el.empty()
    @$el.addClass("bk-fa")
    @$el.addClass("bk-fa-" + @model.icon_name)
    size = @model.size
    if size? then @$el.css("font-size": size + "em")
    flip = @model.flip
    if flip? then @$el.addClass("bk-fa-flip-" + flip)
    if @model.spin
      @$el.addClass("bk-fa-spin")
    return @

  update_constraints: () ->
    null


export class Icon extends AbstractIcon
  type: "Icon"
  default_view: IconView

  @define {
      icon_name: [ p.String, "check" ] # TODO (bev) enum?
      size:      [ p.Number          ]
      flip:      [ p.Any             ] # TODO (bev)
      spin:      [ p.Bool,   false   ]
    }

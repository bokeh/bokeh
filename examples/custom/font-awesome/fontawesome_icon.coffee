import * as _ from "underscore"

import * as p from "core/properties"

import {AbstractIcon} from "models/widgets/abstract_icon"
import {WidgetView} from "models/widgets/widget"

import "./fontawesome.less"

export class FontAwesomeIconView extends WidgetView
  tagName: "i"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    @$el.empty()
    @$el.addClass("bk-u-fa")
    @$el.addClass("bk-u-fa-" + @model.icon_name)
    size = @model.size
    if size? then @$el.css("font-size": size + "em")
    flip = @model.flip
    if flip? then @$el.addClass("bk-u-fa-flip-" + flip)
    if @model.spin
      @$el.addClass("bk-u-fa-spin")
    return @

  update_constraints: () -> null

export class FontAwesomeIcon extends AbstractIcon
  type: "FontAwesomeIcon"
  default_view: FontAwesomeIconView

  @define {
    icon_name: [ p.String, "check" ] # TODO (bev) enum?
    size:      [ p.Number          ]
    flip:      [ p.Any             ] # TODO (bev)
    spin:      [ p.Bool,   false   ]
  }

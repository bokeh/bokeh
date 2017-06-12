import * as p from "core/properties"
import {empty, prepend, nbsp, button} from "core/dom"

import {build_views, remove_views} from "core/build_views"
import {Widget, WidgetView} from "./widget"

export class AbstractButtonView extends WidgetView

  initialize: (options) ->
    super(options)
    @icon_views = {}
    @connect(@model.change, () -> @render())
    @render()

  remove: () ->
    remove_views(@icon_views)
    super()

  template: () ->
    return button({
      type: "button",
      disabled: @model.disabled,
      class: ["bk-bs-btn", "bk-bs-btn-#{@model.button_type}"],
    }, @model.label)

  render: () ->
    super()

    empty(@el)
    @buttonEl = buttonEl = @template()
    @el.appendChild(buttonEl)

    icon = @model.icon
    if icon?
      build_views(@icon_views, [icon], {parent: @})
      prepend(buttonEl, @icon_views[icon.id].el, nbsp)

    return @

  change_input: () ->
    @model.callback?.execute(@model)

export class AbstractButton extends Widget
  type: "AbstractButton"
  default_view: AbstractButtonView

  @define {
    callback:    [ p.Instance          ]
    label:       [ p.String, "Button"  ]
    icon:        [ p.Instance          ]
    button_type: [ p.String, "default" ] # TODO (bev)
  }

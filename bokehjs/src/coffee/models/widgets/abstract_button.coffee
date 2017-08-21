import * as p from "core/properties"
import {empty, prepend, nbsp, button} from "core/dom"

import {build_views, remove_views} from "core/build_views"
import {Widget, WidgetView} from "./widget"

export class AbstractButtonView extends WidgetView

  initialize: (options) ->
    super(options)
    @icon_views = {}
    @render()

  connect_signals: () ->
    super()
    @connect(@model.change, () -> @render())

  remove: () ->
    remove_views(@icon_views)
    super()

  _render_button: (children...) ->
    return button({
      type: "button",
      disabled: @model.disabled,
      class: ["bk-bs-btn", "bk-bs-btn-#{@model.button_type}"],
    }, children...)

  render: () ->
    super()

    empty(@el)
    @buttonEl = @_render_button(@model.label)
    @buttonEl.addEventListener("click", (event) => @_button_click(event))
    @el.appendChild(@buttonEl)

    icon = @model.icon
    if icon?
      build_views(@icon_views, [icon], {parent: @})
      prepend(@buttonEl, @icon_views[icon.id].el, nbsp)

    return @

  _button_click: (event) ->
    event.preventDefault()
    @change_input()

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

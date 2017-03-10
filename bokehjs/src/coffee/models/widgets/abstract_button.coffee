import * as p from "core/properties"

import {build_views} from "core/build_views"
import {Widget, WidgetView} from "./widget"
import template from "./button_template"


export class AbstractButtonView extends WidgetView
  events:
    "click": "change_input"
  template: template

  initialize: (options) ->
    super(options)
    @icon_views = {}
    @listenTo(@model, 'change', @render)
    @render()

  remove: () ->
    for _, view of @icon_views
      view.remove()
    @icon_views = {}

    super()

  render: () ->
    super()

    icon = @model.icon
    if icon?
      build_views(@icon_views, [icon])
      for own key, val of @icon_views
        val.el.parentNode?.removeChild(val.el)

    @$el.empty()
    html = @template(@model.attributes)
    @el.appendChild(html)

    $button = @$el.find('button')

    if icon?
      $button.prepend("&nbsp;")
      $button.prepend(@icon_views[icon.id].$el)

    $button.prop("disabled", @model.disabled)

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

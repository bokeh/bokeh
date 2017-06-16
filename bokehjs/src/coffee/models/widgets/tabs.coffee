import * as p from "core/properties"
import {empty} from "core/dom"
import {zip, findIndex} from "core/util/array"

import tabs_template from "./tabs_template"
import {Widget, WidgetView} from "./widget"

export class TabsView extends WidgetView

  render: () ->
    super()
    for own _key, child of @child_views
      child.el.parentNode?.removeChild(child.el)

    empty(@el)

    tabs = @model.tabs
    active = @model.active
    children = @model.children

    html = tabs_template({
      tabs: tabs
      active_tab_id: tabs[active].id
    })

    html.querySelectorAll(".bk-bs-nav a").addEventListener "click", (event) =>
      el = event.currentTarget
      event.preventDefault()
      @show(el)
      panelId = el.href.replace('#tab-', '')
      tabs = @model.tabs
      panelIdx = findIndex(tabs, (panel) -> panel.id == panelId)
      @model.active = panelIdx
      @model.callback?.execute(@model)

    panels = html.querySelectorAll(".bk-bs-tab-pane")

    for [child, panel] in zip(children, panels)
      empty(panel)
      panel.appendChild(@child_views[child.id].el)

    @el.appendChild(html)
    return @

  show: (tab) ->
    # TODO

export class Tabs extends Widget
  type: "Tabs"
  default_view: TabsView

  @define {
    tabs:     [ p.Array,   [] ]
    active:   [ p.Number,  0  ]
    callback: [ p.Instance    ]
  }

  @getters {
    children: () -> (tab.child for tab in @tabs)
  }

  get_layoutable_children: () ->
    return @children

  get_edit_variables: () ->
    edit_variables = super()
    # Go down the children to pick up any more constraints
    for child in @get_layoutable_children()
      edit_variables = edit_variables.concat(child.get_edit_variables())
    return edit_variables

  get_constraints: () ->
    constraints = super()
    # Go down the children to pick up any more constraints
    for child in @get_layoutable_children()
      constraints = constraints.concat(child.get_constraints())
    return constraints

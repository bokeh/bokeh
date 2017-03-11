import * as $ from "jquery"
import "bootstrap/tab"

import * as p from "core/properties"
import {zip, findIndex} from "core/util/array"

import tabs_template from "./tabs_template"
import {Widget, WidgetView} from "./widget"

export class TabsView extends WidgetView

  render: () ->
    super()
    for own _key, child of @child_views
      child.el.parentNode?.removeChild(child.el)
    @$el.empty()

    tabs = @model.tabs
    active = @model.active
    children = @model.children

    html = $(tabs_template({
      tabs: tabs
      active_tab_id: tabs[active].id
    }))

    that = this
    html.find(".bk-bs-nav a").click (event) ->
      event.preventDefault()
      $(this).tab('show')
      panelId = $(this).attr('href').replace('#tab-','')
      tabs = that.model.tabs
      panelIdx = findIndex(tabs, (panel) -> panel.id == panelId)
      that.model.active = panelIdx
      that.model.callback?.execute(that.model)

    $panels = html.find(".bk-bs-tab-pane")

    for [child, panel] in zip(children, $panels)
      $(panel).html(@child_views[child.id].el)

    @$el.append(html)
    return @

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

import * as _ from "underscore"
import * as $ from "jquery"
import "bootstrap/tab"

import * as p from "../../core/properties"

import tabs_template from "./tabs_template"
import {Widget, WidgetView} from "./widget"

export class TabsView extends WidgetView

  render: () ->
    super()
    for own key, val of @child_views
      val.$el.detach()
    @$el.empty()

    tabs = @model.tabs
    active = @model.active
    children = @model.children

    html = $(tabs_template({
      tabs: tabs
      active_tab_id: tabs[active].id
    }))

    that = this
    html.find("> li > a").click (event) ->
      event.preventDefault()
      $(this).tab('show')
      panelId = $(this).attr('href').replace('#tab-','')
      tabs = that.model.tabs
      panelIdx = _.indexOf(tabs, _.find(tabs, (panel) ->
        return panel.id == panelId
      ))
      that.model.active = panelIdx
      that.model.callback?.execute(that.model)

    $panels = html.children(".bk-bs-tab-pane")

    for [child, panel] in _.zip(children, $panels)
      $(panel).html(@child_views[child.id].$el)

    @$el.append(html)
    @$el.tabs
    return @

export class Tabs extends Widget
  type: "Tabs"
  default_view: TabsView

  initialize: (options) ->
    super(options)
    @children = (tab.child for tab in @tabs)

  @define {
      tabs:     [ p.Array,   [] ]
      active:   [ p.Number,  0  ]
      callback: [ p.Instance    ]
    }

  @internal {
      children: [ p.Array,   [] ]
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

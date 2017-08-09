import {empty, ul, li, span, div} from "core/dom"
import {zip} from "core/util/array"
import * as p from "core/properties"

import {Widget, WidgetView} from "./widget"

export class TabsView extends WidgetView

  connect_signals: () ->
    super()
    @connect(@model.properties.tabs.change, () => @rebuild_child_views())

  render: () ->
    super()
    empty(@el)

    len = @model.tabs.length
    if len == 0
      return
    else if @model.active >= len
      @model.active = len - 1

    tabs = @model.tabs.map((tab, i) -> li({}, span({data: {index: i}}, tab.title)))
    tabs[@model.active].classList.add("bk-bs-active")
    tabsEl = ul({class: ["bk-bs-nav", "bk-bs-nav-tabs"]}, tabs)
    @el.appendChild(tabsEl)

    panels = @model.tabs.map((tab) -> div({class: "bk-bs-tab-pane"}))
    panels[@model.active].classList.add("bk-bs-active")
    panelsEl = div({class: "bk-bs-tab-content"}, panels)
    @el.appendChild(panelsEl)

    tabsEl.addEventListener "click", (event) =>
      event.preventDefault()

      if event.target != event.currentTarget
        el = event.target

        old_active = @model.active
        new_active = parseInt(el.dataset.index)

        if old_active != new_active
          tabs[old_active].classList.remove("bk-bs-active")
          panels[old_active].classList.remove("bk-bs-active")

          tabs[new_active].classList.add("bk-bs-active")
          panels[new_active].classList.add("bk-bs-active")

          @model.active = new_active
          @model.callback?.execute(@model)

    for [child, panelEl] in zip(@model.children, panels)
      panelEl.appendChild(@child_views[child.id].el)

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

  get_layoutable_children: () -> @children

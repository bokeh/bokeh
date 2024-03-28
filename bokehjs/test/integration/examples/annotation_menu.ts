import {display} from "../_util"

import {figure} from "@bokehjs/api/plotting"
import {Spectral11 as Palette} from "@bokehjs/api/palettes"
import {f} from "@bokehjs/api/expr"
import type {Data} from "@bokehjs/core/types"
import {assert} from "@bokehjs/core/util/assert"
import {entries} from "@bokehjs/core/util/object"
import {Random} from "@bokehjs/core/util/random"
import {color2hex} from "@bokehjs/core/util/color"
import {filter} from "@bokehjs/core/util/arrayable"
import {BoxSelectTool, ActionItem, CheckableItem, DividerItem, Menu} from "@bokehjs/models"

const Spectral11 = Palette.map(color2hex)

describe("Examples", () => {
  it("should support AnnotationMenu", async () => {
    const random = new Random(1)

    const N = 1000
    const x = f`${random.floats(N)}*${100}`
    const y = f`${random.floats(N)}*${100}`
    const radii = f`${random.floats(N)}*${1.5}`
    const colors = random.choices(N, Spectral11)

    const plot = figure({active_scroll: "wheel_zoom"})
    const renderer = plot.circle(x, y, radii, {fill_color: colors, fill_alpha: 0.6, line_color: null})

    const box_select = new BoxSelectTool({persistent: true})
    plot.add_tools(box_select)

    const delete_selected = () => {
      const {data, selected} = renderer.data_source
      const indices = new Set(selected.indices)

      const new_data: Data = {}
      for (const [name, column] of entries(data)) {
        new_data[name] = filter(column, (_value, i) => !indices.has(i))
      }

      renderer.data_source.data = new_data
      renderer.data_source.selected.indices = [] // TODO bug in ds update
    }

    const change_color = (_menu: Menu, {item}: {item: ActionItem}) => {
      const {data, selected} = renderer.data_source
      const indices = new Set(selected.indices)
      const selected_color = item.label

      const fill_color = [...renderer.data_source.get("fill_color")]
      for (const i of indices) {
        fill_color[i] = selected_color
      }
      renderer.data_source.data = {...data, fill_color}
    }

    const change_continuous = (_menu: Menu, {item}: {item: ActionItem}) => {
      assert(item instanceof CheckableItem)
      const {continuous} = box_select
      box_select.continuous = item.checked = !continuous
    }

    const invert_selection = () => {
      renderer.selection_manager.invert()
    }

    const clear_selection = () => {
      box_select.overlay.visible = false
      renderer.data_source.selected.indices = []
    }

    const menu = new Menu({
      items: [
        new ActionItem({
          label: "Count",
          shortcut: "Alt+C",
          disabled: true,
          action: () => console.log("not implemented"),
        }),
        new ActionItem({
          label: "Delete",
          shortcut: "Alt+Shift+D",
          icon: "delete",
          action: delete_selected,
        }),
        new DividerItem(),
        new ActionItem({
          label: "Choose color",
          menu: new Menu({
            stylesheets: [
              Spectral11.map((color) => `.color-${color.replace(/^#/, "")} { background-color: ${color}; }`).join("\n"),
              ".bk-label { font-family: monospace; }",
            ],
            items: Spectral11.map((color) => {
              return new ActionItem({
                label: color,
                icon: `.color-${color.replace(/^#/, "")}`,
                action: change_color,
              })
            }),
          }),
        }),
        new DividerItem(),
        new CheckableItem({
          label: "Continuous selection",
          checked: box_select.continuous,
          action: change_continuous,
        }),
        new DividerItem(),
        new ActionItem({
          icon: "invert_selection",
          label: "Invert selection",
          action: invert_selection,
        }),
        new ActionItem({
          icon: "clear_selection",
          label: "Clear selection",
          shortcut: "Esc",
          action: clear_selection,
        }),
      ],
    })
    box_select.overlay.context_menu = menu

    await display(plot)
  })
})

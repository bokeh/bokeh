import {display} from "../_util"

import {figure} from "@bokehjs/api/plotting"
import {Spectral11 as Palette} from "@bokehjs/api/palettes"
import {f} from "@bokehjs/api/expr"
import type {Data} from "@bokehjs/core/types"
import {entries} from "@bokehjs/core/util/object"
import {Random} from "@bokehjs/core/util/random"
import {color2hex} from "@bokehjs/core/util/color"
import {filter} from "@bokehjs/core/util/arrayable"
import {Row, Panel, BoxSelectTool} from "@bokehjs/models"
import {Button, PaletteSelect} from "@bokehjs/models/widgets"

const Spectral11 = Palette.map(color2hex)

describe("Examples", () => {
  it("should support CustomSelectionToolbar", async () => {
    const random = new Random(1)

    function plot(N: number) {
      const x = f`${random.floats(N)}*${100}`
      const y = f`${random.floats(N)}*${100}`
      const radii = f`${random.floats(N)}*${1.5}`
      const colors = random.choices(N, Spectral11)

      const p = figure({active_scroll: "wheel_zoom", lod_threshold: null, title: `Plot with N=${N} circles`})
      const renderer = p.circle(x, y, radii, {fill_color: colors, fill_alpha: 0.6, line_color: null})

      return [p, renderer] as const
    }

    const [p, renderer] = plot(500)

    const box_select = new BoxSelectTool({persistent: true})
    p.add_tools(box_select)

    const common = {margin: 0, sizing_mode: "stretch_height" as const}

    const remove = new Button({label: "Delete", ...common})
    const select = new PaletteSelect({
      value: Spectral11[0],
      items: Spectral11.map((color) => [color, [color]]),
      swatch_width: 30,
      ...common,
    })
    const clear = new Button({label: "Clear", ...common})

    const toolbar = new Panel({
      position: box_select.overlay.nodes.bottom_left,
      anchor: "top_left",
      width: box_select.overlay.nodes.width,
      elements: [
        new Row({
          children: [remove, select, clear],
          spacing: 5,
        }),
      ],
      stylesheets: [`
        :host {
          background-color: rgb(221 221 221 / 0.5);
          padding: 5px;
        }
      `],
    })
    box_select.overlay.elements.push(toolbar)

    remove.on_click(() => {
      const {data, selected} = renderer.data_source
      const indices = new Set(selected.indices)

      const new_data: Data = {}
      for (const [name, column] of entries(data)) {
        new_data[name] = filter(column, (_value, i) => !indices.has(i))
      }

      renderer.data_source.data = new_data
      renderer.data_source.selected.indices = [] // TODO bug in ds update
    })

    select.on_change(select.properties.value, () => {
      const {data, selected} = renderer.data_source
      const indices = new Set(selected.indices)
      const selected_color = select.value

      const fill_color = [...renderer.data_source.get("fill_color")]
      for (const i of indices) {
        fill_color[i] = selected_color
      }
      renderer.data_source.data = {...data, fill_color}
    })

    clear.on_click(() => {
      box_select.overlay.visible = false
      renderer.data_source.selected.indices = []
    })

    await display(p)
  })
})

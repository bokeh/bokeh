import {display} from "../_util"

import {figure} from "@bokehjs/api/plotting"
import {Spectral11} from "@bokehjs/api/palettes"
import {f} from "@bokehjs/api/expr"
import {Random} from "@bokehjs/core/util/random"
import {Column, Row, Panel, XY, TapTool} from "@bokehjs/models"
import {Button, Select, Slider, TextInput} from "@bokehjs/models/widgets"

describe("Examples", () => {
  it("should support InlineDataEntry", async () => {
    const random = new Random(1)

    function plot(N: number) {
      const x = f`${random.floats(N)}*${100}`
      const y = f`${random.floats(N)}*${100}`
      const radii = f`${random.floats(N)}*${1.5}`
      const colors = random.choices(N, Spectral11)

      const p = figure({active_scroll: "wheel_zoom", lod_threshold: null, title: `Plot with N=${N} circles`})
      p.circle(x, y, radii, {fill_color: colors, fill_alpha: 0.6, line_color: null})

      return p
    }

    const p = plot(500)

    const data_entry = new Panel({
      position: new XY({x: NaN, y: NaN}),
      anchor: "top_left",
      stylesheets: [`
        :host {
            background-color: white;
            padding: 1em;
            border-radius: 0.5em;
            border: 1px solid lightgrey;
        }
      `],
      elements: [
        new Column({
          children: [
            new TextInput({title: "Text input"}),
            new Slider({title: "Number slider", start: 0, end: 10, step: 1, value: 5}),
            new Select({value: "Category 1", options: ["Category 1", "Category 2", "Category 3"]}),
            new Row({
              children: [
                new Button({label: "Save", button_type: "primary"}),
                new Button({label: "Cancel"}),
              ],
            }),
          ],
        }),
      ],
    })
    p.elements.push(data_entry)

    const tap_tool = new TapTool({
      behavior: "inspect",
      callback: (_tool, {geometries: {x, y}}) => data_entry.position.setv({x, y}),
    })
    p.add_tools(tap_tool)

    await display(p)
  })
})

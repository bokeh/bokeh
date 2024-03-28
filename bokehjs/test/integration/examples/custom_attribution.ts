import {display} from "../_util"

import {figure} from "@bokehjs/api/plotting"
import {Spectral11} from "@bokehjs/api/palettes"
import {f} from "@bokehjs/api/expr"
import {Random} from "@bokehjs/core/util/random"
import {Panel, Node} from "@bokehjs/models"
import {HTML} from "@bokehjs/models/dom"

describe("Examples", () => {
  it("should support CustomAttribution", async () => {
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

    const attribution = new Panel({
      position: new Node({target: "frame", symbol: "bottom_left"}),
      anchor: "bottom_left",
      css_variables: {
        "--max-width": new Node({target: "frame", symbol: "width"}),
      },
      stylesheets: [`
        :host {
          padding: 2px;
          background-color: rgba(211, 211, 211, 0.7);
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: var(--max-width);
        }
      `],
      elements: [
        new HTML({html: "&copy; np.<b>random</b>()"}),
      ],
    })
    p.elements.push(attribution)

    await display(p)
  })
})

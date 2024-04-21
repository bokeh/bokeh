import {display} from "../_util"

import {figure} from "@bokehjs/api/plotting"
import {Spectral11} from "@bokehjs/api/palettes"
import {f} from "@bokehjs/api/expr"
import {Random} from "@bokehjs/core/util/random"

describe("Examples", () => {
  it("should support CSSVariables", async () => {
    const random = new Random(1)

    const N = 500
    const x = f`${random.floats(N)}*${100}`
    const y = f`${random.floats(N)}*${100}`
    const radii = f`${random.floats(N)}*${1.5}`
    const colors = random.choices(N, Spectral11)

    const p = figure({active_scroll: "wheel_zoom", lod_threshold: null, title: "Plot styling with CSS variables"})
    p.circle(x, y, radii, {fill_color: colors, fill_alpha: 0.6, line_color: null})

    p.stylesheets.push(`
    :host {
        /* plot background */
        --bk-background-fill-color: azure;

        /* common axis line dash */
        --bk-axis-line-dash: dotted;

        /* common axis tick colors */
        --tick-color: red;
        --bk-major-tick-line-color: var(--tick-color);
        --bk-minor-tick-line-color: var(--tick-color);
    }
    `)

    for (const axis of p.xaxes) {
      axis.stylesheets.push(`
      :host {
          /* x-axis background color */
          --bk-background-fill-color: yellow;

          /* x-axis major label styling */
          --bk-major-label-text-font-style: bold;
      }
      `)
    }

    for (const axis of p.yaxes) {
      axis.stylesheets.push(`
      :host {
          /* y-axis background color */
          --bk-background-fill-color: pink;

          /* y-axis major label styling */
          --bk-major-label-text-font-size: 1.25em;
      }
      `)
    }

    await display(p)
  })
})

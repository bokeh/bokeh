import {display} from "../_util"

import {figure} from "@bokehjs/api/plotting"
import {zip} from "@bokehjs/core/util/array"
import {Random} from "@bokehjs/core/util/random"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {f} from "@bokehjs/api/expr"

describe("Examples", () => {
  it("should support ColorScatter", async () => {
    const random = new Random(1)

    const N = 4000
    const x = f`${random.floats(N)}*${100}`
    const y = f`${random.floats(N)}*${100}`
    const radii = f`${random.floats(N)}*${1.5}`
    const colors = ndarray(zip(f`${50} + ${2}*${x}`, f`${30} + ${2}*${y}`).flatMap(([r, g]) => [r, g, 150]), {shape: [N, 3], dtype: "uint8"})

    const TOOLS = "hover,crosshair,pan,wheel_zoom,zoom_in,zoom_out,box_zoom,undo,redo,reset,tap,save,box_select,poly_select,lasso_select,examine,help"

    const p = figure({tools: TOOLS})
    p.circle({x, y, radius: radii, fill_color: colors, fill_alpha: 0.6, line_color: null})

    await display(p)
  })
})

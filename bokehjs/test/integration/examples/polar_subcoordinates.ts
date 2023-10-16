import {display, fig} from "../_util"

import type {GlyphAPI} from "@bokehjs/api/glyph_api"
import {f} from "@bokehjs/api/expr"
import {np} from "@bokehjs/api/linalg"

import {range} from "@bokehjs/core/util/array"
import {values} from "@bokehjs/core/util/object"
import {Fraction} from "@bokehjs/core/util/math"
import {brightness} from "@bokehjs/core/util/color"
import {named_colors} from "@bokehjs/core/util/svg_colors"
import {unreachable} from "@bokehjs/core/util/assert"

import type {Color} from "@bokehjs/core/types"

import {ColumnDataSource, Range1d, PolarTransform} from "@bokehjs/models"

describe("Examples", () => {
  it("should support PolarSubcoordinates", async () => {
    const color_map: Map<string, Color> = new Map()

    const dark_colors = (function* () {
      for (const color of values(named_colors)) {
        if (brightness(color) < 0.6) {
          yield color
        }
      }
      unreachable()
    })()

    function rose(xy: GlyphAPI, k: Fraction, A: number = 1): void {
      const n = k.numer
      const d = k.denom

      const T = d*(n*d % 2 == 0 ? 2 : 1)

      const angle = np.linspace(0, T*np.pi, T*100)
      const radius = f`${A}*np.cos(${k}*${angle})`

      const source = new ColumnDataSource({data: {radius, angle}})
      const t = new PolarTransform()

      // XXX: Map keys are compared by reference
      const hash = k.toString()
      if (!color_map.has(hash)) {
        color_map.set(hash, dark_colors.next().value)
      }

      const color = color_map.get(hash)
      xy.line({expr: t.x}, {expr: t.y}, {line_color: color, source}) // TODO: expr convenience
    }

    const [N, D] = [9, 9]
    const h = 0.5

    const plot = fig([N*100, D*100], {
      x_range: [1 - h, N + h],
      y_range: [D + h, 1 - h],
    })

    for (const d of range(1, D + 1)) {
      for (const n of range(1, N + 1)) {
        const xy = plot.subplot({
          x_source: new Range1d({start: -1, end: 1}),
          y_source: new Range1d({start: -1, end: 1}),
          x_target: new Range1d({start: n - h, end: n + h}),
          y_target: new Range1d({start: d - h, end: d + h}),
        })
        rose(xy, new Fraction(n, d))
      }
    }

    await display(plot)
  })
})

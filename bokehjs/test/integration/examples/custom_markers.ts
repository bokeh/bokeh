import {display} from "../_util"

import {figure} from "@bokehjs/api/plotting"
import {f} from "@bokehjs/api/expr"
import {MarkerType} from "@bokehjs/core/enums"
import {enumerate} from "@bokehjs/core/util/iterator"
import {Random} from "@bokehjs/core/util/random"
import {CustomJS, DataRange1d} from "@bokehjs/models"

describe("Examples", () => {
  it("should support CustomMarkers", async () => {
    const random = new Random(1)

    // custom marker producing a Path2D object
    const bowtie = new CustomJS({code: `\
    const SQ3 = Math.sqrt(3)

    export default (args, obj, {r}) => {
        const h = r*SQ3
        const a = h/3

        const path = new Path2D()
        path.moveTo(0, 0)
        path.lineTo(-h, a)
        path.lineTo(-h, -a)
        path.lineTo(h, a)
        path.lineTo(h, -a)
        path.closePath()

        return path
    }
    `})

    // custom marker painting using Context2d and visuals
    const wheel = new CustomJS({code: `\
    const {PI} = Math

    export default (args, obj, {ctx, i, r, visuals}) => {
        ctx.arc(0, 0, r, 0, 2*Math.PI, false)

        for (let j = 0; j < 4; j++) {
            ctx.moveTo(0, r)
            ctx.lineTo(0, -r)
            ctx.rotate(PI/3)
        }
        ctx.rotate(-4*PI/3)

        visuals.fill.apply(ctx, i)
        visuals.hatch.apply(ctx, i)
        visuals.line.apply(ctx, i)
    }
    `})

    const y_range = new DataRange1d({flipped: true})
    const p = figure({title: "Bokeh & Custom Markers", y_range, toolbar_location: null, width: 600, height: 800})

    p.grid.grid_line_color = null
    p.background_fill_color = "#eeeeee"
    p.axis.visible = false

    const N = 10
    const markers = [...MarkerType, "@bowtie" as const, "@wheel" as const]

    for (const [marker, i] of enumerate(markers)) {
      const x = i % 4
      const y = Math.floor(i / 4)*4 + 1

      p.scatter({
        x: f`${random.floats(N)} + 2*${x}`, y: f`${random.floats(N)} + ${y}`, marker, size: 14,
        line_color: "navy", fill_color: "orange", alpha: 0.5,
        defs: {
          "@bowtie": bowtie,
          "@wheel": wheel,
        },
      })

      p.text({
        x: 2*x + 0.5, y: y + 2.5, text: [marker],
        text_color: "firebrick", text_align: "center", text_font_size: "13px",
      })
    }

    await display(p)
  })
})

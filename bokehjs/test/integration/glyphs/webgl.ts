import {display, fig, row} from "../_util"
import {LineCap, LineJoin} from "@bokehjs/core/enums"

describe("webgl", () => {
  it("should support nan in line", async () => {
    const x0 = [0, 0.3, 0.6, 0.9, 0.95, 1.0]
    const x1 = [0, 0.3, NaN, 0.9, 0.95, 1.0]
    const y = [1, 0.9, 0.9, 1.0, 0.0, 1.0]

    const p0 = fig([300, 300], {output_backend: 'webgl', title: 'All finite'})
    const p1 = fig([300, 300], {output_backend: 'webgl', title: 'With NaN'})

    p0.line(x0, y)
    p1.line(x1, y)

    await display(row([p0, p1]))
  })

  it("should look similar to canvas for solid lines", async () => {
    // If you need to recreate the baseline image, do so using 'canvas' and then
    // revert to 'webgl' to run the comparison test.
    const backend = 'canvas'
    //const backend = 'webgl'

    const linewidths = [15, 2, 5, 1]
    const caps: LineCap[] = ['butt', 'round', 'square']
    const joins: LineJoin[] = ['miter', 'round', 'bevel']
    const colors = ['red', 'green', 'blue']
    const alphas = [1.0, 0.8, 0.5]

    let x = 0, y = 0
    const X = () => [x-=0.1, 1+x, 2+x, 3+x]
    const Y = () => [20 - (y+=5), -y, 9-y, 6-y]

    const p = fig([300, 300], {output_backend: backend})

    for (let i = 0; i < colors.length; i++) {
      for (let j = 0; j < linewidths.length; j++) {
        p.line(X(), Y(), {
          line_width: linewidths[j],
          line_color: colors[i],
          line_alpha: alphas[i],
          line_cap: caps[i],
          line_join: joins[i],
        })
      }
    }

    await display(p)
  })
})

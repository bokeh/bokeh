import {display, fig} from "../_util"

describe("Spline glyph", () => {
  function spline(x: number[], y: number[], closed: boolean = false) {
    const p = fig([200, 200], {x_range: [0, 10], y_range: [0, 10]})
    p.circle(x, y, {size: 10, fill_color: null, line_color: "orange"})
    p.spline(x, y, {closed, line_color: "green"})
    p.circle(x, y, {size: 2, fill_color: "red", line_color: null})
    return p
  }

  it("should allow to paint an open spline", async () => {
    const p = spline([1, 3, 7, 8], [1, 8, 3, 5], false)
    await display(p, [250, 250])
  })

  it("should allow to paint a closed spline", async () => {
    const p = spline([1, 3, 7, 8], [1, 8, 3, 5], true)
    await display(p, [250, 250])
  })

  it("should allow to paint a spline where start == end", async () => {
    const p = spline([1, 3, 7, 8, 1], [1, 8, 3, 5, 1], false)
    await display(p, [250, 250])
  })
})

import {display, fig, row} from "../_util"
import type {OutputBackend, LineCap, LineJoin, LineDash} from "@bokehjs/core/enums"

describe("Line glyph", () => {
  const linewidths = [15, 2, 5, 1]
  const caps: LineCap[] = ["butt", "round", "square"]
  const joins: LineJoin[] = ["miter", "round", "bevel"]
  const colors = ["orangered", "seagreen", "purple"]
  const alphas = [1.0, 0.8, 0.5]

  it("should support solid lines with caps and joins", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      let x = 0, y = 0
      const X = () => [x+=0.15, 1+x, 2+x, 3+x, 3.5+x]
      const Y = () => [10 - (y+=5), 20-y, 14-y, 12-y, 40-y]

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

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })

  it("should support NaN in coords", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      let x = 0, y = 0
      const X = () => [x+=0.15, 1+x, 2+x, 3+x, 3.5+x]
      const Y = () => [10 - (y+=5), 20-y, 14-y, 12-y, 40-y]

      for (let i = 0; i < colors.length; i++) {
        for (let j = 0; j < linewidths.length; j++) {
          const x2 = X()
          const y2 = Y()
          if (i == 0) {
            x2[0] = NaN
          } else if (i == 1) {
            x2[4] = NaN
          } else {
            y2[2] = NaN
          }
          p.line(x2, y2, {
            line_width: linewidths[j],
            line_color: colors[i],
            line_alpha: alphas[i],
            line_cap: caps[i],
            line_join: joins[i],
          })
        }
      }

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })

  it("should support closed line loops", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      const x = [0, 10, 10, 0, 0]
      let y = 0
      const Y = () => [-(y+=1.5), -y, 1-y, 1-y, -y]

      for (let i = 0; i < colors.length; i++) {
        p.line(x, Y(), {
          line_width: 20,
          line_color: colors[i],
          line_alpha: alphas[i],
          line_cap: caps[i],
          line_join: joins[i],
        })
      }

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })

  it("should support crossing line", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      let x = 0
      let y = 20
      const X = () => [(x+=3), 10+x, x, 10+x, x, x+3]
      const Y = () => [-(y+=5), 5-y, 5-y, 1-y, 2-y, 4-y]

      for (let i = 0; i < colors.length; i++) {
        p.line(X(), Y(), {
          line_width: 10,
          line_color: colors[i],
          line_alpha: alphas[i],
          line_cap: caps[i],
          line_join: joins[i],
        })
      }

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })

  it("should support dashed lines with numerical patterns", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      let x = 0, y = 0
      const X = () => [x+=0.15, 1+x, 2+x, 3+x, 4+x]
      const Y = () => [10 - (y+=5), 20-y, 14-y, 12-y, 40-y]

      // Note first pattern has odd length so pattern will be repeated.
      const dashes = [[4], [10, 5, 10, 13], [20, 10]]

      for (let i = 0; i < colors.length; i++) {
        for (let j = 0; j < linewidths.length; j++) {
          p.line(X(), Y(), {
            line_width: linewidths[j],
            line_color: colors[i],
            line_alpha: alphas[i],
            line_cap: "butt",
            line_join: joins[i],
            line_dash: dashes[i],
          })
        }
      }

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })

  it("should support dashed lines with named patterns", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      let x = 0, y = 0
      const X = () => [x+=0.15, 1+x, 2+x, 3+x, 4+x]
      const Y = () => [10 - (y+=5), 20-y, 14-y, 12-y, 40-y]

      const dashes: LineDash[] = ["solid", "dashed", "dotdash"]

      for (let i = 0; i < colors.length; i++) {
        for (let j = 0; j < linewidths.length; j++) {
          p.line(X(), Y(), {
            line_width: linewidths[j],
            line_color: colors[i],
            line_alpha: alphas[i],
            line_cap: "butt",
            line_join: joins[i],
            line_dash: dashes[i],
          })
        }
      }

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })

  it("should support dashed lines with offsets", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      const x = [0, 1, 2]
      let y = 0
      const Y = () => [10 - (y+=2), 10-y, 15-y]

      const dashes = [[4, 4], [10, 5, 10, 10], [20, 10]]
      const offsets = [0, 5, 10, -10]

      for (let i = 0; i < colors.length; i++) {
        for (let j = 0; j < offsets.length; j++) {
          p.line(x, Y(), {
            line_width: 5,
            line_color: colors[i],
            line_alpha: alphas[i],
            line_cap: "butt",
            line_join: joins[i],
            line_dash: dashes[i],
            line_dash_offset: offsets[j],
          })
        }
      }

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })

  it("should support dashed lines with round caps", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      let x = 0, y = 0
      const X = () => [x+=0.15, 1+x, 2+x, 3+x, 4+x]
      const Y = () => [10 - (y+=5), 20-y, 14-y, 12-y, 40-y]

      const dashes = [[5, 16], [10, 25], [20, 40]]

      for (let i = 0; i < colors.length; i++) {
        for (let j = 0; j < linewidths.length; j++) {
          p.line(X(), Y(), {
            line_width: linewidths[j],
            line_color: colors[i],
            line_alpha: alphas[i],
            line_cap: "round",
            line_join: joins[i],
            line_dash: dashes[i],
          })
        }
      }

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })

  it("should support dashed lines with square caps", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      let x = 0, y = 0
      const X = () => [x+=0.15, 1+x, 2+x, 3+x, 4+x]
      const Y = () => [10 - (y+=5), 20-y, 14-y, 12-y, 40-y]

      const dashes = [[5, 16], [10, 25], [20, 40]]

      for (let i = 0; i < colors.length; i++) {
        for (let j = 0; j < linewidths.length; j++) {
          p.line(X(), Y(), {
            line_width: linewidths[j],
            line_color: colors[i],
            line_alpha: alphas[i],
            line_cap: "square",
            line_join: joins[i],
            line_dash: dashes[i],
          })
        }
      }

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })

  it("should support 180 degree turns", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      const x = [1.1, 1.9, 1.5]
      let y = 0.5
      const Y = () => [y+=1, y, y]

      const dashes = [[], [30, 10], [40, 20]]

      for (let i = 0; i < colors.length; i++) {
        for (let j = 0; j < linewidths.length; j++) {
          p.line(x, Y(), {
            line_width: linewidths[j],
            line_color: colors[i],
            line_alpha: alphas[i],
            line_join: joins[i],
            line_dash: dashes[i],
          })
        }
      }

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })
})

// webgl vs canvas comparison

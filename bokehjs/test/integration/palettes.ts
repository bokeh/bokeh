import {display, fig, grid} from "./_util"

import {
  brewer, bokeh, mpl, d3, tol, colorblind,
  Greys256, Inferno256, Magma256, Plasma256, Viridis256, Cividis256, Turbo256,
} from "@bokehjs/api/palettes"

import {entries, values} from "@bokehjs/core/util/object"
import {max, range, zip, reversed} from "@bokehjs/core/util/array"
import {Matrix} from "@bokehjs/core/util/matrix"
import type {Color} from "@bokehjs/core/types"

function plot(name: string, palettes: Color[][]) {
  const n = max(palettes.map((palette) => palette.length).filter((n) => n != 256))

  const xf = range(1, n + 1).map((f) => `${f}`)
  const yf = []

  const x = []
  const y = []
  const colors = []

  for (const palette of palettes) {
    const k = palette.length
    if (k == 256) {
      continue
    }
    yf.push(`${k}`)

    x.push(...xf)
    y.push(...Array(n).fill(`${k}`))

    const fill = Array(n - k).fill(null)
    colors.push(...palette, ...fill)
  }

  const p = fig([200, 200], {title: name, x_range: xf, y_range: reversed(yf), x_axis_type: null})
  p.ygrid.grid_line_color = null
  p.rect({x, y, width: 1, height: 1, fill_color: colors, line_color: "transparent"})
  return p
}

describe("Palettes", () => {
  it("should support Brewer color schemes", async () => {
    const plots = entries(brewer).map(([name, palettes]) => plot(name, values(palettes)))
    const layout = grid(Matrix.from(plots, 6))
    await display(layout)
  })

  it("should support Bokeh color schemes", async () => {
    const plots = entries(bokeh).map(([name, palettes]) => plot(name, values(palettes)))
    const layout = grid(Matrix.from(plots, 6))
    await display(layout)
  })

  it("should support MPL color schemes", async () => {
    const plots = entries(mpl).map(([name, palettes]) => plot(name, values(palettes)))
    const layout = grid(Matrix.from(plots, 6))
    await display(layout)
  })

  it("should support D3 color schemes", async () => {
    const plots = entries(d3).map(([name, palettes]) => plot(name, values(palettes)))
    const layout = grid(Matrix.from(plots, 6))
    await display(layout)
  })

  it("should support Tol color schemes", async () => {
    const plots = entries(tol).map(([name, palettes]) => plot(name, values(palettes)))
    const layout = grid(Matrix.from(plots, 6))
    await display(layout)
  })

  it("should support Colorblind color schemes", async () => {
    const plots = entries(colorblind).map(([name, palettes]) => plot(name, values(palettes)))
    const layout = grid(Matrix.from(plots, 6))
    await display(layout)
  })

  it("should support n=256 color schemes", async () => {
    const palettes = [Greys256, Inferno256, Magma256, Plasma256, Viridis256, Cividis256, Turbo256]
    const names = ["Greys", "Inferno", "Magma", "Plasma", "Viridis", "Cividis", "Turbo"]
    const n = 256

    const xf = range(1, n + 1).map((f) => `${f}`)
    const yf = names

    const x = []
    const y = []
    const colors = []

    for (const [name, palette] of zip(names, palettes)) {
      x.push(...xf)
      y.push(...Array(n).fill(name))
      colors.push(...palette)
    }

    const p = fig([600, 300], {x_range: xf, y_range: reversed(yf), x_axis_type: null})
    p.ygrid.grid_line_color = null
    p.rect({x, y, width: 1, height: 1, fill_color: colors, line_color: colors})

    await display(p)
  })
})

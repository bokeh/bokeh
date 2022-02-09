import {display, fig, row} from "./_util"

import {ColumnDataSource, GlyphRenderer, Circle} from "@bokehjs/models"
import {ColorNDArray} from "@bokehjs/api/glyph_api"
import * as nd from "@bokehjs/core/util/ndarray"
import {isArrayable} from "@bokehjs/core/util/types"
import {Value, Vector} from "@bokehjs/core/vectorization"
import {Color, Arrayable} from "@bokehjs/core/types"

type ColorArg = Value<Color | null> | Arrayable<Color | null> | ColorNDArray
type AlphaArg = Value<number> | Arrayable<number>

describe("Color support", () => {
  const N = 4
  const x = [0, 1, 2, 4]
  const y = [0, 1, 2, 4]
  const radius = [4, 1, 2, 3]

  function plot_api(color: ColorArg, alpha?: AlphaArg) {
    const p = fig([200, 200], {x_range: [-6, 6], y_range: [-6, 6]})
    p.circle({x, y, radius, fill_color: color, fill_alpha: alpha, line_color: null})
    return p
  }

  function plot_glyph(color: ColorArg, alpha?: AlphaArg) {
    const p = fig([200, 200], {x_range: [-6, 6], y_range: [-6, 6]})
    const source = new ColumnDataSource({data: {x, y, radius}})
    const fill_color: Vector<Color | null> = (() => {
      if (isArrayable(color) || nd.is_NDArray(color)) {
        source.data.fill_color = color
        return {field: "fill_color"}
      } else
        return color
    })()
    const fill_alpha: Vector<number> | undefined = (() => {
      if (isArrayable(alpha) || nd.is_NDArray(alpha)) {
        source.data.fill_alpha = alpha
        return {field: "fill_alpha"}
      } else
        return alpha
    })()
    const glyph = new Circle({radius: {field: "radius"}, fill_color, fill_alpha, line_color: null})
    const circle = new GlyphRenderer({data_source: source, glyph})
    p.add_renderers(circle)
    return p
  }

  function plot(color: ColorArg, alpha?: AlphaArg) {
    return row([plot_api(color, alpha), plot_glyph(color, alpha)], {width: 400, height: 200})
  }

  it("should allow arrays of named colors", async () => {
    const colors = ["yellow", "red", "lime", "blue"]
    await display(plot(colors))
  })

  it("should allow arrays of #RRGGBB colors", async () => {
    const colors = ["#ffff00", "#ff0000", "#00ff00", "#0000ff"]
    await display(plot(colors))
  })

  it("should allow arrays of #RRGGBBAA colors", async () => {
    const colors = ["#ffff00ff", "#ff0000ff", "#00ff00ff", "#0000ffff"]
    await display(plot(colors))
  })

  it("should allow arrays of rgb(r g b) colors", async () => {
    const colors = ["rgb(255 255 0)", "rgb(255 0 0)", "rgb(0 255 0)", "rgb(0 0 255)"]
    await display(plot(colors))
  })

  it("should allow arrays of rgb(r g b / a) colors", async () => {
    const colors = ["rgb(255 255 0 / 1.0)", "rgb(255 0 0 / 1.0)", "rgb(0 255 0 / 1.0)", "rgb(0 0 255 / 1.0)"]
    await display(plot(colors))
  })

  it("should allow arrays of other CSS4 colors", async () => {
    const colors = ["hsl(60deg 100% 50% / 1.0)", "hsl(0deg 100% 50% / 1.0)", "hsl(120deg 100% 50% / 1.0)", "hsl(240deg 100% 50% / 1.0)"]
    await display(plot(colors))
  })

  it("should allow arrays of RGB tuples", async () => {
    const colors: Color[] = [[255, 255, 0], [255, 0, 0], [0, 255, 0], [0, 0, 255]]
    await display(plot(colors))
  })

  it("should allow arrays of RGBA tuples", async () => {
    const colors: Color[] = [[255, 255, 0, 1.0], [255, 0, 0, 1.0], [0, 255, 0, 1.0], [0, 0, 255, 1.0]]
    await display(plot(colors))
  })

  it("should allow arrays of 32-bit unsigned integers", async () => {
    const colors = [0xffff00ff, 0xff0000ff, 0x00ff00ff, 0x0000ffff]
    await display(plot(colors))
  })

  it("should allow uint32[N] arrays", async () => {
    const colors = nd.ndarray([
      0xffff00ff,
      0xff0000ff,
      0x00ff00ff,
      0x0000ffff,
    ], {dtype: "uint32", shape: [N]})

    await display(plot(colors))
  })

  it("should allow uint8[N, 3] arrays", async () => {
    const colors = nd.ndarray([
      255, 255,   0,
      255,   0,   0,
        0, 255,   0, // eslint-disable-line indent
        0,   0, 255, // eslint-disable-line indent
    ], {dtype: "uint8", shape: [N, 3]})

    await display(plot(colors))
  })

  it("should allow uint8[N, 4] arrays", async () => {
    const colors = nd.ndarray([
      255, 255,   0, 255,
      255,   0,   0, 255,
        0, 255,   0, 255, // eslint-disable-line indent
        0,   0, 255, 255, // eslint-disable-line indent
    ], {dtype: "uint8", shape: [N, 4]})

    await display(plot(colors))
  })

  it("should allow float[N, 3] arrays", async () => {
    const colors = nd.ndarray([
      1.0, 1.0, 0.0,
      1.0, 0.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 0.0, 1.0,
    ], {dtype: "float32", shape: [N, 3]})

    await display(plot(colors))
  })

  it("should allow float[N, 4] arrays", async () => {
    const colors = nd.ndarray([
      1.0, 1.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0,
      0.0, 0.0, 1.0, 1.0,
    ], {dtype: "float32", shape: [N, 4]})

    await display(plot(colors))
  })

  it("should allow object[N] arrays", async () => {
    const colors = nd.ndarray([
      "#ffff00ff",
      "#ff0000ff",
      "#00ff00ff",
      "#0000ffff",
    ], {dtype: "object", shape: [N]})

    await display(plot(colors))
  })
})

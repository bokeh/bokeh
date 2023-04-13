import {column, display, fig, row} from "./_util"

import {ColumnDataSource, GlyphRenderer, Circle} from "@bokehjs/models"
import {ColorNDArray} from "@bokehjs/api/glyph_api"
import {OutputBackend} from "@bokehjs/core/enums"
import * as nd from "@bokehjs/core/util/ndarray"
import {isArrayable} from "@bokehjs/core/util/types"
import {Value, Vector} from "@bokehjs/core/vectorization"
import {Color, Arrayable} from "@bokehjs/core/types"
import {settings} from "@bokehjs/core/settings"

type ColorArg = Value<Color | null> | Arrayable<Color | null> | ColorNDArray
type AlphaArg = Value<number> | Arrayable<number>

describe("Color support", () => {
  const N = 4
  const x = [0, 1, 2, 4]
  const y = [0, 1, 2, 4]
  const radius = [4, 1, 2, 3]

  function plot_api(color: ColorArg, alpha?: AlphaArg) {
    const p = fig([120, 120], {x_range: [-6, 6], y_range: [-6, 6]})
    p.circle({x, y, radius, fill_color: color, fill_alpha: alpha, line_color: null})
    return p
  }

  function plot_glyph(color: ColorArg, alpha?: AlphaArg) {
    const p = fig([120, 120], {x_range: [-6, 6], y_range: [-6, 6]})
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
    return row([plot_api(color, alpha), plot_glyph(color, alpha)], {width: 240, height: 120})
  }

  function plot_alpha_combinations(color: ColorArg) {
    const scalar_alpha = {value: 0.5}
    const vector_alpha = [0.75, 1, 0.5, 0.25]
    return column([plot(color), plot(color, scalar_alpha), plot(color, vector_alpha)])
  }

  it("should allow arrays of named colors", async () => {
    const colors = ["yellow", "red", "lime", "blue"]
    await display(plot_alpha_combinations(colors))
  })

  it("should allow arrays of #RRGGBB colors", async () => {
    const colors = ["#ffff00", "#ff0000", "#00ff00", "#0000ff"]
    await display(plot_alpha_combinations(colors))
  })

  it("should allow arrays of #RRGGBBAA colors", async () => {
    const colors = ["#ffff00ff", "#ff0000ff", "#00ff00c0", "#0000ffc0"]
    await display(plot_alpha_combinations(colors))
  })

  it("should allow arrays of rgb(r g b) colors", async () => {
    const colors = ["rgb(255 255 0)", "rgb(255 0 0)", "rgb(0 255 0)", "rgb(0 0 255)"]
    await display(plot_alpha_combinations(colors))
  })

  it("should allow arrays of rgb(r g b / a) colors", async () => {
    const colors = ["rgb(255 255 0 / 1.0)", "rgb(255 0 0 / 1.0)", "rgb(0 255 0 / 0.75)", "rgb(0 0 255 / 0.75)"]
    await display(plot_alpha_combinations(colors))
  })

  it("should allow arrays of other CSS4 colors", async () => {
    const colors = ["hsl(60deg 100% 50% / 1.0)", "hsl(0deg 100% 50% / 1.0)", "hsl(120deg 100% 50% / 0.75)", "hsl(240deg 100% 50% / 0.75)"]
    await display(plot_alpha_combinations(colors))
  })

  it("should allow arrays of RGB tuples", async () => {
    const colors: Color[] = [[255, 255, 0], [255, 0, 0], [0, 255, 0], [0, 0, 255]]
    await display(plot_alpha_combinations(colors))
  })

  it("should allow arrays of RGBA tuples", async () => {
    const colors: Color[] = [[255, 255, 0, 1.0], [255, 0, 0, 1.0], [0, 255, 0, 0.75], [0, 0, 255, 0.75]]
    await display(plot_alpha_combinations(colors))
  })

  it("should allow arrays of 32-bit unsigned integers", async () => {
    const colors = [0xffff00ff, 0xff0000ff, 0x00ff00c0, 0x0000ffc0]
    await display(plot_alpha_combinations(colors))
  })

  it("should allow uint32[N] arrays", async () => {
    const colors = nd.ndarray([
      0xffff00ff,
      0xff0000ff,
      0x00ff00c0,
      0x0000ffc0,
    ], {dtype: "uint32", shape: [N]})

    await display(plot_alpha_combinations(colors))
  })

  it("should allow uint8[N, 3] arrays", async () => {
    const colors = nd.ndarray([
      255, 255, 0,
      255, 0,   0,
      0,   255, 0,
      0,   0,   255,
    ], {dtype: "uint8", shape: [N, 3]})

    await display(plot_alpha_combinations(colors))
  })

  it("should allow uint8[N, 4] arrays", async () => {
    const colors = nd.ndarray([
      255, 255, 0,   255,
      255, 0,   0,   255,
      0,   255, 0,   192,
      0,   0,   255, 192,
    ], {dtype: "uint8", shape: [N, 4]})

    await display(plot_alpha_combinations(colors))
  })

  it("should allow float[N, 3] arrays", async () => {
    const colors = nd.ndarray([
      1.0, 1.0, 0.0,
      1.0, 0.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 0.0, 1.0,
    ], {dtype: "float32", shape: [N, 3]})

    await display(plot_alpha_combinations(colors))
  })

  it("should allow float[N, 4] arrays", async () => {
    const colors = nd.ndarray([
      1.0, 1.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 0.75,
      0.0, 0.0, 1.0, 0.75,
    ], {dtype: "float32", shape: [N, 4]})

    await display(plot_alpha_combinations(colors))
  })

  it("should allow object[N] arrays", async () => {
    const colors = nd.ndarray([
      "#ffff00ff",
      "#ff0000ff",
      "#00ff00c0",
      "#0000ffc0",
    ], {dtype: "object", shape: [N]})

    await display(plot_alpha_combinations(colors))
  })

  it("should combine alpha for line, fill and hatch on all output backends", async () => {
    const x = [0, 1, 2]
    const xs = [[0, 1], [1, 2], [2, 3]]
    const ys = [[2, 3], [2, 3], [2, 3]]
    const color = "#000080c0"
    const alpha = [1.0, 0.75, 0.5]
    const width = 0.9
    const height = 0.9

    function p(output_backend: OutputBackend) {
      const p = fig([200, 250], {output_backend, title: output_backend})
      p.multi_line({xs, ys, line_color: color, line_alpha: alpha, line_width: 15})
      p.block({x, y: 1, width, height, fill_color: color, fill_alpha: alpha})
      p.block({x, y: 0, width, height, fill_color: null, hatch_pattern: "@", hatch_color: color, hatch_alpha: alpha})
      return p
    }

    // TODO: MultiLine doesn't support webgl
    const {force_webgl} = settings
    settings.force_webgl = false
    try {
      await display(row([p("canvas"), p("svg"), p("webgl")]))
    } finally {
      settings.force_webgl = force_webgl
    }
  })
})

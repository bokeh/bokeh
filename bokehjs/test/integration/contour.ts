import {display, fig} from "#framework/layouts"

import {ContourColorBar, GlyphRenderer, MultiLine, MultiPolygons, PrintfTickFormatter} from "@bokehjs/models"
import {ContourRenderer} from "@bokehjs/models/renderers/contour_renderer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("ContourRenderer", () => {

  it("should support line fill and hatch properties", async () => {
    // Data obtained from calling
    // from_contour(z=[[0, 1, 2], [1, 2, 3]], levels=[-0.5, 1.5, 3.5], ...)

    const levels = [-0.5, 1.5, 3.5]

    const line_source = ColumnDataSource.create({data: {
      xs: [[], [0.5, 1, 1.5], []],
      ys: [[], [1, 0.5, 0], []],
      levels,
    }})
    const line_renderer = GlyphRenderer.create({
      glyph: MultiLine.create({
        line_color: "blue", line_width: 5, line_alpha: 0.8, line_dash: [20, 30],
        line_cap: "round",
      }),
      data_source: line_source,
    })

    const fill_source = ColumnDataSource.create({data: {
      xs: [[[[0, 1, 1.5, 1, 0.5, 0, 0]]], [[[0.5, 1, 1.5, 2, 2, 1, 0.5]]]],
      ys: [[[[0, 0, 0, 0.5, 1, 1, 0]]], [[[1, 0.5, 0, 0, 1, 1, 1]]]],
      lower_levels: [-0.5,  1.5],
      upper_levels: [1.5, 3.5],
      fill_color: ["red", "yellow"],
      hatch_pattern: ["", "/"],
    }})
    const fill_renderer = GlyphRenderer.create({
      glyph: MultiPolygons.create({
        fill_color: {field: "fill_color"}, fill_alpha: 0.5, line_width: 0,
        hatch_pattern: {field: "hatch_pattern"}, hatch_alpha: 0.7,
      }),
      data_source: fill_source,
    })

    const p = fig([300, 250])
    const contour_renderer = ContourRenderer.create({fill_renderer, line_renderer, levels})
    p.add_renderers(contour_renderer)
    const color_bar = ContourColorBar.create({fill_renderer, line_renderer, levels})
    p.add_layout(color_bar, "right")

    await display(p)
  })

  const label_cases = [
    {output_backend: "canvas", label_style: "boxed contour labels", positions: null},
    {output_backend: "webgl", label_style: "inline contour labels", positions: null},
    {output_backend: "canvas", label_style: "contour labels at per-level fractions", positions: "label_positions"},
  ] as const

  for (const {output_backend, label_style, positions} of label_cases) {
    const inline_gap = output_backend == "webgl"
    it(`should draw ${label_style} on ${output_backend}`, async () => {
      const levels = [0.125, 0.75, 1.5]
      const angles = Array.from({length: 65}, (_, i) => 2*Math.PI*i/64)
      const radii = [0.36, 0.61, 0.86]
      const line_source = ColumnDataSource.create({data: {
        xs: radii.map((radius) => angles.map((angle) => radius*Math.cos(angle))),
        ys: radii.map((radius) => angles.map((angle) => 0.7*radius*Math.sin(angle))),
        levels,
        label_positions: [[0.25, 0.75], [0.35], [0.10, 0.55]],
      }})
      const line_renderer = GlyphRenderer.create({
        glyph: MultiLine.create({line_color: "#254a68", line_width: 3}),
        data_source: line_source,
      })
      const fill_renderer = GlyphRenderer.create({
        glyph: MultiPolygons.create(),
        data_source: ColumnDataSource.create(),
        visible: false,
      })
      const contours = ContourRenderer.create({fill_renderer, line_renderer, levels})
      contours.add_labels(null, {inline_gap, positions, formatter: PrintfTickFormatter.create({format: "%.2g"}), text_font_size: "14px"})

      const p = fig([320, 250], {output_backend, x_range: [-1, 1], y_range: [-0.85, 0.85]})
      p.add_renderers(contours)
      await display(p)
    })
  }

  const disconnected_cases = [
    {description: "should place one automatic label across disconnected pieces of a level", x_range: [-3.5, 3.5], label_all_paths: false},
    {description: "should label the other piece of a level when the preferred piece is offscreen", x_range: [1, 3.5], label_all_paths: false},
    {description: "should place automatic labels on all visible paths of a level", x_range: [-3.5, 3.5], label_all_paths: true},
  ] as const

  for (const {description, x_range: [left, right], label_all_paths} of disconnected_cases) {
    it(description, async () => {
      const levels = [1.5]
      const angles = Array.from({length: 65}, (_, i) => 2*Math.PI*i/64)
      const xs = angles.map((angle) => Math.cos(angle))
      const ys = angles.map((angle) => Math.sin(angle))
      const centers = label_all_paths ? [-2, 0, 2] : [-2, 2]
      const join_paths = (coordinates: number[][]) =>
        coordinates.flatMap((path, i) => i == 0 ? path : [NaN, ...path])
      const line_renderer = GlyphRenderer.create({
        glyph: MultiLine.create({line_color: "#254a68", line_width: 3}),
        data_source: ColumnDataSource.create({data: {
          xs: [join_paths(centers.map((center) => xs.map((x) => x*(center == 0 ? 0.65 : 1) + center)))],
          ys: [join_paths(centers.map((center) => center == 0 ? ys.map((y) => y*0.65) : ys))],
          levels,
        }}),
      })
      const fill_renderer = GlyphRenderer.create({
        glyph: MultiPolygons.create(),
        data_source: ColumnDataSource.create(),
        visible: false,
      })
      const contours = ContourRenderer.create({fill_renderer, line_renderer, levels})
      contours.add_labels(null, {inline_gap: true, text_font_size: "14px", label_all_paths})

      const p = fig([400, 220], {x_range: [left, right], y_range: [-1.3, 1.3]})
      p.add_renderers(contours)
      await display(p)
    })
  }

  for (const zoomed of [false, true]) {
    it(zoomed ? "should avoid overlaps when zoomed into crowded contours"
      : "should avoid overlapping automatic labels on crowded contours", async () => {
      const levels = [0.1, 0.12, 0.12345, 0.13, 0.135678, 0.14, 0.15, 0.156789]
      const xs = Array.from({length: 81}, (_, i) => i/80)
      const line_renderer = GlyphRenderer.create({
        glyph: MultiLine.create({line_color: "#254a68", line_width: 2}),
        data_source: ColumnDataSource.create({data: {
          xs: levels.map(() => xs),
          ys: levels.map((level, i) => xs.map((x) =>
            0.5 + (level - 0.1)*(0.4 + 2*(x - 0.5)**2) + 0.09*Math.cos(2*Math.PI*x) + 0.002*i*Math.sin(4*Math.PI*x))),
          levels,
        }}),
      })
      const fill_renderer = GlyphRenderer.create({
        glyph: MultiPolygons.create(),
        data_source: ColumnDataSource.create(),
        visible: false,
      })
      const contours = ContourRenderer.create({fill_renderer, line_renderer, levels})
      contours.add_labels(null, {
        formatter: PrintfTickFormatter.create({format: "%.6g"}), background_fill_color: "white", text_font_size: "14px",
      })

      const x_range: [number, number] = zoomed ? [0.39, 0.49] : [-0.04, 1.04]
      const p = fig([440, 250], {x_range, y_range: [0.3, 0.72]})
      p.add_renderers(contours)
      await display(p)
    })
  }
})

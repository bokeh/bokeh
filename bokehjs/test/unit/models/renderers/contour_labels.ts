import * as sinon from "sinon"

import {expect, expect_not_null} from "#framework/assertions"
import {display, fig} from "#framework/layouts"
import {restorable} from "#framework/util"

import {assert} from "@bokehjs/core/util/assert"
import type {CanvasLayer} from "@bokehjs/core/util/canvas"
import {TextBox} from "@bokehjs/core/graphics"
import {ColumnDataSource, ContourRenderer, GlyphRenderer, IndexedSubset, IndexFilter, MultiLine, MultiPolygons, PrintfTickFormatter} from "@bokehjs/models"
import type {OutputBackend} from "@bokehjs/core/enums"
import {Range1d} from "@bokehjs/models/ranges/range1d"

function pixel(layer: CanvasLayer, sx: number, sy: number): number[] {
  const {ctx, pixel_ratio} = layer
  return [...ctx.getImageData(Math.round(sx*pixel_ratio), Math.round(sy*pixel_ratio), 1, 1).data]
}

function contours(output_backend: OutputBackend = "canvas") {
  const source = ColumnDataSource.create({data: {
    xs: [[10, 0], [10, 0], [10, 8, NaN, 2, 0]],
    ys: [[2, 2], [4, 4], [6, 6, NaN, 6, 6]],
    levels: [1.234, 4.567, 8.901],
    names: ["low", "middle", "high"],
    positions: [[0.5], [0.5], [0.25, 0.75]],
  }})
  const line = GlyphRenderer.create({
    glyph: MultiLine.create({line_color: "red", line_width: 4}),
    selection_glyph: MultiLine.create({line_color: "red", line_alpha: 0.6, line_width: 4}),
    muted_glyph: MultiLine.create({line_color: "red", line_alpha: 0.3, line_width: 4}),
    data_source: source,
    view: IndexedSubset.create(),
  })
  const fill = GlyphRenderer.create({visible: false, glyph: MultiPolygons.create(), data_source: ColumnDataSource.create()})
  const contour = ContourRenderer.create({line_renderer: line, fill_renderer: fill, levels: [1.234, 4.567, 8.901]})
  const x_range = Range1d.create({start: 0, end: 10})
  const plot = fig([300, 220], {
    output_backend,
    x_axis_type: null, y_axis_type: null,
    x_range,
    y_range: Range1d.create({start: 0, end: 10}),
    renderers: [contour],
    background_fill_color: "white",
  })
  return {plot, contour, source, line, x_range}
}

describe("Contour labels", () => {
  it("uses mapped paths and current levels, filters rows, and follows glyph state", async () => {
    const {plot, contour, source, line, x_range} = contours()
    const filter = IndexFilter.create({indices: [1, 2]})
    line.view.filter = filter
    const formatter = PrintfTickFormatter.create({format: "%.2g"})
    const labels = contour.add_labels(null, {formatter})
    using format = restorable(sinon.spy(formatter, "doFormat"))
    using paint = restorable(sinon.stub(TextBox.prototype, "paint"))
    const {view} = await display(plot)
    const boxes = () => paint.thisValues as TextBox[]
    const render = () => {
      paint.resetHistory()
      view.export("png")
      return boxes()
    }

    format.resetHistory()
    const initial = render()
    expect(format.firstCall.args[0]).to.be.equal([1.234, 4.567, 8.901])
    expect(initial.map((box) => box.text)).to.be.equal(["4.6", "8.9"])
    expect(initial.map((box) => box.angle)).to.be.equal([0, 0])
    const {sx, sy} = initial[0].position
    expect(sy).to.be.equal(view.frame.y_scale.compute(4))

    source.patch({levels: [[1, 1.234]], ys: [[1, [5, 5]]]})
    filter.indices = [1]
    await view.ready
    const updated = render()
    expect(updated.map((box) => box.text)).to.be.equal(["1.2"])
    expect(updated[0].position.sy).to.be.equal(view.frame.y_scale.compute(5))
    expect(updated[0].position.sy).to.not.be.equal(sy)

    paint.resetHistory()
    formatter.format = "%.2f"
    await view.ready
    expect(boxes().some((box) => box.text == "1.23")).to.be.true

    labels.positions = "positions"
    labels.text = {field: "names"}
    await view.ready
    format.resetHistory()
    const custom = render()
    sinon.assert.notCalled(format)
    expect(custom.map((box) => box.text)).to.be.equal(["middle"])
    expect(custom[0].position.sx).to.be.equal(view.frame.x_scale.compute(5))
    expect(custom[0].position.sx).to.not.be.equal(sx)

    x_range.end = 20
    await view.ready
    expect(render()[0].position.sx).to.be.equal(view.frame.x_scale.compute(5))
    expect(render()[0].position.sx).to.not.be.equal(custom[0].position.sx)

    source.selected.indices = [1]
    await view.ready
    const selected_color = render()[0].color
    expect(selected_color).to.not.be.equal(custom[0].color)

    source.selected.indices = []
    line.muted = true
    await view.ready
    const muted_color = render()[0].color
    expect(muted_color).to.not.be.equal(custom[0].color)
    expect(muted_color).to.not.be.equal(selected_color)

    contour.visible = false
    await view.ready
    expect(render()).to.be.equal([])
  })

  it("builds and disposes attachments after the plot has been displayed", async () => {
    const {plot, contour, line} = contours()
    const {view} = await display(plot)
    const first = contour.add_labels(null, {positions: [0.5]})
    await view.ready
    const first_view = view.owner.get_one(first)
    expect(first_view.is_destroyed).to.be.false

    const second = contour.add_labels(null, {positions: [0.25]})
    line.attachments = [second]
    await view.ready
    expect(first_view.is_destroyed).to.be.true
    expect(view.owner.get_one(second).is_destroyed).to.be.false
  })

  it("places an automatic label when zooming into a short visible part of a line", async () => {
    const {plot, contour, source, line, x_range} = contours()
    source.patch({xs: [[0, [0, 1000]]]})
    line.view.filter = IndexFilter.create({indices: [0]})
    x_range.setv({start: 504, end: 506})
    contour.add_labels()
    using paint = restorable(sinon.stub(TextBox.prototype, "paint"))
    const {view} = await display(plot)

    paint.resetHistory()
    view.export("png")
    const boxes = paint.thisValues as TextBox[]
    expect(boxes.map((box) => box.text)).to.be.equal(["1.23"])
    const {sx, sy} = boxes[0].position
    expect(view.frame.bbox.contains(sx, sy)).to.be.true
    expect(Math.round(sx)).to.be.equal(Math.round(view.frame.x_scale.compute(505)))
  })

  it("labels visible paths separately and skips overlapping labels", async () => {
    const {plot, contour, source, line} = contours()
    line.view.filter = IndexFilter.create({indices: [0]})
    source.patch({
      xs: [[0, [1, 1.1, NaN, 1, 1.1, NaN, 8, 9, NaN, 20, 21]]],
      ys: [[0, [2, 2, NaN, 2, 2, NaN, 2, 2, NaN, 2, 2]]],
    })
    const labels = contour.add_labels()
    using paint = restorable(sinon.stub(TextBox.prototype, "paint"))
    const {view} = await display(plot)
    const rendered_x = () => {
      paint.resetHistory()
      view.export("png")
      return (paint.thisValues as TextBox[]).map(({position: {sx}}) => sx)
    }

    expect(rendered_x().length).to.be.equal(1)
    labels.label_all_paths = true
    const xs = rendered_x()
    expect(xs.length).to.be.equal(2)
    const {hcenter} = view.frame.bbox
    expect(xs[0] < hcenter && xs[1] > hcenter).to.be.true

    labels.positions = [0]
    expect(rendered_x().length).to.be.equal(1)
  })

  for (const output_backend of ["canvas", "svg"] as const) {
    it(`uses the documented inline gap behavior for ${output_backend}`, async () => {
      const {plot, contour, line} = contours(output_backend)
      line.view.filter = IndexFilter.create({indices: [0]})
      const labels = contour.add_labels(null, {inline_gap: true, positions: [0.5]})
      using paint = restorable(output_backend == "svg"
        ? sinon.spy(TextBox.prototype, "paint")
        : sinon.stub(TextBox.prototype, "paint"))
      const {view} = await display(plot)
      paint.resetHistory()
      const layer = view.export(output_backend == "svg" ? "svg" : "png")
      expect((paint.thisValues as TextBox[]).map((box) => box.text)).to.be.equal(["1.23"])

      const line_view = view.owner.get_one(line)
      expect(line_view.has_webgl).to.be.false
      if (output_backend == "svg") {
        expect(layer.canvas.querySelector("text")?.textContent).to.be.equal("1.23")
        const clip_count = (svg: Element) => svg.querySelectorAll("clipPath").length
        const stroke = (svg: Element) => svg.querySelector('[stroke-width="4"]')?.getAttribute("d")
        labels.inline_gap = false
        const continuous = view.export("svg").canvas
        expect(clip_count(layer.canvas)).to.be.equal(clip_count(continuous))
        const path = stroke(layer.canvas)
        expect(path != null && path.length > 0).to.be.true
        expect(path).to.be.equal(stroke(continuous))
      } else {
        const sy = view.frame.y_scale.compute(2)
        expect(pixel(layer, view.frame.x_scale.compute(3), sy)).to.be.equal([255, 0, 0, 255])
        expect(pixel(layer, view.frame.x_scale.compute(5), sy)).to.be.equal([255, 255, 255, 255])
      }
    })
  }

  for (const ratio of [1, 2]) {
    it.dpr(ratio)(`composites WebGL contour strokes under label gaps at ${ratio}×`, async () => {
      const {plot, contour, line} = contours("webgl")
      line.view.filter = IndexFilter.create({indices: [0]})
      const labels = contour.add_labels(null, {inline_gap: true, positions: [0.5]})
      using paint = restorable(sinon.stub(TextBox.prototype, "paint"))
      const {view} = await display(plot)
      const line_view = view.owner.get_one(line)
      expect(line_view.has_webgl).to.be.true
      const {glyph} = line_view
      assert(glyph.has_webgl())
      using draw = restorable(sinon.spy(glyph.glglyph, "draw"))

      const pixel_on_contour = (layer: CanvasLayer, x: number) => {
        return pixel(layer, view.frame.x_scale.compute(x), view.frame.y_scale.compute(2))
      }

      const primary = view.canvas_view.primary
      expect(primary.pixel_ratio).to.be.equal(ratio)
      expect(pixel_on_contour(primary, 3)).to.be.equal([255, 0, 0, 255])
      expect(pixel_on_contour(primary, 5)).to.be.equal([255, 255, 255, 255])

      const render = () => {
        draw.resetHistory()
        paint.resetHistory()
        const layer = view.export("png")
        expect(layer.pixel_ratio).to.be.equal(ratio)
        sinon.assert.calledOnce(draw)
        sinon.assert.calledOnce(paint)
        return (x: number) => pixel_on_contour(layer, x)
      }

      const gap = render()
      expect(gap(3)).to.be.equal([255, 0, 0, 255])
      expect(gap(5)).to.be.equal([255, 255, 255, 255])

      labels.inline_gap = false
      expect(render()(5)).to.be.equal([255, 0, 0, 255])

      labels.background_fill_color = "white"
      expect(render()(5)).to.be.equal([255, 255, 255, 255])

      labels.inline_gap = true
      draw.resetHistory()
      const svg = view.export("svg").canvas
      sinon.assert.notCalled(draw)
      expect_not_null(svg.querySelector('[stroke-width="4"]'))
      expect(svg.querySelector("image")).to.be.null
    })
  }
})

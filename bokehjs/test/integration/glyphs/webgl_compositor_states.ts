import {expect} from "#framework/assertions"
import {xy} from "#framework/interactive"
import {display, fig, row} from "#framework/layouts"
import {WebGLScenario} from "#framework/webgl"
import {encode_rgba} from "@bokehjs/core/util/color"
import {ndarray} from "@bokehjs/core/util/ndarray"
import type {PlotView} from "@bokehjs/models/plots/plot_canvas"

function pixel(view: PlotView, sx: number, sy: number): [number, number, number, number] {
  const {ctx} = view.canvas_view.primary
  const ratio = view.canvas_view.pixel_ratio
  return [...ctx.getImageData(Math.floor(ratio*sx), Math.floor(ratio*sy), 1, 1).data] as
    [number, number, number, number]
}

function expect_dominant(
  value: [number, number, number, number], channel: 0 | 1 | 2,
): void {
  expect(value[3]).to.be.equal(255)
  expect(value[channel]).to.be.above(100)
  expect(value[channel]).to.be.above(value[(channel + 1) % 3] + 50)
  expect(value[channel]).to.be.above(value[(channel + 2) % 3] + 50)
}

function count_pixels(view: PlotView, predicate: (r: number, g: number, b: number, a: number) => boolean): number {
  const {canvas, ctx} = view.canvas_view.primary
  const {data} = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let count = 0
  for (let i = 0; i < data.length; i += 4) {
    count += predicate(data[i], data[i + 1], data[i + 2], data[i + 3]) ? 1 : 0
  }
  return count
}

async function wait_until(predicate: () => boolean, frames: number = 60): Promise<void> {
  for (let i = 0; i < frames; i++) {
    if (predicate()) {
      return
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  throw new Error("condition did not settle")
}

describe("WebGL compositor and context states", () => {
  it.no_image("should preserve renderer order across a Canvas fallback barrier", async () => {
    const p = fig([480, 380], {
      output_backend: "webgl", x_range: [-2, 2], y_range: [-2, 2],
      tools: "pan,wheel_zoom,reset", active_drag: "pan", active_scroll: "wheel_zoom",
      background_fill_color: "white", x_axis_type: null, y_axis_type: null,
    })
    p.scatter([0], [0], {marker: "circle", size: 160, fill_color: "red", line_color: null})
    const middle = p.scatter([0], [0], {marker: "square", size: 100, fill_color: "green", line_color: null})
    p.scatter([0], [0], {marker: "circle", size: 40, fill_color: "blue", line_color: null})
    const {view} = await display(p)
    const middle_view = view.owner.get_one(middle).glyph
    middle_view.disable_webgl()

    const scenario = new WebGLScenario(view)
    await scenario.settle()
    expect(middle_view.has_webgl()).to.be.false

    const verify = () => {
      const sx = view.frame.x_scale.compute(0)
      const sy = view.frame.y_scale.compute(0)
      expect_dominant(pixel(view, sx, sy), 2)
      expect_dominant(pixel(view, sx + 30, sy), 1)
      expect_dominant(pixel(view, sx + 65, sy), 0)
      expect(view.canvas_view.webgl_diagnostics.compositor_pending).to.be.equal(0)
    }
    verify()
    await scenario.pan(xy(0, 0), xy(0.4, -0.2))
    verify()
    await scenario.zoom(xy(0, 0), 2)
    verify()
    await scenario.reset()
    verify()
  })

  it.no_image("should isolate a math atlas while an adjacent plot repeatedly zooms", async () => {
    const attrs = {
      output_backend: "webgl" as const, x_range: [-4, 4] as [number, number], y_range: [-4, 4] as [number, number],
      tools: "wheel_zoom,reset", active_scroll: "wheel_zoom" as const,
      background_fill_color: "white", x_axis_type: null, y_axis_type: null,
    }
    const left = fig([400, 330], attrs)
    left.mathml({
      x: [-2, 0, 2], y: [0, 1, -1],
      text: [
        "<math><msup><mi>x</mi><mn>2</mn></msup></math>",
        "<math><mfrac><mn>1</mn><mi>x</mi></mfrac></math>",
        "<math><msqrt><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow></msqrt></math>",
      ],
      text_font_size: "32px", text_color: "#16a34a", anchor: "center",
    })
    const right = fig([400, 330], attrs)
    right.tex({
      x: [-2, 0, 2], y: [-1, 1, 0],
      text: [String.raw`\frac{1}{x^2}`, String.raw`\int_0^\infty e^{-x} dx`, String.raw`e^{i\pi}+1=0`],
      text_font_size: "32px", text_color: "#2563eb", anchor: "center", display: "inline",
    })
    const {view} = await display(row([left, right]))
    const left_view = view.owner.get_one(left)
    const right_view = view.owner.get_one(right)
    const left_canvas = left_view.canvas_view.primary.canvas
    const before = new Uint8ClampedArray(left_view.canvas_view.primary.ctx.getImageData(
      0, 0, left_canvas.width, left_canvas.height,
    ).data)
    const scenario = new WebGLScenario(right_view)

    for (let i = 0; i < 6; i++) {
      await scenario.zoom(xy(0, 0), i % 2 == 0 ? 1 : -1)
    }

    const after = left_view.canvas_view.primary.ctx.getImageData(
      0, 0, left_canvas.width, left_canvas.height,
    ).data
    let differences = 0
    for (let i = 0; i < before.length; i++) {
      differences += before[i] == after[i] ? 0 : 1
    }
    expect(differences).to.be.equal(0)
    expect(left_view.canvas_view.webgl_diagnostics).to.be.equal({
      dirty: false, compositor_pending: 0, backend: "webgl2",
    })
    expect(right_view.canvas_view.webgl_diagnostics).to.be.equal({
      dirty: false, compositor_pending: 0, backend: "webgl2",
    })
  })

  it.no_image("should batch compatible renderers and drain all queued work", async () => {
    const p = fig([560, 360], {
      output_backend: "webgl", x_range: [-2, 2], y_range: [-2, 2],
      background_fill_color: "white", x_axis_type: null, y_axis_type: null,
    })
    for (let i = 0; i < 32; i++) {
      const x = -1.5 + (i % 8)*0.4
      const y = -1.2 + Math.floor(i/8)*0.8
      p.scatter([x], [y], {marker: "circle", size: 12, fill_color: "navy", line_color: null})
    }
    const {view} = await display(p)
    const wrapper = view.canvas_view.webgl!.regl_wrapper
    const {batch, pending, resources} = wrapper.diagnostics
    expect(batch.submitted).to.be.above(31)
    expect(batch.draw_calls).to.be.below(batch.submitted)
    expect(pending.commands).to.be.equal(0)
    expect(view.canvas_view.webgl_diagnostics.compositor_pending).to.be.equal(0)

    for (let i = 0; i < 8; i++) {
      p.renderers[i].visible = i % 2 == 0
    }
    await new WebGLScenario(view).settle()
    expect(wrapper.diagnostics.pending.commands).to.be.equal(0)
    expect(view.canvas_view.webgl_diagnostics.compositor_pending).to.be.equal(0)
    expect(wrapper.diagnostics.resources).to.be.equal(resources)
  })

  it.no_image("should repaint after an explicit WebGL context loss and restoration", async () => {
    const p = fig([420, 320], {
      output_backend: "webgl", x_range: [-2, 2], y_range: [-2, 2],
      background_fill_color: "white", x_axis_type: null, y_axis_type: null,
    })
    const renderer = p.scatter([0], [0], {size: 60, fill_color: "#7c3aed", line_color: null})
    p.line([-1.5, 1.5], [1.2, 1.2], {line_color: "#f97316", line_width: 8, line_dash: [10, 5]})
    p.text({x: [0], y: [-1], text: ["restored"], text_font_size: "28px", text_color: "#16a34a", anchor: "center"})
    const pixels = new Uint32Array(16)
    const packed = new DataView(pixels.buffer)
    for (let i = 0; i < pixels.length; i++) {
      packed.setUint32(4*i, encode_rgba([6, 182, 212, 255]))
    }
    const image = ndarray(pixels, {
      dtype: "uint32", shape: [4, 4],
    })
    p.image_rgba({image: [image], x: [-1.7], y: [-1.7], dw: [0.7], dh: [0.7]})
    const {view} = await display(p)
    const before = {
      green: count_pixels(view, (r, g, b) => g > r + 30 && g > b + 20),
      cyan: count_pixels(view, (r, g, b) => g > r + 80 && b > r + 80),
    }
    expect(before.green).to.be.above(50)
    expect(before.cyan).to.be.above(100)
    const wrapper = view.canvas_view.webgl!.regl_wrapper
    const dash_cache = () => (wrapper as unknown as {
      _dash_cache?: {_map: Map<string, unknown>}
    })._dash_cache?._map.size ?? 0
    expect(dash_cache()).to.be.above(0)
    const {canvas} = view.canvas_view.webgl!
    const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl"))!
    const extension = gl.getExtension("WEBGL_lose_context")
    if (extension == null) {
      return
    }

    let lost = false
    let restored = false
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault()
      lost = true
    }, {once: true})
    canvas.addEventListener("webglcontextrestored", () => restored = true, {once: true})
    extension.loseContext()
    await wait_until(() => lost)
    extension.restoreContext()
    await wait_until(() => restored)
    for (let i = 0; i < 5; i++) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }

    renderer.data_source.patch({x: [[0, 0.25]], y: [[0, -0.25]]})
    view.request_paint()
    await new WebGLScenario(view).settle()
    const sx = view.frame.x_scale.compute(0.25)
    const sy = view.frame.y_scale.compute(-0.25)
    expect_dominant(pixel(view, sx, sy), 2)
    expect(count_pixels(view, (r, g, b) => g > r + 30 && g > b + 20)).to.be.above(before.green/2)
    expect(count_pixels(view, (r, g, b) => g > r + 80 && b > r + 80)).to.be.above(before.cyan/2)
    expect(dash_cache()).to.be.above(0)
    expect(view.canvas_view.webgl_diagnostics.compositor_pending).to.be.equal(0)
    expect(view.canvas_view.webgl!.regl_wrapper.diagnostics.pending.commands).to.be.equal(0)
  })
})

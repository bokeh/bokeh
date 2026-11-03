import {expect} from "#framework/assertions"
import {BaseMultiMarkerGL} from "@bokehjs/models/glyphs/webgl/multi_marker"
import type {MultiMarkerView} from "@bokehjs/models/glyphs/webgl/multi_marker"
import {ReglWrapper} from "@bokehjs/models/glyphs/webgl/regl_wrap"
import type {Uint8Buffer} from "@bokehjs/models/glyphs/webgl/buffer"
import {UniformScalar, UniformVector, ColorUniformVector} from "@bokehjs/core/uniforms"
import type {Uniform} from "@bokehjs/core/uniforms"
import type {GLMarkerType} from "@bokehjs/models/glyphs/webgl/types"
import type {uint32} from "@bokehjs/core/types"

// A synthetic adapter with multiple marker instances per item, independent of any
// grouped-point model or data source implementation.
class PairedMarkersGL extends BaseMultiMarkerGL<MultiMarkerView> {
  readonly shown = new Map<GLMarkerType, number[]>()
  readonly buffers = new Map<GLMarkerType, Uint8Buffer>()
  counts = [2, 2]
  private _items: number[] = []

  override set_data_changed(): void {
    this.nvertices = this.counts.reduce((sum, count) => sum + count, 0)
    this.data_changed = true
  }

  protected override _set_centers(nmarkers: number): void {
    this._items = this.counts.flatMap((count, i) => Array<number>(count).fill(i))
    this._centers.get_sized_array(2*nmarkers).fill(0)
    this._centers.update()
  }

  protected override _marker_indices(indices: Int32Array): Uint32Array {
    const selected = new Set(indices)
    return Uint32Array.from(this._items.flatMap((item, i) => selected.has(item) ? [i] : []))
  }

  protected override _map_uniform<T>(uniform: Uniform<T>): Uniform<T> {
    if (uniform.is_scalar) {
      return uniform
    }
    return new UniformVector(this._items.map((i) => uniform.get(i)))
  }

  protected override _map_color_uniform(uniform: Uniform<uint32>): Uniform<uint32> {
    if (uniform.is_scalar) {
      return this._map_uniform(uniform)
    }
    const colors = uniform as ColorUniformVector
    return new ColorUniformVector(Uint32Array.from(this._items, (i) => colors.array[i]))
  }

  protected override _draw_one_marker_type(marker: GLMarkerType, _transform: unknown, _main: unknown, show: Uint8Buffer): void {
    this.shown.set(marker, [...show.get_array()])
    this.buffers.set(marker, show)
  }

  get widths(): number[] {
    return [...this._widths.get_array()]
  }
}

describe("BaseMultiMarkerGL", () => {
  it("should map item indices, geometry uniforms, and packed colors to marker instances", () => {
    const canvas = document.createElement("canvas")
    const wrapper = new ReglWrapper(canvas.getContext("webgl")!)
    const glyph = {
      data_size: 2,
      size: new UniformVector([10, 20]),
      angle: new UniformScalar(0, 2),
      marker: new UniformVector(["circle", "square"]),
      visuals: {
        line: {
          line_width: new UniformScalar(1, 2),
          line_cap: new UniformScalar("round", 2),
          line_join: new UniformScalar("round", 2),
          line_color: new UniformScalar(0x000000ff, 2),
          line_alpha: new UniformVector([1, 0.5]),
        },
        fill: {
          fill_color: new ColorUniformVector(new Uint32Array(new Uint8Array([255, 0, 0, 255, 0, 0, 255, 255]).buffer)),
          fill_alpha: new UniformVector([1, 0.5]),
        },
        hatch: {doit: false},
      },
    } as unknown as MultiMarkerView
    const gl = new PairedMarkersGL(wrapper, glyph)
    Object.assign(glyph, {glglyph: gl})
    gl.set_data_changed()
    gl.set_visuals_changed()
    const transform = {width: 100, height: 100, pixel_ratio: 1}
    gl.draw(new Int32Array([0]), glyph, transform)
    expect(gl.shown.get("circle")).to.be.equal([255, 255, 0, 0])
    expect(gl.widths).to.be.equal([10, 10, 20, 20])
    expect([...gl.fill_props.fill_color.get_array()]).to.be.equal([
      255, 0, 0, 255, 255, 0, 0, 255, 0, 0, 255, 128, 0, 0, 255, 128,
    ])
    expect([...gl.line_props.line_color.get_array()]).to.be.equal([
      0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 128, 0, 0, 0, 128,
    ])
    const circle_buffer = gl.buffers.get("circle")!
    const circle_gpu_buffer = circle_buffer.to_attribute_config().buffer
    const color_gpu_buffer = gl.line_props.line_color.to_attribute_config().buffer
    gl.shown.clear()
    gl.draw(new Int32Array([1]), glyph, transform)
    expect(gl.shown.get("square")).to.be.equal([0, 0, 255, 255])
    expect(gl.shown.has("circle")).to.be.false

    const derived_glyph = {
      ...glyph,
      size: new UniformScalar(40, 2),
      marker: new UniformScalar("triangle", 2),
    } as unknown as MultiMarkerView
    const derived = new PairedMarkersGL(wrapper, derived_glyph)
    derived.set_data_changed()
    derived.set_visuals_changed()
    derived.draw(new Int32Array([1]), glyph, transform)
    expect(derived.shown.get("triangle")).to.be.equal([0, 0, 255, 255])
    expect(derived.widths).to.be.equal([40])

    // A replacement with the same item count must refresh mapped uniforms.
    Object.assign(glyph, {size: new UniformVector([12, 24]), marker: new UniformScalar("hex", 2)})
    gl.set_data_changed()
    gl.shown.clear()
    gl.draw(new Int32Array([0]), glyph, transform)
    expect(gl.shown.get("hex")).to.be.equal([255, 255, 0, 0])
    expect(gl.widths).to.be.equal([12, 12, 24, 24])

    // Redistribute instances between items without changing their total count.
    Object.assign(glyph, {marker: new UniformVector(["circle", "square"])})
    gl.counts = [1, 3]
    gl.set_data_changed()
    gl.set_visuals_changed()
    gl.shown.clear()
    gl.draw(new Int32Array([0]), glyph, transform)
    expect(gl.shown.get("circle")).to.be.equal([255, 0, 0, 0])
    expect(gl.widths).to.be.equal([12, 24, 24, 24])
    expect([...gl.line_props.line_color.get_array()]).to.be.equal([
      0, 0, 0, 255, 0, 0, 0, 128, 0, 0, 0, 128, 0, 0, 0, 128,
    ])
    expect(gl.buffers.get("circle")).to.be.identical(circle_buffer)
    expect(circle_buffer.to_attribute_config().buffer).to.be.identical(circle_gpu_buffer)
    expect(gl.line_props.line_color.to_attribute_config().buffer).to.be.identical(color_gpu_buffer)

    gl.counts = [1, 2]
    gl.set_data_changed()
    gl.set_visuals_changed()
    gl.draw(new Int32Array([0]), glyph, transform)
    expect(gl.shown.get("circle")).to.be.equal([255, 0, 0])
    expect(circle_buffer.to_attribute_config().buffer).to.be.identical(circle_gpu_buffer)
  })
})

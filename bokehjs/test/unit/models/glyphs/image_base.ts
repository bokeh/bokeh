import {expect, expect_not_null} from "#framework/assertions"
import {async_trap} from "#framework/util"

import {create_glyph_renderer_view} from "./_util"
import type {ImageBase} from "@bokehjs/models/glyphs/image_base"
import {Image} from "@bokehjs/models/glyphs/image"
import {ImageRGBA} from "@bokehjs/models/glyphs/image_rgba"
import {ImageStack} from "@bokehjs/models/glyphs/image_stack"
import {WeightedStackColorMapper} from "@bokehjs/models/mappers/weighted_stack_color_mapper"
import {LinearColorMapper} from "@bokehjs/models/mappers/linear_color_mapper"
import type {Arrayable} from "@bokehjs/core/types"
import type {NDArrayType} from "@bokehjs/core/util/ndarray"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {version} from "@bokehjs/version"

describe("ImageBase module", () => {

  const img_1d = () => ndarray([1, 2, 3, 4], {dtype: "uint32", shape: [4]})
  const img_2d = () => ndarray([1, 2, 3, 4], {dtype: "uint32", shape: [2, 2]})
  const img_3d = () => ndarray([1, 2, 3, 4, 5, 6, 7, 8], {dtype: "uint32", shape: [2, 2, 2]})

  const empty_2d = () => ndarray([], {dtype: "uint32", shape: [0, 2]})
  const empty_3d = () => ndarray([], {dtype: "uint32", shape: [2, 0, 2]})

  type Case = {
    name: string
    dimension: number
    glyph: () => ImageBase
    valid: () => NDArrayType<number>
    invalid: () => NDArrayType<number>
    empty: () => NDArrayType<number>
  }

  const cases: Case[] = [{
    name: "Image",
    dimension: 2,
    glyph: () => Image.create({image: {field: "image"}, x: 0, y: 0, dw: 10, dh: 10}),
    valid: img_2d,
    invalid: img_1d,
    empty: empty_2d,
  }, {
    name: "ImageRGBA",
    dimension: 2,
    glyph: () => ImageRGBA.create({image: {field: "image"}, x: 0, y: 0, dw: 10, dh: 10}),
    valid: img_2d,
    invalid: img_3d,
    empty: empty_2d,
  }, {
    name: "ImageStack",
    dimension: 3,
    glyph: () => {
      const alpha_mapper = LinearColorMapper.create({palette: ["#0004", "#0008", "#000c", "#000f"]})
      const color_mapper = WeightedStackColorMapper.create({palette: ["red", "blue"], alpha_mapper})
      return ImageStack.create({image: {field: "image"}, x: 0, y: 0, dw: 10, dh: 10, color_mapper})
    },
    valid: img_3d,
    invalid: img_2d,
    empty: empty_3d,
  }]

  async function create_view(glyph: ImageBase, image: unknown[]) {
    const data = {image: image as NDArrayType<number>[]}
    let renderer_view!: Awaited<ReturnType<typeof create_glyph_renderer_view>>
    const out = await async_trap(async () => {
      renderer_view = await create_glyph_renderer_view(glyph, data)
    })
    const glyph_view = renderer_view.glyph as ImageBase["__view_type__"]
    const source = renderer_view.model.data_source
    const update = async (fn: () => void) => async_trap(async () => {
      fn()
      await renderer_view.ready
    })
    return {glyph_view, source, out, update}
  }

  const present = (image_data: Arrayable<unknown>) => Array.from(image_data, (data) => data != null)

  const error = (glyph: ImageBase, i: number, dimension: number, got: string) => {
    return `[bokeh ${version}] ${glyph}.image[${i}]: expected a ${dimension}D array, got ${got}\n`
  }

  for (const {name, dimension, glyph, valid, invalid, empty} of cases) {
    describe(`${name}View`, () => {

      it(`should render valid ${dimension}D images without errors`, async () => {
        const {glyph_view, out} = await create_view(glyph(), [valid(), valid()])
        expect(out.error).to.be.equal("")

        const {image_data, image_width, image_height} = glyph_view
        expect_not_null(image_data)
        expect(present(image_data)).to.be.equal([true, true])
        expect(image_width).to.be.equal(new Uint32Array([2, 2]))
        expect(image_height).to.be.equal(new Uint32Array([2, 2]))
      })

      it("should skip and report images of unexpected dimension", async () => {
        const model = glyph()
        const {glyph_view, out} = await create_view(model, [valid(), invalid()])
        expect(out.error).to.be.equal(error(model, 1, dimension, `${invalid().dimension}D array`))

        const {image_data, image_width, image_height} = glyph_view
        expect_not_null(image_data)
        expect(present(image_data)).to.be.equal([true, false])
        expect(image_width).to.be.equal(new Uint32Array([2, 0]))
        expect(image_height).to.be.equal(new Uint32Array([2, 0]))
      })

      it("should skip and report images that aren't ndarrays", async () => {
        const model = glyph()
        const {glyph_view, out} = await create_view(model, [null, [[1, 2], [3, 4]], valid()])
        expect(out.error).to.be.equal(error(model, 0, dimension, "object") + error(model, 1, dimension, "object"))

        const {image_data} = glyph_view
        expect_not_null(image_data)
        expect(present(image_data)).to.be.equal([false, false, true])
      })

      it("should skip empty images without errors", async () => {
        const {glyph_view, out} = await create_view(glyph(), [empty(), valid()])
        expect(out.error).to.be.equal("")

        const {image_data, image_width, image_height} = glyph_view
        expect_not_null(image_data)
        expect(present(image_data)).to.be.equal([false, true])
        expect(image_width).to.be.equal(new Uint32Array([0, 2]))
        expect(image_height).to.be.equal(new Uint32Array([0, 2]))
      })

      it("should not hit test skipped images", async () => {
        const {glyph_view} = await create_view(glyph(), [invalid(), valid(), empty()])
        const sx = glyph_view.renderer.xscale.compute(5)
        const sy = glyph_view.renderer.yscale.compute(5)

        const result = glyph_view.hit_test({type: "point", sx, sy})
        expect_not_null(result)
        expect(result.indices).to.be.equal([1])
        expect(result.image_indices.map(({index}) => index)).to.be.equal([1])
      })

      it("should not retain stale image data when an image is replaced with bad data", async () => {
        const model = glyph()
        const {glyph_view, source, update} = await create_view(model, [valid(), valid()])
        expect_not_null(glyph_view.image_data)
        expect(present(glyph_view.image_data)).to.be.equal([true, true])

        const out = await update(() => source.patch({image: [[1, invalid()]]}))
        expect(out.error).to.be.equal(error(model, 1, dimension, `${invalid().dimension}D array`))

        const {image_data, image_width, image_height} = glyph_view
        expect_not_null(image_data)
        expect(present(image_data)).to.be.equal([true, false])
        expect(image_width).to.be.equal(new Uint32Array([2, 0]))
        expect(image_height).to.be.equal(new Uint32Array([2, 0]))
      })

      it("should recover when bad data is replaced with valid data", async () => {
        const {glyph_view, source, update} = await create_view(glyph(), [invalid()])
        expect_not_null(glyph_view.image_data)
        expect(present(glyph_view.image_data)).to.be.equal([false])

        const out = await update(() => source.data = {image: [valid()]})
        expect(out.error).to.be.equal("")

        const {image_data, image_width, image_height} = glyph_view
        expect_not_null(image_data)
        expect(present(image_data)).to.be.equal([true])
        expect(image_width).to.be.equal(new Uint32Array([2]))
        expect(image_height).to.be.equal(new Uint32Array([2]))
      })
    })
  }
})

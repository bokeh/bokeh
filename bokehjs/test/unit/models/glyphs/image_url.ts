import {expect, expect_not_null} from "#framework/assertions"

import {create_glyph_view} from "./_util"
import {ImageURL} from "@bokehjs/models/glyphs/image_url"
import {ColumnDataSource} from "@bokehjs/models/sources"
import {ScreenArray, Indices} from "@bokehjs/core/types"
import {DataRange1d} from "@bokehjs/models/ranges/data_range1d"

describe("ImageURL module", () => {

  describe("ImageURL Model", () => {

    describe("Default creation", () => {
      const image_url = ImageURL.create()

      it("should have global_alpha=1.0", () => {
        expect(image_url.global_alpha).to.be.equal({value: 1.0})
      })

      it("should have retry_attempts=0", () => {
        expect(image_url.retry_attempts).to.be.equal(0)
      })

      it("should have retry_timeout=0", () => {
        expect(image_url.retry_timeout).to.be.equal(0)
      })
    })
  })

  describe("ImageURLView", () => {
    for (const use_column of [false, true]) {
      it(`should include anchors in auto-ranging with null ${use_column ? "column" : "literal"} dimensions`, async () => {
        const image_url = ImageURL.create({
          url: {value: "data:image/png;base64,"}, x: 5, y: 7,
          w: use_column ? {field: "w"} : null,
          h: use_column ? {field: "h"} : null,
        })
        const x_range = DataRange1d.create({range_padding: 0})
        const y_range = DataRange1d.create({range_padding: 0})
        const view = await create_glyph_view(image_url, {w: [null], h: [null]}, {x_range, y_range})
        expect(view.bounds()).to.be.equal({x0: 5, x1: 5, y0: 7, y1: 7})
        expect([x_range.start, x_range.end]).to.be.equal([4, 6])
        expect([y_range.start, y_range.end]).to.be.equal([6, 8])
        expect(typeof view.max_w).to.be.equal("number")
        expect(typeof view.max_h).to.be.equal("number")
        if (!use_column) {
          expect(Number.isNaN(view.max_w)).to.be.true
          expect(Number.isNaN(view.max_h)).to.be.true
        }
        view.map_data()
        expect(view.sw).to.be.equal(new ScreenArray([NaN]))
        expect(view.sh).to.be.equal(new ScreenArray([NaN]))
      })
    }

    for (const units of ["data", "screen"] as const) {
      it(`should preserve automatic dimensions in mixed columns with ${units} units`, async () => {
        const image_url = ImageURL.create({
          url: {value: "data:image/png;base64,"}, x: 0, y: 0,
          w: {field: "width", units}, h: {field: "height", units},
        })
        const source = ColumnDataSource.create({data: {width: [null, 2, null], height: [3, null, 4]}})
        const view = await create_glyph_view(image_url)
        const indices = Indices.from_indices(3, [0, 1])
        await view.set_data(source, indices)
        view.map_data()
        const scale = units == "data" ? 2 : 1
        expect(view.sw).to.be.equal(new ScreenArray([NaN, 2*scale]))
        expect(view.sh).to.be.equal(new ScreenArray([3*scale, NaN]))
        expect(view.max_w).to.be.equal(2)
        expect(view.max_h).to.be.equal(3)
        source.data = {width: [5, null, 1], height: [null, 6, 2]}
        await view.set_data(source, indices)
        view.map_data()
        expect(view.sw).to.be.equal(new ScreenArray([5*scale, NaN]))
        expect(view.sh).to.be.equal(new ScreenArray([NaN, 6*scale]))
        expect(view.max_w).to.be.equal(5)
        expect(view.max_h).to.be.equal(6)
      })
    }

    it.skip("`_set_data` should correctly set Image src", async () => {
      // ImageURLView._set_data is called during GlyphRendererView.initialize
      const image_url = ImageURL.create()
      image_url.url = "image.jpg"

      const image_url_view = await create_glyph_view(image_url)
      const indices = Indices.all_set(1)
      const source = ColumnDataSource.create()
      await image_url_view.set_data(source, indices)
      image_url_view.set_visuals(source, indices)

      // TODO await
      const image = image_url_view.image[0]
      expect_not_null(image)
      expect(image.src).to.be.equal("image.jpg")
    })

    it("`_map_data` should correctly map data if w and h units are 'data'", async () => {
      // ImageURLView._map_data is called by ImageURLView.map_data
      const image_url = ImageURL.create()
      image_url.url = {value: "data:image/png;base64,"}
      image_url.x = 0
      image_url.y = 0
      image_url.w = 17
      image_url.h = 19

      const image_url_view = await create_glyph_view(image_url)
      const indices = Indices.all_set(1)
      const source = ColumnDataSource.create()
      await image_url_view.set_data(source, indices)
      image_url_view.set_visuals(source, indices)
      image_url_view.map_data()

      expect(image_url_view.sw).to.be.equal(new ScreenArray([34]))
      expect(image_url_view.sh).to.be.equal(new ScreenArray([38]))
    })

    it("`_map_data` should correctly map data if w and h units are 'screen'", async () => {
      // ImageURLView._map_data is called by ImageURLView.map_data
      const image_url = ImageURL.create()
      image_url.url = {value: "data:image/png;base64,"}
      image_url.x = 0
      image_url.y = 0
      image_url.w = 1
      image_url.h = 2
      image_url.properties.w.units = "screen"
      image_url.properties.h.units = "screen"

      const image_url_view = await create_glyph_view(image_url)
      const indices = Indices.all_set(1)
      const source = ColumnDataSource.create()
      await image_url_view.set_data(source, indices)
      image_url_view.set_visuals(source, indices)
      image_url_view.map_data()

      expect(image_url_view.sw).to.be.equal(new ScreenArray([1]))
      expect(image_url_view.sh).to.be.equal(new ScreenArray([2]))
    })

    it("`_map_data` should map data to NaN if w and h are null, 'data' units", async () => {
      // if sw, sh are NaN, then the image width or height are used during render
      const image_url = ImageURL.create()
      image_url.url = {value: "data:image/png;base64,"}
      image_url.x = 0
      image_url.y = 0
      image_url.w = null
      image_url.h = null

      const image_url_view = await create_glyph_view(image_url)
      const indices = Indices.all_set(1)
      const source = ColumnDataSource.create()
      await image_url_view.set_data(source, indices)
      image_url_view.set_visuals(source, indices)
      image_url_view.map_data()

      expect(image_url_view.sw).to.be.equal(new ScreenArray([NaN]))
      expect(image_url_view.sh).to.be.equal(new ScreenArray([NaN]))
    })

    it("`_map_data` should map data to NaN if w and h are null, 'screen' units", async () => {
      const image_url = ImageURL.create()
      image_url.url = {value: "data:image/png;base64,"}
      image_url.x = 0
      image_url.y = 0
      image_url.w = null
      image_url.h = null
      image_url.properties.w.units = "screen"
      image_url.properties.h.units = "screen"

      const image_url_view = await create_glyph_view(image_url)
      const indices = Indices.all_set(1)
      const source = ColumnDataSource.create()
      await image_url_view.set_data(source, indices)
      image_url_view.set_visuals(source, indices)
      image_url_view.map_data()

      expect(image_url_view.sw).to.be.equal(new ScreenArray([NaN]))
      expect(image_url_view.sh).to.be.equal(new ScreenArray([NaN]))
    })
  })
})

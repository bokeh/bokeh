import {expect} from "assertions"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"

describe("GlyphRenderer", () => {

  function mkrenderer(): GlyphRenderer {
    const source = new ColumnDataSource({
      data: {
        x: [10, 20, 30, 40],
        y: [1, 2, 3, 4],
        color: ['red', 'green', 'red', 'green'],
        label: ['foo', 'bar', 'foo', 'bar'],
      },
    })
    return new GlyphRenderer({data_source: source})
  }

  describe("get_reference_point", () => {
    const gr = mkrenderer()

    it("should return 0 if no field, value is passed", () => {
      const index = gr.get_reference_point(null)
      expect(index).to.be.equal(0)
    })

    it("should return 0 if field not in column data source", () => {
      const index = gr.get_reference_point('milk', 'bar')
      expect(index).to.be.equal(0)
    })

    it("should return correct index if field and value in column data source", () => {
      const index = gr.get_reference_point('label', 'bar')
      expect(index).to.be.equal(1)
    })

    it("should return 0 index if field in column data source but value not available", () => {
      const index = gr.get_reference_point('label', 'baz')
      expect(index).to.be.equal(0)
    })
  })
})

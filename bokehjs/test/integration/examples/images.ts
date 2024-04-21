import {display} from "../_util"

import {figure} from "@bokehjs/api/plotting"
import {Spectral11, Sunset4} from "@bokehjs/api/palettes"
import {Anchor, ImageOrigin} from "@bokehjs/core/enums"
import {linspace} from "@bokehjs/core/util/array"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {encode_rgba} from "@bokehjs/core/util/color"
import {DataRange1d, LinearColorMapper, Column, ColumnDataSource} from "@bokehjs/models"
import {Select} from "@bokehjs/models/widgets"

describe("Examples", () => {
  it("should support topics/images/Image", async () => {
    const image = (() => {
      const N = 300
      const x = linspace(0, 10, N)
      const y = linspace(0, 10, N)
      const d = new Float64Array(N*N)
      const {sin, cos} = Math

      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          d[i*N + j] = sin(x[i])*cos(y[j])
        }
      }

      return ndarray(d, {dtype: "float64", shape: [N, N]})
    })()

    const p = figure({
      width: 400, height: 400,
      x_range: new DataRange1d({range_padding: 0}),
      y_range: new DataRange1d({range_padding: 0}),
    })
    p.grid.grid_line_width = 0.5

    const color_mapper = new LinearColorMapper({palette: Spectral11})
    p.image({image: {value: image}, x: 0, y: 0, dw: 10, dh: 10, color_mapper})

    await display(p)
  })

  it("should support topics/images/ImageRGBA", async () => {
    const image = (() => {
      const N = 20
      const d = new Uint32Array(N*N) // TODO: doesn't allow Uint8Array[N, N, 4]
      const dv = new DataView(d.buffer)

      const {trunc} = Math
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const r = trunc(i/N*255)
          const g = 158
          const b = trunc(j/N*255)
          const a = 255
          dv.setUint32(4*(i*N + j), encode_rgba([r, g, b, a]))
        }
      }

      return ndarray(d, {dtype: "uint32", shape: [N, N]})
    })()

    const p = figure({
      width: 400, height: 400,
      x_range: new DataRange1d({range_padding: 0}),
      y_range: new DataRange1d({range_padding: 0}),
    })
    p.grid.grid_line_width = 0.5

    p.image_rgba({image: {value: image}, x: 0, y: 0, dw: 10, dh: 10})
    await display(p)
  })

  it("should support topics/images/ImageOriginAnchor", async () => {
    const Sunset4_RGBA = [0xff9a4b36, 0xffe5d2a5, 0xff72c0fd, 0xff2600a5]
    const img = ndarray(Sunset4_RGBA, {dtype: "uint32", shape: [2, 2]})

    const p = figure({
      title: "Different anchors and origins for image placed at coordinates (0, 0)",
      tools: "", toolbar_location: null,
      x_range: [-10, 10], y_range: [-10, 10],
      background_fill_color: "#efefef",
    })
    const r = p.image_rgba({image: [img], x: 0, y: 0, dw: 8.5, dh: 8.5})
    p.scatter(0, 0, {size: 12, fill_color: "black", line_color: "white", line_width: 3})

    // a legend to identify the image pixel i, j coordinates
    const source = new ColumnDataSource({
      data: {
        color: Sunset4,
        coord: ["img[0,0]", "img[0,1]", "img[1,0]", "img[1,1]"],
      },
    })
    p.scatter(0, 0, {marker: "square", color: "color", legend_group: "coord", source, visible: false})
    p.legend.location = "bottom_center"
    p.legend.orientation = "horizontal"
    p.legend.glyph_height = 30
    p.legend.glyph_width = 30
    p.legend.padding = 3
    p.legend.margin = 5
    p.legend.label_standoff = 0
    p.legend.spacing = 25
    p.legend.background_fill_color = null
    p.legend.border_line_color = null

    const anchor = new Select({title: "anchor", options: [...Anchor], value: r.glyph.anchor})
    anchor.properties.value.change.connect(() => r.glyph.anchor = anchor.value as Anchor)

    const origin = new Select({title: "origin", options: [...ImageOrigin], value: r.glyph.origin})
    origin.properties.value.change.connect(() => r.glyph.origin = origin.value as ImageOrigin)

    const layout = new Column({children: [p, anchor, origin]})
    await display(layout, null)
  })
})

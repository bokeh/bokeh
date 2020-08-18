import {display, fig, row} from "../utils"

import {OutputBackend} from "@bokehjs/core/enums"
import {hatch_aliases} from "@bokehjs/core/visuals"
import {entries} from "@bokehjs/core/util/object"
// import {radians} from "@bokehjs/core/util/math"

describe("Glyph models", () => {
  const x = [1, 2, 3]
  const y = [1, 2, 3]

  it("should support AnnularWedge", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.annular_wedge({x, y, inner_radius: 0.1, outer_radius: 0.25, start_angle: 0.4, end_angle: 4.8, color: "green", alpha: 0.6})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support Annulus", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.annulus({x, y, inner_radius: 0.1, outer_radius: 0.25, color: "green", alpha: 0.6})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support Arc", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.arc({x, y, radius: 0.25, start_angle: 0.4, end_angle: 4.8, color: "green", alpha: 0.6, line_width: 5})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support Bezier", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.bezier({
        x0: [1, 2, 3], y0: [1, 2, 3],
        x1: [4, 5, 6], y1: [4, 5, 6],
        cx0: [1, 2, 3], cy0: [2, 3, 4],
        cx1: [4, 5, 6], cy1: [3, 4, 5],
        line_width: 5,
      })
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support Circle", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.circle({x, y, /*size,*/ radius: 0.25})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support Ellipse", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.ellipse({x, y, width: 0.5, height: 1})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support HArea", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.harea({x1: [1, 2, 3], x2: [2, 3, 4], y: [1, 2, 3]})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support HBar", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.hbar({y: 1, height: [1, 2, 3], left: [1, 2, 3], right: [4, 5, 6]})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  /*
  it("should support HexTile", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      //p.hex_tile({q, r})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support Image", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      //p.image({image, x, y, dw, dh})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support ImageRGBA", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      //p.image_rgba({image, x, y, dw, dh})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support ImageURL", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      //p.image_url({url, x, y, w, h})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })
  */

  it("should support Line", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.line({x, y})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support MultiLine", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.multi_line({xs: [x], ys: [y]})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support MultiPolygon", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.multi_polygons({xs: [[[x]]], ys: [[[y]]]})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support Patch", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.patch({x, y})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support Patches", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.patches({xs: [x], ys: [y]})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support Quad", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.quad({left: x, right: 1, bottom: y, top: 1})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support Quadratic", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.quadratic({x0: [1, 2, 3], y0: [1, 2, 3], x1: [4, 5, 6], y1: [4, 5, 6], cx: 1, cy: 1})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support Ray", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.ray({x, y})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support Rect", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.rect({x, y, width: 1, height: 2})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support Segment", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.segment({x0: [1, 2, 3], y0: [1, 2, 3], x1: [4, 5, 6], y1: [4, 5, 6]})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support Step", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.step({x, y, mode: "center"})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support Text", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.text({x, y, text: "Some"})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support VArea", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.varea({x, y1: [1, 2, 3], y2: [4, 5, 6]})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support VBar", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.vbar({x, width: [1, 2, 3], bottom: [1, 2, 3], top: [4, 5, 6]})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })

  it("should support Wedge", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.wedge({x, y, radius: 0.25, start_angle: 0.4, end_angle: 4.8})
      return p
    }
    await display(row([p("canvas"), p("svg")]), [450, 350])
  })


  it("should support fill with hatch patterns", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([400, 800], {output_backend, title: output_backend})
      let y = 0
      for (const [alias, name] of entries(hatch_aliases)) {
        p.quad({left: 0, bottom: y, right: 1.95, top: y + 0.75, hatch_pattern: alias, hatch_scale: 12})
        p.quad({left: 2.05, bottom: y, right: 4, top: y + 0.75, hatch_pattern: name, hatch_scale: 12})
        y++
      }
      return p
    }
    await display(row([p("canvas"), p("svg")]), [850, 850])
  })
})

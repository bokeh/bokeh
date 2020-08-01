import {display, fig, grid} from "./utils"

import pipeline from "./data"

import {Plot, Range1d, GlyphRenderer, LinearColorMapper, EqHistColorMapper} from "@bokehjs/models"
import {Plasma256} from "@bokehjs/api/palettes"
import {Float64NDArray} from "@bokehjs/core/util/ndarray"
import {linspace} from "@bokehjs/core/util/array"
import {Random} from "@bokehjs/core/util/random"

describe("Color mapping", () => {

  describe("with histogram equalization", () => {
    function sparse_squares(): Float64NDArray {
      const N = 100

      const buffer = new ArrayBuffer(8*N*N)
      const array = new Float64NDArray(buffer, [N, N])
      array.fill(0)

      function assign([xm, xn]: [number, number], [ym, yn]: [number, number], v: number): void {
        for (let i = xm; i < xn; i++) {
          for (let j = ym; j < yn; j++) {
            array[i*N + j] = v
          }
        }
      }

      assign([ 5, 10], [ 5, 10], 10)
      assign([50, 60], [50, 60], 100)
      assign([70, 80], [70, 80], 1000)

      return array
    }

    function simple_noise(): Float64NDArray {
      const random = new Random(1)
      const N = 10

      const buffer = new ArrayBuffer(8*N*N)
      const array = new Float64NDArray(buffer, [N, N])

      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          array[i*N + j] = random.float()**10
        }
      }

      return array
    }

    function simple_gaussian(): Float64NDArray {
      const {exp, PI} = Math

      const N = 100
      const x = linspace(-5, 5, N)
      const y = linspace(-5, 5, N)

      const buffer = new ArrayBuffer(8*N*N)
      const array = new Float64NDArray(buffer, [N, N])

      let k = 0
      for (const xi of x) {
        for (const yi of y) {
          array[k++] = 1/(2*PI) * exp(-(xi**2)/2 - yi**2/2)
        }
      }

      return array
    }

    function sparse_cells(): Float64NDArray {
      const {sin, cos} = Math

      const N = 100
      const x = linspace(0, 10, N)
      const y = linspace(0, 10, N)

      const buffer = new ArrayBuffer(8*N*N)
      const array = new Float64NDArray(buffer, [N, N])

      let k = 0
      for (const xi of x) {
        for (const yi of y) {
          array[k++] = sin(xi)*cos(yi)
        }
      }

      array[5*N + 5] = 10

      return array
    }

    function eqhist_mapped_plot(data: Float64NDArray) {
      const color_mapper = new EqHistColorMapper({palette: Plasma256})
      const p = fig([300, 300], {x_range: [0, 10], y_range: [0, 10]})
      p.image({image: [data as any], x: 0, y: 0, dw: 10, dh: 10, color_mapper})
      return p
    }

    it("should support pipeline data", async () =>{
      const p = eqhist_mapped_plot(pipeline)
      await display(p, [350, 350])
    })

    it("should support sparse squares data", async () =>{
      const squares = sparse_squares()
      const p = eqhist_mapped_plot(squares)
      await display(p, [350, 350])
    })

    it("should support uniformly distributed data", async () =>{
      const noise = simple_noise()
      const p = eqhist_mapped_plot(noise)
      await display(p, [350, 350])
    })

    it("should support gaussian distributed data", async () =>{
      const gaussian = simple_gaussian()
      const p = eqhist_mapped_plot(gaussian)
      await display(p, [350, 350])
    })

    it("should support sparse cells data", async () =>{
      const cells = sparse_cells()
      const p = eqhist_mapped_plot(cells)
      await display(p, [350, 350])
    })
  })

  describe("with multiple domains", () => {
    function make_grid() {
      const random = new Random(1)

      function data_flat(c: number) {
        const N = 500
        const x = random.floats(N)
        const y = random.floats(N)
        const r = linspace(0, 1, N)
        return [
          x.map((xi) => 100*xi),
          y.map((yi) => 100*yi),
          r.map((ri) => c*ri),
        ]
      }

      function data_sloped(c: number) {
        const N = 500
        const x = random.floats(N)
        const y = random.floats(N)
        const r = linspace(0, 1, N)
        return [
          x.map((xi) => 100*xi),
          y.map((yi) => 100*yi),
          r.map((ri, i) => c*(x[i] + y[i])*ri),
        ]
      }

      const mapper = new LinearColorMapper({palette: Plasma256, low_color: "white", high_color: "black"})

      const range = () => new Range1d({start: 0, end: 100})

      const p0 = fig([250, 250], {x_range: range(), y_range: range()})
      const [x0, y0, r0] = data_flat(0.8)
      const g0 = p0.circle({
        x: x0, y: y0, radius: r0,
        fill_color: {field: "radius", transform: mapper} as any, // XXX: bad types in VectorSpec, ColorMapper and Transform
        fill_alpha: 0.6, line_color: null,
      })
      mapper.domain.push([g0, "radius"])

      const p1 = fig([250, 250], {x_range: range(), y_range: range()})
      const [x1, y1, r1] = data_flat(1.0)
      const g1 = p1.circle({
        x: x1, y: y1, radius: r1,
        fill_color: {field: "radius", transform: mapper} as any,
        fill_alpha: 0.6, line_color: null,
      })
      mapper.domain.push([g1, "radius"])

      const p2 = fig([250, 250], {x_range: range(), y_range: range()})
      const [x2, y2, r2] = data_flat(1.2)
      const g2 = p2.circle({
        x: x2, y: y2, radius: r2,
        fill_color: {field: "radius", transform: mapper} as any,
        fill_alpha: 0.6, line_color: null,
      })
      mapper.domain.push([g2, "radius"])

      const p3 = fig([250, 250], {x_range: range(), y_range: range()})
      const [x3, y3, r3] = data_sloped(2.0)
      const g3 = p3.circle({
        x: x3, y: y3, radius: r3,
        fill_color: {field: "radius", transform: mapper} as any,
        fill_alpha: 0.6, line_color: null,
      })
      mapper.domain.push([g3, "radius"])

      // XXX: force change due to using Array.push()
      mapper.properties.domain.change.emit()

      return grid([[p0, p1], [p2, p3]])
    }

    it("should work", async () => {
      const grid = make_grid()
      await display(grid, [550, 550])
    })

    it("should work after panning", async () => {
      const grid = make_grid()
      const {view} = await display(grid, [550, 550])
      const pv3 = view.child_views[3] as Plot["__view_type__"]
      const p3 = pv3.model
      // TODO: synchronized
      p3.x_range.start = -60
      p3.x_range.end = 40
      p3.y_range.start = -60
      p3.y_range.end = 40
      await pv3.ready
    })

    it("should work after selection", async () => {
      const grid = make_grid()
      const {view} = await display(grid, [550, 550])
      const pv3 = view.child_views[3] as Plot["__view_type__"]
      const g3 = pv3.model.renderers[0] as GlyphRenderer
      const gv3 = pv3.renderer_views.get(g3) as GlyphRenderer["__view_type__"]
      const sel = gv3.model.get_selection_manager()
      const [sx0, sx1] = pv3.frame.x_scale.r_compute(20, 40)
      const [sy0, sy1] = pv3.frame.y_scale.r_compute(20, 40)
      sel.select([gv3], {type: "rect", sx0, sy0, sx1, sy1}, true, "append")
      await pv3.ready
    })
  })
})

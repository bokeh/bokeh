import {display, fig} from "./utils"

import pipeline from "./data"

import {EqHistColorMapper} from "@bokehjs/models"
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
})

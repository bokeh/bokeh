import {display, fig, column, row} from "../_util"

import {Anchor, ImageOrigin} from "@bokehjs/core/enums"
import type {OutputBackend} from "@bokehjs/core/enums"
import {encode_rgba} from "@bokehjs/core/util/color"
import {load_image} from "@bokehjs/core/util/image"
import {ndarray} from "@bokehjs/core/util/ndarray"
import type {ImageRGBA} from "@bokehjs/models"
import {DataRange1d} from "@bokehjs/models"

function get_image_data(image: HTMLImageElement): ImageData {
  const {width, height} = image
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(image, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

async function plot(anchor: ImageRGBA["anchor"], x_flipped: boolean = false, y_flipped: boolean = false, global_alpha: number = 1.0) {
  const {data, width, height} = get_image_data(await load_image("/assets/images/logo.svg"))
  const image = ndarray(data.buffer, {dtype: "uint32", shape: [width, height]})
  const output_backends: OutputBackend[] = ["canvas", "webgl"]

  const plots = []
  for (const output_backend of output_backends) {
    const onerow = []
    for (const origin of ImageOrigin) {
      const x_range = new DataRange1d({flipped: x_flipped})
      const y_range = new DataRange1d({flipped: y_flipped})

      const p = fig([200, 200], {title: `${output_backend} origin: ${origin}`, x_range, y_range, output_backend})
      p.image_rgba({image: {value: image}, x: 0, y: 0, dw: 10, dh: 10, origin, anchor, global_alpha})

      onerow.push(p)
    }
    plots.push(row(onerow))
  }

  await display(column(plots))
}

describe("ImageRGBA glyph", () => { // TODO: async describe
  for (const [x_flipped, y_flipped] of [[false, false], [true, false], [false, true], [true, true]]) {
    const xf = x_flipped ? " with flipped x-axis" : ""
    const yf = y_flipped ? " with flipped y-axis" : ""

    for (const anchor of Anchor) {
      if (!anchor.includes("_")) {
        continue
      }

      it(`should support ${anchor} anchor with all origins${xf}${yf}`, async () => {
        await plot(anchor, x_flipped, y_flipped)
      })
    }

    it(`should support [40%, 20%] anchor with all origins${xf}${yf}`, async () => {
      await plot([0.4, 0.2], x_flipped, y_flipped)
    })

    it(`should support [center, 20%] anchor with all origins${xf}${yf}`, async () => {
      await plot(["center", 0.2], x_flipped, y_flipped)
    })
  }

  it("should support combine alpha", async () => {
    function rgba_image() {
      const N = 5
      const d = new Uint32Array(N*N)
      const dv = new DataView(d.buffer)

      const {trunc} = Math
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const r = trunc(i/N*255)
          const g = 0
          const b = 255 - r
          const a = trunc(j/N*255)
          dv.setUint32(4*(i*N + j), encode_rgba([r, g, b, a]))
        }
      }
      return ndarray(d, {dtype: "uint32", shape: [N, N]})
    }

    function make_plot(output_backend: OutputBackend) {
      const p = fig([350, 150], {output_backend, title: output_backend})
      p.image_rgba({image: {value: rgba_image()}, x: 0, y: 0, dw: 1, dh: 1, global_alpha: 1.0})
      p.image_rgba({image: {value: rgba_image()}, x: 1, y: 0, dw: 1, dh: 1, global_alpha: 0.66})
      p.image_rgba({image: {value: rgba_image()}, x: 2, y: 0, dw: 1, dh: 1, global_alpha: 0.33})
      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("webgl")

    await display(column([p0, p1]))
  })
})

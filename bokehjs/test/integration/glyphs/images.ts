import {display, fig, row} from "../_util"

import {Anchor, ImageOrigin} from "@bokehjs/core/enums"
import {load_image} from "@bokehjs/core/util/image"
import {ndarray} from "@bokehjs/core/util/ndarray"
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

describe("ImageRGBA glyph", () => { // TODO: async describe
  for (const [x_flipped, y_flipped] of [[false, false], [true, false], [false, true], [true, true]]) {
    const xf = x_flipped ? " with flipped x-axis" : ""
    const yf = y_flipped ? " with flipped y-axis" : ""

    for (const anchor of Anchor) {
      if (!anchor.includes("_"))
        continue

      it(`should support ${anchor} anchor with all origins${xf}${yf}`, async () => {
        const {data, width, height} = get_image_data(await load_image("/assets/images/logo.svg"))
        const image = ndarray(data.buffer, {dtype: "uint32", shape: [width, height]})

        const plots = []
        for (const origin of ImageOrigin) {
          const x_range = new DataRange1d({flipped: x_flipped})
          const y_range = new DataRange1d({flipped: y_flipped})

          const p = fig([200, 200], {title: `Origin: ${origin}`, x_range, y_range})
          p.image_rgba({image: {value: image}, x: 0, y: 0, dw: 10, dh: 10, origin, anchor})

          plots.push(p)
        }

        await display(row(plots))
      })
    }
  }
})

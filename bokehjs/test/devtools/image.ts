import {PNG} from "pngjs"
import pixelmatch from "pixelmatch"

export type ImageDiff = {pixels: number, percent: number, diff: Buffer}

function encode(r: number, g: number, b: number, a: number = 1.0): number {
  return (a*255 & 0xFF) << 24 | (b & 0xFF) << 16 | (g & 0xFF) << 8 | (r & 0xFF)
}

function image_data(image: PNG): Uint32Array {
  return new Uint32Array(image.data.buffer, image.data.byteOffset, image.width*image.height)
}

function resize_image(image: PNG, width: number, height: number): PNG {
  const resized = new PNG({width, height})

  const image_array = image_data(image)
  const resized_array = image_data(resized)

  resized_array.fill(encode(255, 255, 255))

  const min_width = Math.min(image.width, width)
  const min_height = Math.min(image.height, height)
  for (let i = 0; i < min_height; i++) {
    const data = image_array.subarray(i*image.width, i*image.width + min_width)
    resized_array.set(data, i*resized.width)
  }

  return resized
}

export function diff_image(existing: Buffer, current: Buffer): ImageDiff | null {
  let existing_img: PNG = PNG.sync.read(existing)
  let current_img: PNG = PNG.sync.read(current)

  const same_dims = existing_img.width == current_img.width &&
                    existing_img.height == current_img.height

  if (!same_dims) {
    const new_width = Math.max(existing_img.width, current_img.width)
    const new_height = Math.max(existing_img.height, current_img.height)
    existing_img = resize_image(existing_img, new_width, new_height)
    current_img = resize_image(current_img, new_width, new_height)
  }

  const {width, height} = current_img
  const diff_img = new PNG({width, height})

  // Tolerate raster rounding and antialiasing while retaining sensitivity to small color changes.
  const pixels = pixelmatch(existing_img.data, current_img.data, diff_img.data, width, height, {
    threshold: 0.01,
    includeAA: false,
  })

  if (pixels == 0) {
    return null
  } else {
    return {
      pixels,
      percent: pixels/(width*height)*100,
      diff: PNG.sync.write(diff_img),
    }
  }
}

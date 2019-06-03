import {isArray} from "core/util/types"

export type Image = HTMLImageElement

export class ImagePool {

  protected images: Image[] = []

  private new_image(): Image {
    const img = new Image()
    img.crossOrigin = "anonymous"
    return img
  }

  pop(): Image {
    const img = this.images.pop()
    return img != null ? img : this.new_image()
  }

  push(img: Image | Image[]): void {
    if (this.images.length > 50)
      return

    if (isArray(img))
      this.images.push(...img)
    else
      this.images.push(img)
  }
}

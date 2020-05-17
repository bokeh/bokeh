import {ImageBase, ImageBaseView, ImageDataBase} from "./image_base"
import {Arrayable, TypedArray} from "core/types"
import {isArray} from "core/util/types"
import * as p from "core/properties"

export interface ImageRGBAData extends ImageDataBase {}

export interface ImageRGBAView extends ImageRGBAData {}

export class ImageRGBAView extends ImageBaseView {
  model: ImageRGBA
  visuals: ImageRGBA.Visuals

  protected _flat_img_to_buf8(img: Arrayable<number>): Uint8Array {
    let array: TypedArray
    if (isArray(img)) {
      array = new Uint32Array(img)
    } else {
      array = img as TypedArray
    }
    return new Uint8Array(array.buffer)
  }
}

export namespace ImageRGBA {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ImageBase.Props

  export type Visuals = ImageBase.Visuals
}

export interface ImageRGBA extends ImageRGBA.Attrs {}

export class ImageRGBA extends ImageBase {
  properties: ImageRGBA.Props
  __view_type__: ImageRGBAView

  constructor(attrs?: Partial<ImageRGBA.Attrs>) {
    super(attrs)
  }

  static init_ImageRGBA(): void {
    this.prototype.default_view = ImageRGBAView
  }
}

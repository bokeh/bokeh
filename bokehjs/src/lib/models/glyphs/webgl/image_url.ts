import type {Texture2D, Texture2DOptions} from "regl"
import type {Transform} from "./base"
import {BaseGLGlyph} from "./base"
import {Float32Buffer} from "./buffer"
import type {ReglWrapper} from "./regl_wrap"
import type {ImageProps} from "./types"
import type {ImageURLView, CanvasImage} from "../image_url"

export class ImageURLGL extends BaseGLGlyph {
  private _textures: (Texture2D | null)[] = []
  private _bounds: (Float32Buffer | null)[] = []
  private _images: (CanvasImage | null)[] = []

  constructor(regl_wrapper: ReglWrapper, override readonly glyph: ImageURLView) {
    super(regl_wrapper, glyph)
  }

  override draw(indices: number[], main_glyph: ImageURLView, transform: Transform): void {
    const main_gl = main_glyph.glglyph!
    const images_changed = main_gl._sync_images()
    if (main_gl.data_changed || main_gl.data_mapped || images_changed) {
      main_gl._set_bounds()
    }
    main_gl.data_changed = false
    main_gl.data_mapped = false

    const {angle, global_alpha} = this.glyph
    for (const i of indices) {
      const texture = main_gl._textures[i]
      const bounds = main_gl._bounds[i]
      if (texture == null || bounds == null) {
        continue
      }
      const props: ImageProps = {
        scissor: this.regl_wrapper.scissor,
        viewport: this.regl_wrapper.viewport,
        canvas_size: [transform.width, transform.height],
        bounds,
        tex: texture,
        global_alpha: global_alpha.get(i),
        angle: angle.get(i),
      }
      this.regl_wrapper.image()(props)
    }
    main_glyph.notify_images_rendered()
  }

  private _resize(length: number): void {
    while (this._textures.length > length) {
      this.release(this._textures.pop())
      this.release(this._bounds.pop())
      this._images.pop()
    }
    while (this._textures.length < length) {
      this._textures.push(null)
      this._bounds.push(null)
      this._images.push(null)
    }
  }

  private _sync_images(): boolean {
    const {image} = this.glyph
    this._resize(image.length)
    let changed = false
    for (let i = 0; i < image.length; i++) {
      const source = image[i]
      if (source === this._images[i]) {
        continue
      }
      changed = true
      this._images[i] = source
      if (source == null || source.naturalWidth == 0 || source.naturalHeight == 0) {
        this._textures[i] = this.release(this._textures[i])
        continue
      }
      const options: Texture2DOptions = {
        data: source,
        min: "linear",
        mag: "linear",
        wrap: "clamp",
      }
      try {
        if (this._textures[i] == null) {
          this._textures[i] = this.own(this.regl_wrapper.texture(options))
        } else {
          this.regl_wrapper.flush_resource(this._textures[i]!)
          this._textures[i]!(options)
        }
      } catch {
        // WebGL cannot upload a cross-origin image without CORS permission.
        // Canvas can still display it, so switch this glyph to its Canvas path.
        this._textures[i] = this.release(this._textures[i])
        this.glyph.disable_webgl()
        return changed
      }
    }
    return changed
  }

  override context_restored(): void {
    super.context_restored()
    // Force the retained HTML images back through texture upload. ReGL can
    // recreate texture handles, but cannot replay later in-place updates.
    this._images.fill(null)
  }

  private _set_bounds(): void {
    const {image, sx, sy, sw, sh, anchor} = this.glyph
    this._resize(image.length)
    for (let i = 0; i < image.length; i++) {
      const source = image[i]
      const width = isFinite(sw[i]) ? sw[i] : source?.naturalWidth ?? NaN
      const height = isFinite(sh[i]) ? sh[i] : source?.naturalHeight ?? NaN
      if (!isFinite(sx[i] + sy[i] + width + height)) {
        this._bounds[i] = this.release(this._bounds[i])
        continue
      }
      if (this._bounds[i] == null) {
        this._bounds[i] = this.own(new Float32Buffer(this.regl_wrapper))
      }
      const bounds = this._bounds[i]!.get_sized_array(4)
      bounds[0] = sx[i] - anchor.x*width
      bounds[1] = sy[i] - anchor.y*height
      bounds[2] = bounds[0] + width
      bounds[3] = bounds[1] + height
      this._bounds[i]!.update()
    }
  }

  override destroy(): void {
    super.destroy()
    this._textures = []
    this._bounds = []
    this._images = []
  }
}

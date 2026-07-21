import type {Texture2D, Texture2DOptions} from "regl"
import {CanvasLayer} from "core/util/canvas"
import {BBox} from "core/util/bbox"
import type {Transform} from "./base"
import {BaseGLGlyph} from "./base"
import {Float32Buffer, Uint8Buffer} from "./buffer"
import type {ReglWrapper} from "./regl_wrap"
import type {TextProps} from "./types"
import type {TextView} from "../text"

type Placement = {
  index: number
  bbox: BBox
  x: number
  y: number
  width: number
  height: number
}

type PageSpec = {
  placements: Placement[]
  width: number
  height: number
}

type AtlasEntry = Placement & {
  page: number
  slot: number
  valid: boolean
}

type AtlasPage = {
  texture: Texture2D
  entries: number[]
  bounds: Float32Buffer
  uv: Float32Buffer
  origin: Float32Buffer
  angle: Float32Buffer
  show: Uint8Buffer
}

/** Raster text atlas with instanced screen-space quads.
 *
 * Canvas and MathJax remain the canonical rasterizers, which keeps multiline
 * layout, outline shapes, hatches, font metrics, TeX, and MathML consistent
 * with the Canvas backend. The resulting high-DPI atlas pages are retained on
 * the GPU; pan and zoom only update compact quad geometry. */
export class TextGL extends BaseGLGlyph {
  private _pages: AtlasPage[] = []
  private _entries: (AtlasEntry | null)[] = []
  private _atlas_pixel_ratio = 0

  constructor(regl_wrapper: ReglWrapper, override readonly glyph: TextView) {
    super(regl_wrapper, glyph)
  }

  override draw(indices: number[], _main_glyph: TextView, transform: Transform): void {
    const rebuild = this.data_changed || this.visuals_changed || this._atlas_pixel_ratio != transform.pixel_ratio
    if (rebuild) {
      if (!this._rebuild_atlas(transform.pixel_ratio)) {
        return
      }
      this.data_changed = false
      this.visuals_changed = false
    }

    const geometry_changed = rebuild || this.data_mapped
    if (geometry_changed) {
      this._set_geometry()
      this.data_mapped = false
    }

    const selection_changed = this.revision_changed("selection", "text-mask")
    if (rebuild || geometry_changed || selection_changed) {
      this._set_show(indices)
      this.consume_revision("selection", "text-mask")
    }

    for (const page of this._pages) {
      const ntexts = page.entries.length
      if (ntexts == 0) {
        continue
      }
      const props: TextProps = {
        scissor: this.regl_wrapper.scissor,
        viewport: this.regl_wrapper.viewport,
        canvas_size: [transform.width, transform.height],
        bounds: page.bounds,
        uv: page.uv,
        origin: page.origin,
        angle: page.angle,
        show: page.show,
        tex: page.texture,
        ntexts,
      }
      this.regl_wrapper.text()(props)
    }
  }

  private _rebuild_atlas(pixel_ratio: number): boolean {
    this._release_pages()
    this._entries = new Array(this.glyph.data_size).fill(null)
    this._atlas_pixel_ratio = pixel_ratio

    // A 2048-device-pixel page is supported by every WebGL implementation
    // and caps peak allocation at 16 MiB per fully occupied RGBA page.
    const device_page_size = Math.min(2048, this.regl_wrapper.max_texture_size)
    const page_size = Math.max(1, Math.floor(device_page_size/pixel_ratio))
    const specs: PageSpec[] = []

    let x = 0
    let y = 0
    let row_height = 0
    const new_page = (): PageSpec => {
      const page = {placements: [], width: 0, height: 0}
      specs.push(page)
      x = 0
      y = 0
      row_height = 0
      return page
    }

    for (let i = 0; i < this.glyph.data_size; i++) {
      const source_bbox = this.glyph.webgl_bbox(i)
      if (source_bbox == null) {
        continue
      }
      const width = Math.max(1, Math.ceil(source_bbox.width))
      const height = Math.max(1, Math.ceil(source_bbox.height))
      if (width > page_size || height > page_size) {
        // Preserve correctness for unusually large labels through the normal
        // Canvas fallback instead of silently downsampling or clipping them.
        this.glyph.disable_webgl()
        return false
      }

      let page = specs[specs.length - 1] ?? new_page()
      if (x != 0 && x + width > page_size) {
        x = 0
        y += row_height
        row_height = 0
      }
      if (y + height > page_size) {
        page = new_page()
      }

      const bbox = new BBox({left: source_bbox.left, top: source_bbox.top, width, height})
      const placement = {index: i, bbox, x, y, width, height}
      page.placements.push(placement)
      page.width = Math.max(page.width, x + width)
      page.height = Math.max(page.height, y + height)
      x += width
      row_height = Math.max(row_height, height)
    }

    try {
      for (let page_index = 0; page_index < specs.length; page_index++) {
        const spec = specs[page_index]
        const layer = new CanvasLayer("canvas", true)
        layer.resize(spec.width, spec.height)
        const ctx = layer.prepare()
        try {
          for (const placement of spec.placements) {
            this.glyph.webgl_paint(
              ctx, placement.index,
              placement.x - placement.bbox.left,
              placement.y - placement.bbox.top,
            )
          }
        } finally {
          layer.finish()
        }

        const options: Texture2DOptions = {
          data: layer.canvas,
          min: "linear",
          mag: "linear",
          wrap: "clamp",
        }
        const texture = this.own(this.regl_wrapper.texture(options))
        const entries = spec.placements.map(({index}) => index)
        const n = entries.length
        const bounds = this.own(new Float32Buffer(this.regl_wrapper, 4))
        const uv = this.own(new Float32Buffer(this.regl_wrapper, 4))
        const origin = this.own(new Float32Buffer(this.regl_wrapper, 2))
        const angle = this.own(new Float32Buffer(this.regl_wrapper))
        const show = this.own(new Uint8Buffer(this.regl_wrapper))
        bounds.get_sized_array(4*n).fill(0)
        origin.get_sized_array(2*n).fill(0)
        angle.get_sized_array(n).fill(0)
        show.get_sized_array(n).fill(0)

        const uv_array = uv.get_sized_array(4*n)
        const ratio = layer.pixel_ratio
        const atlas_width = layer.canvas.width
        const atlas_height = layer.canvas.height
        for (let slot = 0; slot < n; slot++) {
          const placement = spec.placements[slot]
          const offset = 4*slot
          uv_array[offset] = placement.x*ratio/atlas_width
          uv_array[offset + 1] = placement.y*ratio/atlas_height
          uv_array[offset + 2] = (placement.x + placement.width)*ratio/atlas_width
          uv_array[offset + 3] = (placement.y + placement.height)*ratio/atlas_height
          this._entries[placement.index] = {...placement, page: page_index, slot, valid: false}
        }
        uv.update()
        bounds.update()
        origin.update()
        angle.update()
        show.update()
        this._pages.push({texture, entries, bounds, uv, origin, angle, show})
      }
    } catch {
      this._release_pages()
      this.glyph.disable_webgl()
      return false
    }

    return true
  }

  private _set_geometry(): void {
    const {sx, sy, x_offset, y_offset, angle, anchor_, swidth, sheight} = this.glyph
    for (const page of this._pages) {
      const bounds = page.bounds.get_array()
      const origins = page.origin.get_array()
      const angles = page.angle.get_array()
      for (let slot = 0; slot < page.entries.length; slot++) {
        const index = page.entries[slot]
        const entry = this._entries[index]!
        const x = sx[index] + x_offset.get(index)
        const y = sy[index] + y_offset.get(index)
        const angle_i = angle.get(index)
        const anchor = anchor_.get(index)
        const dx = anchor.x*swidth[index]
        const dy = anchor.y*sheight[index]
        const valid = isFinite(x + y + angle_i + dx + dy)
        entry.valid = valid

        const bo = 4*slot
        const oo = 2*slot
        if (valid) {
          bounds[bo] = x - dx + entry.bbox.left
          bounds[bo + 1] = y - dy + entry.bbox.top
          bounds[bo + 2] = x - dx + entry.bbox.right
          bounds[bo + 3] = y - dy + entry.bbox.bottom
          origins[oo] = x
          origins[oo + 1] = y
          angles[slot] = angle_i
        } else {
          bounds.fill(0, bo, bo + 4)
          origins.fill(0, oo, oo + 2)
          angles[slot] = 0
        }
      }
      page.bounds.update()
      page.origin.update()
      page.angle.update()
    }
  }

  private _set_show(indices: number[]): void {
    for (const page of this._pages) {
      page.show.get_array().fill(0)
    }
    for (const index of indices) {
      const entry = this._entries[index]
      if (entry != null && entry.valid) {
        this._pages[entry.page].show.get_array()[entry.slot] = 255
      }
    }
    for (const page of this._pages) {
      page.show.update()
    }
  }

  private _release_pages(): void {
    for (const page of this._pages) {
      this.release(page.texture)
      this.release(page.bounds)
      this.release(page.uv)
      this.release(page.origin)
      this.release(page.angle)
      this.release(page.show)
    }
    this._pages = []
  }

  override destroy(): void {
    this._release_pages()
    this._entries = []
    super.destroy()
  }
}

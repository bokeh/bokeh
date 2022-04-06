import {Tile} from "./tile_source"
import {Extent, Bounds} from "./tile_utils"
import {TileSource} from "./tile_source"
import {WMTSTileSource} from "./wmts_tile_source"
import {Renderer, RendererView} from "../renderers/renderer"
import {Plot} from "../plots/plot"
import {CartesianFrame} from "../canvas/cartesian_frame"
import {Range} from "../ranges/range"
import {Range1d} from "../ranges/range1d"
import {div, style, remove} from "core/dom"
import * as p from "core/properties"
import {Image, ImageLoader} from "core/util/image"
import {includes} from "core/util/array"
import {isString} from "core/util/types"
import {Context2d} from "core/util/canvas"

import attribution_css from "styles/attribution.css"

export type TileData = Tile & ({img: Image, loaded: true} | {img: undefined, loaded: false}) & {
  normalized_coords: [number, number, number]
  quadkey: string
  cache_key: string
  bounds: Bounds
  finished: boolean
  x_coord: number
  y_coord: number
}

export class TileRendererView extends RendererView {
  override model: TileRenderer

  protected _tiles: TileData[]

  protected extent: Extent
  protected initial_extent: Extent
  protected _last_height?: number
  protected _last_width?: number
  protected map_initialized?: boolean
  protected render_timer?: number
  protected prefetch_timer?: number

  protected attribution_el?: HTMLElement

  override initialize(): void {
    this._tiles = []
    super.initialize()
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_render())
    this.connect(this.model.tile_source.change, () => this.request_render())
  }

  override remove(): void {
    if (this.attribution_el != null)
      remove(this.attribution_el)
    super.remove()
  }

  get_extent(): Extent {
    return [this.x_range.start, this.y_range.start, this.x_range.end, this.y_range.end]
  }

  private get map_plot(): Plot {
    return this.plot_view.model
  }

  private get map_canvas(): Context2d {
    return this.layer.ctx
  }

  private get map_frame(): CartesianFrame {
    return this.plot_view.frame
  }

  private get x_range(): Range {
    return this.map_plot.x_range
  }

  private get y_range(): Range {
    return this.map_plot.y_range
  }

  protected _set_data(): void {
    this.extent = this.get_extent()
    this._last_height = undefined
    this._last_width = undefined
  }

  protected _update_attribution(): void {
    if (this.attribution_el != null)
      remove(this.attribution_el)

    const {attribution} = this.model.tile_source

    if (isString(attribution) && attribution.length > 0) {
      const {layout, frame} = this.plot_view
      const offset_right = layout.bbox.width - frame.bbox.right
      const offset_bottom = layout.bbox.height - frame.bbox.bottom
      const max_width = frame.bbox.width

      this.attribution_el = div({
        style: {
          right: `${offset_right}px`,
          bottom: `${offset_bottom}px`,
          "max-width": `${max_width}px`,
        },
      })

      const style_el = style(attribution_css)
      const contents_el = div()
      contents_el.innerHTML = attribution

      const shadow_el = this.attribution_el.attachShadow({mode: "open"})
      shadow_el.appendChild(style_el)
      shadow_el.appendChild(contents_el)

      this.attribution_el.title = contents_el.textContent!.replace(/\s*\n\s*/g, " ")
      this.canvas.add_event(this.attribution_el)
    }
    // TODO: add support for DOMElement
  }

  protected _map_data(): void {
    this.initial_extent = this.get_extent()
    const zoom_level = this.model.tile_source.get_level_by_extent(this.initial_extent, this.map_frame.bbox.height, this.map_frame.bbox.width)
    const new_extent = this.model.tile_source.snap_to_zoom_level(this.initial_extent, this.map_frame.bbox.height, this.map_frame.bbox.width, zoom_level)
    this.x_range.start = new_extent[0]
    this.y_range.start = new_extent[1]
    this.x_range.end = new_extent[2]
    this.y_range.end = new_extent[3]
    if (this.x_range instanceof Range1d) {
      this.x_range.reset_start = new_extent[0]
      this.x_range.reset_end = new_extent[2]
    }
    if (this.y_range instanceof Range1d) {
      this.y_range.reset_start = new_extent[1]
      this.y_range.reset_end = new_extent[3]
    }
    this._update_attribution()
  }

  protected _create_tile(x: number, y: number, z: number, bounds: Bounds, cache_only: boolean = false): void {
    const quadkey = this.model.tile_source.tile_xyz_to_quadkey(x, y, z)
    const cache_key = this.model.tile_source.tile_xyz_to_key(x, y, z)

    if (this.model.tile_source.tiles.has(cache_key))
      return

    const [nx, ny, nz] = this.model.tile_source.normalize_xyz(x, y, z)
    const src = this.model.tile_source.get_image_url(nx, ny, nz)

    const tile: TileData = {
      img: undefined,
      tile_coords: [x, y, z],
      normalized_coords: [nx, ny, nz],
      quadkey,
      cache_key,
      bounds,
      loaded: false,
      finished: false,
      x_coord: bounds[0],
      y_coord: bounds[3],
    }

    this.model.tile_source.tiles.set(cache_key, tile)
    this._tiles.push(tile)

    new ImageLoader(src, {
      loaded: (img: Image) => {
        Object.assign(tile, {img, loaded: true})

        if (cache_only) {
          tile.finished = true
          this.notify_finished()
        } else
          this.request_render()
      },
      failed() {
        tile.finished = true
      },
    })
  }

  protected _enforce_aspect_ratio(): void {
    // brute force way of handling resize or sizing_mode event -------------------------------------------------------------
    if ((this._last_height !== this.map_frame.bbox.height) || (this._last_width !== this.map_frame.bbox.width)) {
      const extent = this.get_extent()
      const zoom_level = this.model.tile_source.get_level_by_extent(extent, this.map_frame.bbox.height, this.map_frame.bbox.width)
      const new_extent = this.model.tile_source.snap_to_zoom_level(extent, this.map_frame.bbox.height, this.map_frame.bbox.width, zoom_level)
      this.x_range.setv({start: new_extent[0], end: new_extent[2]})
      this.y_range.setv({start: new_extent[1], end: new_extent[3]})
      this.extent = new_extent
      this._last_height = this.map_frame.bbox.height
      this._last_width = this.map_frame.bbox.width
    }
  }

  override has_finished(): boolean {
    if (!super.has_finished())
      return false

    if (this._tiles.length == 0)
      return false

    for (const tile of this._tiles) {
      if (!tile.finished)
        return false
    }

    return true
  }

  protected _render(): void {
    if (this.map_initialized == null) {
      this._set_data()
      this._map_data()
      this.map_initialized = true
    }

    this._enforce_aspect_ratio()

    this._update()
    if (this.prefetch_timer != null) {
      clearTimeout(this.prefetch_timer)
    }

    this.prefetch_timer = setTimeout(this._prefetch_tiles.bind(this), 500)

    if (this.has_finished()) {
      this.notify_finished()
    }
  }

  _draw_tile(tile_key: string): void {
    const tile_data = this.model.tile_source.tiles.get(tile_key) as TileData | undefined
    if (tile_data != null && tile_data.loaded) {
      const [[sxmin], [symin]] = this.coordinates.map_to_screen([tile_data.bounds[0]], [tile_data.bounds[3]])
      const [[sxmax], [symax]] = this.coordinates.map_to_screen([tile_data.bounds[2]], [tile_data.bounds[1]])
      const sw = sxmax - sxmin
      const sh = symax - symin
      const sx = sxmin
      const sy = symin
      const old_smoothing = this.map_canvas.getImageSmoothingEnabled()
      this.map_canvas.setImageSmoothingEnabled(this.model.smoothing)
      this.map_canvas.drawImage(tile_data.img, sx, sy, sw, sh)
      this.map_canvas.setImageSmoothingEnabled(old_smoothing)
      tile_data.finished = true
    }
  }

  protected _set_rect(): void {
    const outline_width = this.plot_view.model.outline_line_width
    const l = this.map_frame.bbox.left + (outline_width/2)
    const t = this.map_frame.bbox.top + (outline_width/2)
    const w = this.map_frame.bbox.width - outline_width
    const h = this.map_frame.bbox.height - outline_width
    this.map_canvas.rect(l, t, w, h)
    this.map_canvas.clip()
  }

  protected _render_tiles(tile_keys: string[]): void {
    this.map_canvas.save()
    this._set_rect()
    this.map_canvas.globalAlpha = this.model.alpha
    for (const tile_key of tile_keys) {
      this._draw_tile(tile_key)
    }
    this.map_canvas.restore()
  }

  protected _prefetch_tiles(): void {
    const {tile_source} = this.model
    const extent = this.get_extent()
    const h = this.map_frame.bbox.height
    const w = this.map_frame.bbox.width
    const zoom_level = this.model.tile_source.get_level_by_extent(extent, h, w)
    const tiles = this.model.tile_source.get_tiles_by_extent(extent, zoom_level)
    for (let t = 0, end = Math.min(10, tiles.length); t < end; t++) {
      const [x, y, z] = tiles[t]
      const children = this.model.tile_source.children_by_tile_xyz(x, y, z)
      for (const c of children) {
        const [cx, cy, cz, cbounds] = c
        if (tile_source.tiles.has(tile_source.tile_xyz_to_key(cx, cy, cz))) {
          continue
        } else {
          this._create_tile(cx, cy, cz, cbounds, true)
        }
      }
    }
  }

  protected _fetch_tiles(tiles: [number, number, number, Bounds][]): void {
    for (const tile of tiles) {
      const [x, y, z, bounds] = tile
      this._create_tile(x, y, z, bounds)
    }
  }

  protected _update(): void {
    const {tile_source} = this.model

    const {min_zoom} = tile_source
    const {max_zoom} = tile_source

    let extent = this.get_extent()
    const zooming_out = (this.extent[2] - this.extent[0]) < (extent[2] - extent[0])
    const h = this.map_frame.bbox.height
    const w = this.map_frame.bbox.width
    let zoom_level = tile_source.get_level_by_extent(extent, h, w)
    let snap_back = false

    if (zoom_level < min_zoom) {
      extent = this.extent
      zoom_level = min_zoom
      snap_back = true
    } else if (zoom_level > max_zoom) {
      extent = this.extent
      zoom_level = max_zoom
      snap_back = true
    }

    if (snap_back) {
      this.x_range.setv({start: extent[0], end: extent[2]})
      this.y_range.setv({start: extent[1], end: extent[3]})
    }

    this.extent = extent
    const tiles = tile_source.get_tiles_by_extent(extent, zoom_level)
    const need_load: typeof tiles = []
    const cached = []
    const parents = []
    const children = []

    for (const t of tiles) {
      const [x, y, z] = t
      const key = tile_source.tile_xyz_to_key(x, y, z)
      const tile = tile_source.tiles.get(key) as TileData | undefined
      if (tile != null && tile.loaded) {
        cached.push(key)
      } else {
        if (this.model.render_parents) {
          const [px, py, pz] = tile_source.get_closest_parent_by_tile_xyz(x, y, z)
          const parent_key = tile_source.tile_xyz_to_key(px, py, pz)
          const parent_tile = tile_source.tiles.get(parent_key) as TileData | undefined
          if ((parent_tile != null) && parent_tile.loaded && !includes(parents, parent_key)) {
            parents.push(parent_key)
          }
          if (zooming_out) {
            const child_tiles = tile_source.children_by_tile_xyz(x, y, z)
            for (const [cx, cy, cz] of child_tiles) {
              const child_key = tile_source.tile_xyz_to_key(cx, cy, cz)

              if (tile_source.tiles.has(child_key))
                children.push(child_key)
            }
          }
        }
      }

      if (tile == null)
        need_load.push(t)
    }

    // draw stand-in parents ----------
    this._render_tiles(parents)
    this._render_tiles(children)

    // draw cached ----------
    this._render_tiles(cached)

    // fetch missing -------
    if (this.render_timer != null) {
      clearTimeout(this.render_timer)
    }

    this.render_timer = setTimeout((() => this._fetch_tiles(need_load)), 65)
  }
}

export namespace TileRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Renderer.Props & {
    alpha: p.Property<number>
    smoothing: p.Property<boolean>
    tile_source: p.Property<TileSource>
    render_parents: p.Property<boolean>
  }
}

export interface TileRenderer extends TileRenderer.Attrs {}

export class TileRenderer extends Renderer {
  override properties: TileRenderer.Props
  override __view_type__: TileRendererView

  constructor(attrs?: Partial<TileRenderer.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TileRendererView

    this.define<TileRenderer.Props>(({Boolean, Number, Ref}) => ({
      alpha:          [ Number, 1.0 ],
      smoothing:      [ Boolean, true ],
      tile_source:    [ Ref(TileSource), () => new WMTSTileSource() ],
      render_parents: [ Boolean, true ],
    }))

    this.override<TileRenderer.Props>({
      level: "image",
    })
  }
}

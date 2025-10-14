import type {Tile} from "./tile_source"
import {TileSource} from "./tile_source"
import type {Extent, Bounds} from "./tile_utils"
import {bounds_to_extent, extent_to_bounds} from "./tile_utils"
import {WMTSTileSource} from "./wmts_tile_source"
import {Renderer, RendererView} from "../renderers/renderer"
import type {Range} from "../ranges/range"
import {Range1d} from "../ranges/range1d"
import {HTML} from "../dom/html"
import type * as p from "core/properties"
import type {Image} from "core/util/image"
import {ImageLoader} from "core/util/image"
import {includes} from "core/util/array"
import type {Context2d} from "core/util/canvas"
import {logger} from "core/logging"
import {compute_web_mercator_projection, invert_web_mercator_projection} from "core/util/projections"

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
  declare model: TileRenderer

  protected _tiles: TileData[] | null = null

  protected extent: Extent
  protected initial_extent: Extent
  protected _last_height?: number
  protected _last_width?: number
  protected map_initialized: boolean = false
  protected render_timer?: number
  protected prefetch_timer?: number

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_paint())
    this.connect(this.model.tile_source.change, () => this.request_paint())
  }

  override force_finished(): void {
    super.force_finished()
    if (this._tiles == null) {
      this._tiles = []
    }
  }

  get_extent(): Extent {
    const {x_range, y_range} = this
    const x_start = x_range.start
    const y_start = y_range.start
    const x_end = x_range.end
    const y_end = y_range.end
    if (!(isFinite(x_start) && isFinite(y_start) && isFinite(x_end) && isFinite(y_end))) {
      logger.warn("tile extent is not fully defined")
    }
    return this._compute_projection([x_start, y_start, x_end, y_end])
  }

  private get x_range(): Range {
    return this.plot_model.x_range
  }

  private get y_range(): Range {
    return this.plot_model.y_range
  }

  _compute_projection(extent: Extent): Extent {
    const {data_coordinate_system} = this.model

    const [x_start, y_start, x_end, y_end] = extent
    const [x_start_proj, y_start_proj] = compute_web_mercator_projection(data_coordinate_system, x_start, y_start)
    const [x_end_proj] = compute_web_mercator_projection(data_coordinate_system, x_end, y_start)
    const [, y_end_proj] = compute_web_mercator_projection(data_coordinate_system, x_start, y_end)

    return [x_start_proj, y_start_proj, x_end_proj, y_end_proj]
  }

  _invert_projection(extent: Extent): Extent {
    const {data_coordinate_system} = this.model
    const [x_start_proj, y_start_proj, x_end_proj, y_end_proj] = extent

    const [x_start, y_start] = invert_web_mercator_projection(data_coordinate_system, x_start_proj, y_start_proj)
    const [x_end] = invert_web_mercator_projection(data_coordinate_system, x_end_proj, y_start_proj)
    const [, y_end] = invert_web_mercator_projection(data_coordinate_system, x_start_proj, y_end_proj)

    return [x_start, y_start, x_end, y_end]
  }

  protected _set_data(): void {
    this.extent = this.get_extent()
    this._last_height = undefined
    this._last_width = undefined
  }

  override get attribution(): HTML | string | null {
    return new HTML({html: [this.model.tile_source.attribution]})
  }

  protected _map_data(): void {
    this.initial_extent = this.get_extent()
    const {width, height} = this.plot_view.frame.bbox
    const zoom_level = this.model.tile_source.get_level_by_extent(this.initial_extent, height, width)
    const new_extent = this.model.tile_source.snap_to_zoom_level(this.initial_extent, height, width, zoom_level)
    const new_extent_inv = this._invert_projection(new_extent)
    this.x_range.start = new_extent_inv[0]
    this.y_range.start = new_extent_inv[1]
    this.x_range.end = new_extent_inv[2]
    this.y_range.end = new_extent_inv[3]
    if (this.x_range instanceof Range1d) {
      this.x_range.reset_start = new_extent_inv[0]
      this.x_range.reset_end = new_extent_inv[2]
    }
    if (this.y_range instanceof Range1d) {
      this.y_range.reset_start = new_extent_inv[1]
      this.y_range.reset_end = new_extent_inv[3]
    }
  }

  protected _create_tile(x: number, y: number, z: number, bounds: Bounds, cache_only: boolean = false): void {
    const quadkey = this.model.tile_source.tile_xyz_to_quadkey(x, y, z)
    const cache_key = this.model.tile_source.tile_xyz_to_key(x, y, z)

    if (this.model.tile_source.tiles.has(cache_key)) {
      return
    }

    const [nx, ny, nz] = this.model.tile_source.normalize_xyz(x, y, z)
    const src = this.model.tile_source.get_image_url(nx, ny, nz)

    const bounds_proj = extent_to_bounds(this._invert_projection(bounds_to_extent(bounds)))

    const tile: TileData = {
      img: undefined,
      tile_coords: [x, y, z],
      normalized_coords: [nx, ny, nz],
      quadkey,
      cache_key,
      bounds: bounds_proj,
      loaded: false,
      finished: false,
      x_coord: bounds_proj[0],
      y_coord: bounds_proj[3],
    }

    this.model.tile_source.tiles.set(cache_key, tile)
    if (this._tiles == null) {
      this._tiles = []
    }
    this._tiles.push(tile)

    new ImageLoader(src, {
      loaded: (img: Image) => {
        Object.assign(tile, {img, loaded: true})

        if (cache_only) {
          tile.finished = true
          this.notify_finished()
        } else {
          this.request_paint()
        }
      },
      failed() {
        tile.finished = true
      },
    })
  }

  protected _enforce_aspect_ratio(): void {
    // brute force way of handling resize or sizing_mode event -------------------------------------------------------------
    const {width, height} = this.plot_view.frame.bbox
    if (this._last_width !== width || this._last_height !== height) {
      const extent = this.get_extent()
      const zoom_level = this.model.tile_source.get_level_by_extent(extent, height, width)
      const {tile_source} = this.model
      const new_extent = (() => {
        const {_last_width, _last_height} = this
        if (_last_width !== undefined && _last_height !== undefined) {
          return tile_source.rescale(extent, height, width, _last_height, _last_width)
        }
        return tile_source.snap_to_zoom_level(extent, height, width, zoom_level)
      })()
      this.extent = new_extent
      const new_extent_inv = this._invert_projection(new_extent)
      this.x_range.setv({start: new_extent_inv[0], end: new_extent_inv[2]})
      this.y_range.setv({start: new_extent_inv[1], end: new_extent_inv[3]})
      this._last_width = width
      this._last_height = height
    }
  }

  override has_finished(): boolean {
    if (!super.has_finished()) {
      return false
    }

    if (this._tiles == null) {
      return false
    }

    for (const tile of this._tiles) {
      if (!tile.finished) {
        return false
      }
    }

    return true
  }

  protected _paint(ctx: Context2d): void {
    if (!this.map_initialized) {
      this._set_data()
      this._map_data()
      this.map_initialized = true
    }

    this._enforce_aspect_ratio()

    this._update(ctx)
    if (this.prefetch_timer != null) {
      clearTimeout(this.prefetch_timer)
    }

    this.prefetch_timer = setTimeout(this._prefetch_tiles.bind(this), 500)

    if (this.has_finished()) {
      this.notify_finished()
    }
  }

  _draw_tile(ctx: Context2d, tile_key: string): void {
    const tile_data = this.model.tile_source.tiles.get(tile_key) as TileData | undefined
    if (tile_data != null && tile_data.loaded) {
      const tile_extent = bounds_to_extent(tile_data.bounds)
      const [[sxmin], [symin]] = this.coordinates.map_to_screen([tile_extent[0]], [tile_extent[1]])
      const [[sxmax], [symax]] = this.coordinates.map_to_screen([tile_extent[2]], [tile_extent[3]])
      const sw = sxmax - sxmin
      const sh = symax - symin
      const sx = sxmin
      const sy = symin
      const old_smoothing = ctx.imageSmoothingEnabled
      ctx.imageSmoothingEnabled = this.model.smoothing
      ctx.drawImage(tile_data.img, sx, sy, sw, sh)
      ctx.imageSmoothingEnabled = old_smoothing
      tile_data.finished = true
    }
  }

  protected _set_rect(ctx: Context2d): void {
    const outline_width = this.plot_model.outline_line_width
    const l = this.plot_view.frame.bbox.left + (outline_width/2)
    const t = this.plot_view.frame.bbox.top + (outline_width/2)
    const w = this.plot_view.frame.bbox.width - outline_width
    const h = this.plot_view.frame.bbox.height - outline_width
    ctx.rect(l, t, w, h)
    ctx.clip()
  }

  protected _render_tiles(ctx: Context2d, tile_keys: string[]): void {
    ctx.save()
    this._set_rect(ctx)
    ctx.globalAlpha = this.model.alpha
    for (const tile_key of tile_keys) {
      this._draw_tile(ctx, tile_key)
    }
    ctx.restore()
  }

  protected _prefetch_tiles(): void {
    const {tile_source} = this.model
    const extent = this.get_extent()
    const w = this.plot_view.frame.bbox.width
    const h = this.plot_view.frame.bbox.height
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

  protected _update(ctx: Context2d): void {
    const {tile_source} = this.model

    const {min_zoom} = tile_source
    const {max_zoom} = tile_source

    let extent = this.get_extent()
    const zooming_out = (this.extent[2] - this.extent[0]) < (extent[2] - extent[0])
    const w = this.plot_view.frame.bbox.width
    const h = this.plot_view.frame.bbox.height
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

    const extent_inv = this._invert_projection(extent)

    if (snap_back) {
      this.x_range.setv({start: extent_inv[0], end: extent_inv[2]})
      this.y_range.setv({start: extent_inv[1], end: extent_inv[3]})
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

              if (tile_source.tiles.has(child_key)) {
                children.push(child_key)
              }
            }
          }
        }
      }

      if (tile == null) {
        need_load.push(t)
      }
    }

    // draw stand-in parents ----------
    this._render_tiles(ctx, parents)
    this._render_tiles(ctx, children)

    // draw cached ----------
    this._render_tiles(ctx, cached)

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
    data_coordinate_system: p.Property<string>
  }
}

export interface TileRenderer extends TileRenderer.Attrs {}

export class TileRenderer extends Renderer {
  declare properties: TileRenderer.Props
  declare __view_type__: TileRendererView

  constructor(attrs?: Partial<TileRenderer.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TileRendererView

    this.define<TileRenderer.Props>(({Bool, Float, Ref, Str}) => ({
      alpha:          [ Float, 1.0 ],
      smoothing:      [ Bool, true ],
      tile_source:    [ Ref(TileSource), () => new WMTSTileSource() ],
      render_parents: [ Bool, true ],
      data_coordinate_system: [ Str, "GOOGLE"],
    }))

    this.override<TileRenderer.Props>({
      level: "image",
    })
  }
}

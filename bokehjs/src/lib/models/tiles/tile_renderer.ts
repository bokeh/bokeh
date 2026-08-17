import type {Tile} from "./tile_source"
import type {Extent, Bounds} from "./tile_utils"
import {TileSource} from "./tile_source"
import {WMTSTileSource} from "./wmts_tile_source"
import {Renderer, RendererView} from "../renderers/renderer"
import type {Range} from "../ranges/range"
import {Range1d} from "../ranges/range1d"
import {DataRange1d} from "../ranges/data_range1d"
import {HTML} from "../dom/html"
import type * as p from "core/properties"
import type {Image} from "core/util/image"
import {ImageLoader} from "core/util/image"
import type {Context2d} from "core/util/canvas"
import {logger} from "core/logging"

export type TileData = Tile & ({img: Image, loaded: true} | {img: undefined, loaded: false}) & {
  quadkey: string
  cache_key: string
  bounds: Bounds
  /** Whether the image request settled, either by loading or by failing. */
  finished: boolean
  /** Number of image requests issued for this tile. */
  attempts: number
}

type Size = {width: number, height: number}

/** Number of times a tile that failed to load is requested again. */
const MAX_ATTEMPTS = 2

/** Number of tiles of the next zoom level fetched ahead of time. */
const MAX_PREFETCH = 40

const FETCH_DELAY = 65

const PREFETCH_DELAY = 500

/**
 * Whether `target` differs from `current` by more than rounding error. Extents
 * are compared with a tolerance so that constraining the ranges can't turn into
 * an endless sequence of repaints.
 */
function extent_changed(current: Extent, target: Extent): boolean {
  const tolerance = 1e-6*Math.max(target[2] - target[0], target[3] - target[1])
  return current.some((value, i) => Math.abs(value - target[i]) > tolerance)
}

export class TileRendererView extends RendererView {
  declare model: TileRenderer

  protected extent: Extent
  protected map_initialized: boolean = false

  /** Frame size, in CSS pixels, the extent was last adjusted to. */
  protected _last_size: Size | null = null

  /** Zoom level the last update drew, if any. */
  protected _last_level: number | null = null

  /** Whether at least one update completed, i.e. whether tiles are known. */
  protected _updated: boolean = false

  /** Tiles the last update asked for, not requested yet. */
  protected _to_fetch: [number, number, number, Bounds][] = []

  /** Keys of tiles with an image request in flight. */
  protected _loading: Set<string> = new Set()

  /**
   * Tiles with an image request in flight, held outside the bounded cache so
   * that they can't be evicted before they arrive, which would lose track of
   * the request and of how many attempts were already made.
   */
  protected _pending: Map<string, TileData> = new Map()

  /** Keys of the tiles the current extent needs, which are never evicted. */
  protected _current: Set<string> = new Set()

  protected _fetch_timer: number | null = null
  protected _prefetch_timer: number | null = null

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_paint())
    this.connect(this.model.tile_source.change, () => {
      // the source dropped its cache, so requests in flight belong to a tile
      // set that no longer applies; they can't be cancelled, but forgetting
      // them here keeps their images from repopulating the cache
      this._pending.clear()
      this._loading.clear()
      this.request_paint()
    })
  }

  override remove(): void {
    this._clear_timers()
    this._pending.clear()
    super.remove()
  }

  protected _clear_timers(): void {
    if (this._fetch_timer != null) {
      clearTimeout(this._fetch_timer)
      this._fetch_timer = null
    }
    if (this._prefetch_timer != null) {
      clearTimeout(this._prefetch_timer)
      this._prefetch_timer = null
    }
  }

  override force_finished(): void {
    super.force_finished()
    this._updated = true
    this._to_fetch = []
    this._loading.clear()
  }

  override has_finished(): boolean {
    if (!super.has_finished()) {
      return false
    }
    return this._updated && this._to_fetch.length == 0 && this._loading.size == 0
  }

  override get attribution(): HTML | string | null {
    return new HTML({html: [this.model.tile_source.attribution]})
  }

  private get x_range(): Range {
    return this.coordinates.x_source
  }

  private get y_range(): Range {
    return this.coordinates.y_source
  }

  get_extent(): Extent {
    const {x_range, y_range} = this
    const {start: x_start, end: x_end} = x_range
    const {start: y_start, end: y_end} = y_range

    // tile geometry is orientation agnostic; reversed ranges are dealt with when drawing
    return [
      Math.min(x_start, x_end), Math.min(y_start, y_end),
      Math.max(x_start, x_end), Math.max(y_start, y_end),
    ]
  }

  /**
   * Assigns an extent's interval to a range, preserving its orientation and
   * optionally making it the range's reset state.
   */
  private _set_range(range: Range, min: number, max: number, reset: boolean = false): void {
    const [start, end] = range.start <= range.end ? [min, max] : [max, min]
    range.setv({start, end})
    if (range instanceof DataRange1d) {
      // An auto-ranged range re-fits to the data bounds on every paint, which
      // would undo the constraint and leave the tiles distorted. Marking the
      // range as updated interactively, which is what pan and zoom tools do,
      // stops that at the cost of the range no longer following the data.
      // Tiles and auto-ranging are fundamentally incompatible, and a distorted
      // map is never what's wanted, so the constraint wins.
      range.have_updated_interactively = true
    }
    if (reset && range instanceof Range1d) {
      range.reset_start = start
      range.reset_end = end
    }
  }

  /**
   * The size of the frame in tile image pixels, which is the unit zoom levels
   * are expressed in. The display may have more device pixels than CSS pixels,
   * and a source may serve more image pixels than tile pixels ("@2x" tiles).
   */
  protected _tile_pixel_size(): Size {
    const {width, height} = this.plot_view.frame.bbox
    const {pixel_ratio} = this.model.tile_source
    const scale = this.canvas.pixel_ratio / (pixel_ratio > 0 ? pixel_ratio : 1)
    return {width: width*scale, height: height*scale}
  }

  protected _init_map({width, height}: Size): void {
    const {tile_source} = this.model
    const {x_range, y_range} = this

    const extent = tile_source.constrain_extent(this.get_extent(), height, width)

    if (extent.every(isFinite)) {
      this._set_range(x_range, extent[0], extent[2], true)
      this._set_range(y_range, extent[1], extent[3], true)
    } else {
      logger.warn(`${this}: tile extent is not fully defined, no tiles will be rendered`)
    }

    this.extent = extent
    this._last_size = {width, height}
  }

  /**
   * Adjusts the ranges so that both axes resolve to the same number of meters
   * per pixel, within the range of zoom levels the source provides. Without
   * this, anything that scales the axes independently (a box zoom, a single
   * dimension wheel zoom, an auto-ranged range) leaves the tiles distorted.
   */
  protected _enforce_extent({width, height}: Size): void {
    const {tile_source} = this.model
    const extent = this.get_extent()

    const rescaled = (() => {
      const {_last_size} = this
      // a resize preserves the current resolution, so that resizing the plot
      // reveals more of the map instead of zooming it
      if (_last_size != null && (_last_size.width != width || _last_size.height != height)) {
        return tile_source.rescale(extent, height, width, _last_size.height, _last_size.width)
      }
      return extent
    })()

    const target = tile_source.constrain_extent(rescaled, height, width)

    this._last_size = {width, height}
    this.extent = target

    if (extent_changed(extent, target)) {
      this._set_range(this.x_range, target[0], target[2])
      this._set_range(this.y_range, target[1], target[3])
    }
  }

  protected _paint(ctx: Context2d): void {
    const size = this.plot_view.frame.bbox
    // a collapsed frame (e.g. a plot in a hidden tab) can't be measured, and
    // recording its size would break the next resize
    if (!(size.width > 0) || !(size.height > 0)) {
      return
    }

    if (!this.map_initialized) {
      this._init_map(size)
      this.map_initialized = true
    } else {
      this._enforce_extent(size)
    }

    this._update(ctx)
    this._schedule_prefetch()

    if (this.has_finished()) {
      this.notify_finished()
    }
  }

  protected _update(ctx: Context2d): void {
    const {tile_source, render_parents} = this.model
    const {extent} = this
    const {width, height} = this._tile_pixel_size()

    const level = tile_source.get_closest_level_by_extent(extent, height, width)
    const zooming_out = this._last_level != null && level < this._last_level

    const cached: string[] = []
    const parents = new Set<string>()
    const children = new Set<string>()
    const current = new Set<string>()
    const loading = new Set<string>()
    const need_load: [number, number, number, Bounds][] = []

    for (const [x, y, z, bounds] of tile_source.get_tiles_by_extent(extent, level)) {
      const key = tile_source.tile_xyz_to_key(x, y, z)
      current.add(key)
      const tile = this._get_tile(key)

      if (tile != null && tile.loaded) {
        cached.push(tile.cache_key)
        continue
      }

      if (this._needs_load(tile)) {
        need_load.push([x, y, z, bounds])
      } else if (tile != null && !tile.finished) {
        loading.add(key)
      }

      if (render_parents) {
        const parent = tile_source.get_closest_parent_by_tile_xyz(x, y, z)
        if (parent != null) {
          const parent_key = tile_source.tile_xyz_to_key(...parent)
          if (this._is_loaded(parent_key)) {
            parents.add(parent_key)
          }
        }

        if (zooming_out) {
          for (const [cx, cy, cz] of tile_source.children_by_tile_xyz(x, y, z)) {
            const child_key = tile_source.tile_xyz_to_key(cx, cy, cz)
            if (this._is_loaded(child_key)) {
              children.add(child_key)
            }
          }
        }
      }
    }

    // stand-ins for tiles that haven't arrived yet are drawn first, so that the
    // tiles of the current level paint over them
    this._render_tiles(ctx, [...parents, ...children, ...cached])

    this._to_fetch = need_load
    this._current = current
    this._loading = loading
    this._last_level = level
    this._updated = true

    if (this._fetch_timer != null) {
      clearTimeout(this._fetch_timer)
      this._fetch_timer = null
    }
    if (need_load.length != 0) {
      this._fetch_timer = setTimeout(() => this._fetch_tiles(), FETCH_DELAY)
    }
  }

  protected _get_tile(key: string): TileData | undefined {
    return this._pending.get(key) ?? this.model.tile_source.get_tile(key) as TileData | undefined
  }

  protected _is_loaded(key: string): boolean {
    return this._get_tile(key)?.loaded ?? false
  }

  /**
   * Whether a tile has to be requested. Tiles that failed are retried, but only
   * a bounded number of times, so that a broken source isn't requested forever.
   */
  protected _needs_load(tile: TileData | undefined): boolean {
    if (tile == null) {
      return true
    }
    return !tile.loaded && tile.finished && tile.attempts < MAX_ATTEMPTS
  }

  protected _fetch_tiles(): void {
    this._fetch_timer = null
    const tiles = this._to_fetch
    this._to_fetch = []

    if (this.is_destroyed) {
      return
    }

    for (const [x, y, z, bounds] of tiles) {
      this._create_tile(x, y, z, bounds)
    }
  }

  protected _schedule_prefetch(): void {
    if (this._prefetch_timer != null) {
      clearTimeout(this._prefetch_timer)
    }
    this._prefetch_timer = setTimeout(() => this._prefetch_tiles(), PREFETCH_DELAY)
  }

  protected _prefetch_tiles(): void {
    this._prefetch_timer = null

    if (this.is_destroyed) {
      return
    }

    const {tile_source} = this.model
    const {extent} = this
    const {width, height} = this._tile_pixel_size()
    const level = tile_source.get_closest_level_by_extent(extent, height, width)

    let prefetched = 0
    for (const [x, y, z] of tile_source.get_tiles_by_extent(extent, level)) {
      for (const [cx, cy, cz, cbounds] of tile_source.children_by_tile_xyz(x, y, z)) {
        if (prefetched == MAX_PREFETCH) {
          return
        }
        const child_key = tile_source.tile_xyz_to_key(cx, cy, cz)
        if (!tile_source.has_tile(child_key) && !this._pending.has(child_key)) {
          this._create_tile(cx, cy, cz, cbounds, true)
          prefetched++
        }
      }
    }
  }

  protected _create_tile(x: number, y: number, z: number, bounds: Bounds, cache_only: boolean = false): void {
    const {tile_source} = this.model
    const cache_key = tile_source.tile_xyz_to_key(x, y, z)

    if (this._pending.has(cache_key)) {
      // already requested, possibly as a prefetch that is now on display
      if (!cache_only) {
        this._loading.add(cache_key)
      }
      return
    }

    const cached = this._get_tile(cache_key)
    if (!this._needs_load(cached)) {
      return
    }

    const tile: TileData = {
      img: undefined,
      tile_coords: [x, y, z],
      quadkey: tile_source.tile_xyz_to_quadkey(x, y, z),
      cache_key,
      bounds,
      loaded: false,
      finished: false,
      attempts: (cached?.attempts ?? 0) + 1,
    }
    tile_source.delete_tile(cache_key)
    this._pending.set(cache_key, tile)

    if (!cache_only) {
      this._loading.add(cache_key)
    }

    const settled = () => {
      if (this._pending.get(cache_key) !== tile) {
        // superseded, e.g. because the source changed while loading
        return
      }
      tile.finished = true
      this._pending.delete(cache_key)
      tile_source.set_tile(cache_key, tile, this._current)

      const was_loading = this._loading.delete(cache_key)
      if (!this.is_destroyed && (was_loading || !cache_only)) {
        // the paint reports completion, and draws the tile if it loaded
        this.request_paint()
      }
    }

    const [nx, ny, nz] = tile_source.normalize_xyz(x, y, z)
    new ImageLoader(tile_source.get_image_url(nx, ny, nz), {
      loaded: (img: Image) => {
        Object.assign(tile, {img, loaded: true})
        settled()
      },
      failed: settled,
    })
  }

  protected _render_tiles(ctx: Context2d, tile_keys: Iterable<string>): void {
    ctx.save()
    this._set_rect(ctx)
    ctx.globalAlpha = this.model.alpha
    for (const tile_key of tile_keys) {
      this._draw_tile(ctx, tile_key)
    }
    ctx.restore()
  }

  protected _draw_tile(ctx: Context2d, tile_key: string): void {
    const tile = this._get_tile(tile_key)
    if (tile == null || !tile.loaded) {
      return
    }

    const {bounds} = tile
    const [[sx_min], [sy_min]] = this.coordinates.map_to_screen([bounds[0]], [bounds[3]])
    const [[sx_max], [sy_max]] = this.coordinates.map_to_screen([bounds[2]], [bounds[1]])

    // rounding to whole device pixels keeps seams from showing between tiles
    const {pixel_ratio} = ctx.layer
    const snap = (value: number) => Math.round(value*pixel_ratio)/pixel_ratio

    const sx = snap(sx_min)
    const sy = snap(sy_min)
    const sw = snap(sx_max) - sx
    const sh = snap(sy_max) - sy

    if (!isFinite(sw) || !isFinite(sh) || sw == 0 || sh == 0) {
      return
    }

    const old_smoothing = ctx.imageSmoothingEnabled
    ctx.imageSmoothingEnabled = this.model.smoothing

    if (sw > 0 && sh > 0) {
      ctx.drawImage(tile.img, sx, sy, sw, sh)
    } else {
      // a reversed range mirrors the image, which drawImage() can't express
      ctx.save()
      ctx.translate(sx, sy)
      ctx.scale(Math.sign(sw), Math.sign(sh))
      ctx.drawImage(tile.img, 0, 0, Math.abs(sw), Math.abs(sh))
      ctx.restore()
    }

    ctx.imageSmoothingEnabled = old_smoothing
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
  declare properties: TileRenderer.Props
  declare __view_type__: TileRendererView

  constructor(attrs?: Partial<TileRenderer.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TileRendererView

    this.define<TileRenderer.Props>(({Bool, Float, Ref}) => ({
      alpha:          [ Float, 1.0 ],
      smoothing:      [ Bool, true ],
      tile_source:    [ Ref(TileSource), () => new WMTSTileSource() ],
      render_parents: [ Bool, true ],
    }))

    this.override<TileRenderer.Props>({
      level: "image",
    })
  }
}

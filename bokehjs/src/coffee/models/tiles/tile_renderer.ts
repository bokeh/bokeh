/* XXX: partial */
import {Tile} from "./tile_source"
import {ImagePool} from "./image_pool";
import {WMTSTileSource} from "./wmts_tile_source";
import {Renderer, RendererView} from "../renderers/renderer";
import {div} from "core/dom";
import * as p from "core/properties";
import {includes} from "core/util/array";
import {isString} from "core/util/types"

export class TileRendererView extends RendererView {

  initialize(options: any): void {
    this.attributionEl = null;
    this._tiles = [];
    super.initialize(options);
  }

  connect_signals(): void {
    super.connect_signals();
    this.connect(this.model.change, () => this.request_render())
  }

  get_extent() {
    return [this.x_range.start, this.y_range.start, this.x_range.end, this.y_range.end];
  }

  _set_data() {
    this.pool = new ImagePool();
    this.map_plot = this.plot_model.plot;
    this.map_canvas = this.plot_view.canvas_view.ctx;
    this.map_frame = this.plot_model.frame;
    this.x_range = this.map_plot.x_range;
    this.y_range = this.map_plot.y_range;
    this.extent = this.get_extent();
    this._last_height = undefined;
    return this._last_width = undefined;
  }

  _add_attribution() {
    const { attribution } = this.model.tile_source;

    if (isString(attribution) && (attribution.length > 0)) {
      if ((this.attributionEl == null)) {
        const right = this.plot_model.canvas._right.value - this.plot_model.frame._right.value;
        const bottom = this.plot_model.canvas._bottom.value - this.plot_model.frame._bottom.value;
        const max_width = this.map_frame._width.value;
        this.attributionEl = div({
          class: 'bk-tile-attribution',
          style: {
            position: "absolute",
            bottom: `${bottom}px`,
            right: `${right}px`,
            'max-width': `${max_width}px`,
            padding: "2px",
            'background-color': 'rgba(255,255,255,0.8)',
            'font-size': '9pt',
            'font-family': 'sans-serif'
          }
        });

        const overlays = this.plot_view.canvas_view.events_el;
        overlays.appendChild(this.attributionEl);
      }

      return this.attributionEl.innerHTML = attribution;
    }
  }

  _map_data() {
    this.initial_extent = this.get_extent();
    const zoom_level = this.model.tile_source.get_level_by_extent(this.initial_extent, this.map_frame._height.value, this.map_frame._width.value);
    const new_extent = this.model.tile_source.snap_to_zoom_level(this.initial_extent, this.map_frame._height.value, this.map_frame._width.value, zoom_level);
    this.x_range.start = new_extent[0];
    this.y_range.start = new_extent[1];
    this.x_range.end = new_extent[2];
    this.y_range.end = new_extent[3];
    return this._add_attribution();
  }

  _on_tile_load(e) {
    const { tile_data } = e.target;
    tile_data.img = e.target;
    tile_data.current = true;
    tile_data.loaded = true;
    return this.request_render();
  }

  _on_tile_cache_load(e) {
    const { tile_data } = e.target;
    tile_data.img = e.target;
    tile_data.loaded = true;
    tile_data.finished = true;
    return this.notify_finished();
  }

  _on_tile_error(e) {
    const { tile_data } = e.target;
    return tile_data.finished = true;
  }

  _create_tile(x, y, z, bounds, cache_only = false) {
    const normalized_coords = this.model.tile_source.normalize_xyz(x, y, z);
    const tile = this.pool.pop();

    if (cache_only) {
      tile.onload = this._on_tile_cache_load.bind(this);
    } else {
      tile.onload = this._on_tile_load.bind(this);
    }

    tile.onerror = this._on_tile_error.bind(this);
    tile.alt = '';

    tile.tile_data = {
      tile_coords : [x, y, z],
      normalized_coords,
      quadkey : this.model.tile_source.tile_xyz_to_quadkey(x, y, z),
      cache_key : this.model.tile_source.tile_xyz_to_key(x, y, z),
      bounds,
      loaded : false,
      finished : false,
      x_coord : bounds[0],
      y_coord : bounds[3]
    };

    this.model.tile_source.tiles[tile.tile_data.cache_key] = tile.tile_data;
    tile.src = this.model.tile_source.get_image_url(...normalized_coords || []);

    this._tiles.push(tile);
    return tile;
  }

  _enforce_aspect_ratio() {
    // brute force way of handling resize or sizing_mode event -------------------------------------------------------------
    if ((this._last_height !== this.map_frame._height.value) || (this._last_width !== this.map_frame._width.value)) {
      const extent = this.get_extent();
      const zoom_level = this.model.tile_source.get_level_by_extent(extent, this.map_frame._height.value, this.map_frame._width.value);
      const new_extent = this.model.tile_source.snap_to_zoom_level(extent, this.map_frame._height.value, this.map_frame._width.value, zoom_level);
      this.x_range.setv({start:new_extent[0], end: new_extent[2]});
      this.y_range.setv({start:new_extent[1], end: new_extent[3]});
      this.extent = new_extent;
      this._last_height = this.map_frame._height.value;
      this._last_width = this.map_frame._width.value;
      return true;
    }
    return false;
  }

  has_finished() {
    if (!super.has_finished()) {
      return false;
    }

    if (this._tiles.length === 0) {
      return false;
    }

    for (const tile of this._tiles) {
      if (!tile.tile_data.finished) {
        return false;
      }
    }

    return true;
  }

  render() {
    if ((this.map_initialized == null)) {
      this._set_data();
      this._map_data();
      this.map_initialized = true;
    }

    if (this._enforce_aspect_ratio()) {
      return;
    }

    this._update();
    if (this.prefetch_timer != null) {
      clearTimeout(this.prefetch_timer);
    }

    this.prefetch_timer = setTimeout(this._prefetch_tiles.bind(this), 500);

    if (this.has_finished()) {
      return this.notify_finished();
    }
  }

  _draw_tile(tile_key) {
    const tile_obj = this.model.tile_source.tiles[tile_key];
    if (tile_obj != null) {
      let [sxmin, symin] = this.plot_view.map_to_screen([tile_obj.bounds[0]], [tile_obj.bounds[3]]);
      let [sxmax, symax] = this.plot_view.map_to_screen([tile_obj.bounds[2]], [tile_obj.bounds[1]]);
      sxmin = sxmin[0];
      symin = symin[0];
      sxmax = sxmax[0];
      symax = symax[0];
      const sw = sxmax - sxmin;
      const sh = symax - symin;
      const sx = sxmin;
      const sy = symin;
      return this.map_canvas.drawImage(tile_obj.img, sx, sy, sw, sh);
    }
  }

  _set_rect() {
    const outline_width = this.plot_model.plot.properties.outline_line_width.value();
    const l = this.map_frame._left.value + (outline_width/2);
    const t = this.map_frame._top.value + (outline_width/2);
    const w = this.map_frame._width.value - outline_width;
    const h = this.map_frame._height.value - outline_width;
    this.map_canvas.rect(l, t, w, h);
    return this.map_canvas.clip();
  }

  _render_tiles(tile_keys) {
    this.map_canvas.save();
    this._set_rect();
    this.map_canvas.globalAlpha = this.model.alpha;
    for (const tile_key of tile_keys) {
      this._draw_tile(tile_key);
    }
    return this.map_canvas.restore();
  }

  _prefetch_tiles() {
    const { tile_source } = this.model;
    const extent = this.get_extent();
    const h = this.map_frame._height.value;
    const w = this.map_frame._width.value;
    const zoom_level = this.model.tile_source.get_level_by_extent(extent, h, w);
    const tiles = this.model.tile_source.get_tiles_by_extent(extent, zoom_level);
    for (let t = 0, end = Math.min(10, tiles.length); t <= end; t++) {
      const [x, y, z,] = t;
      const children = this.model.tile_source.children_by_tile_xyz(x, y, z);
      for (const c of children) {
        const [cx, cy, cz, cbounds] = c;
        if (tile_source.tile_xyz_to_key(cx, cy, cz) in tile_source.tiles) {
          continue;
        } else {
          this._create_tile(cx, cy, cz, cbounds, true);
        }
      }
    }
  }

  _fetch_tiles(tiles) {
    for (const t of tiles) {
      const [x, y, z, bounds] = t;
      this._create_tile(x, y, z, bounds);
    }
  }

  _update() {
    const { tile_source } = this.model;

    const { min_zoom } = tile_source;
    const { max_zoom } = tile_source;

    tile_source.update();
    let extent = this.get_extent();
    const zooming_out = (this.extent[2] - this.extent[0]) < (extent[2] - extent[0]);
    const h = this.map_frame._height.value;
    const w = this.map_frame._width.value;
    let zoom_level = tile_source.get_level_by_extent(extent, h, w);
    let snap_back = false;

    if (zoom_level < min_zoom) {
      ({ extent } = this);
      zoom_level = min_zoom;
      snap_back = true;

    } else if (zoom_level > max_zoom) {
      ({ extent } = this);
      zoom_level = max_zoom;
      snap_back = true;
    }

    if (snap_back) {
      this.x_range.setv({x_range: {start: extent[0], end: extent[2]}});
      this.y_range.setv({start: extent[1], end: extent[3]});
      this.extent = extent;
    }

    this.extent = extent;
    const tiles = tile_source.get_tiles_by_extent(extent, zoom_level);
    const parents = [];
    const need_load: Tile[] = [];
    const cached = [];
    let children = [];

    for (const t of tiles) {
      const [x, y, z,] = t;
      const key = tile_source.tile_xyz_to_key(x, y, z);
      const tile = tile_source.tiles[key];
      if ((tile != null) && (tile.loaded === true)) {
        cached.push(key);
      } else {
        if (this.model.render_parents) {
          const [px, py, pz] = tile_source.get_closest_parent_by_tile_xyz(x, y, z);
          const parent_key = tile_source.tile_xyz_to_key(px, py, pz);
          const parent_tile = tile_source.tiles[parent_key];
          if ((parent_tile != null) && parent_tile.loaded && !includes(parents, parent_key)) {
            parents.push(parent_key);
          }
          if (zooming_out) {
            children = tile_source.children_by_tile_xyz(x, y, z);
            for (const c of children) {
              const [cx, cy, cz,] = c;
              const child_key = tile_source.tile_xyz_to_key(cx, cy, cz);

              if (child_key in tile_source.tiles) {
                children.push(child_key);
              }
            }
          }
        }
      }

      if (tile == null) {
        need_load.push(t);
      }
    }

    // draw stand-in parents ----------
    this._render_tiles(parents);
    this._render_tiles(children);

    // draw cached ----------
    this._render_tiles(cached);
    for (const t of cached) {
      tile_source.tiles[t].current = true;
    }

    // fetch missing -------
    if (this.render_timer != null) {
      clearTimeout(this.render_timer);
    }

    return this.render_timer = setTimeout((() => this._fetch_tiles(need_load)), 65);
  }
}

export class TileRenderer extends Renderer {
  static initClass() {
    this.prototype.default_view = TileRendererView;
    this.prototype.type = 'TileRenderer';

    this.define({
        alpha:          [ p.Number,   1.0              ],
        x_range_name:   [ p.String,   "default"        ],
        y_range_name:   [ p.String,   "default"        ],
        tile_source:    [ p.Instance, () => new WMTSTileSource() ],
        render_parents: [ p.Bool,     true             ]
      });

    this.override({
      level: 'underlay'
    });
  }
}
TileRenderer.initClass();

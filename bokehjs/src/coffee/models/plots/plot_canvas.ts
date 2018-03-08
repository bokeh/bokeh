/* XXX: partial */
import {Canvas, CanvasView} from "../canvas/canvas";
import {CartesianFrame} from "../canvas/cartesian_frame";
import {DataRange1d} from "../ranges/data_range1d";
import {RendererView} from "../renderers/renderer";
import {GlyphRenderer} from "../renderers/glyph_renderer";
import {LayoutDOM} from "../layouts/layout_dom";
import {Toolbar} from "../tools/toolbar";
import {Plot} from "./plot";

import {Arrayable} from "core/types"
import {Signal0} from "core/signaling";
import {build_views, remove_views} from "core/build_views";
import {UIEvents} from "core/ui_events";
import {Visuals} from "core/visuals";
import {DOMView} from "core/dom_view";
import {LayoutCanvas} from "core/layout/layout_canvas";
import {hstack, vstack} from "core/layout/alignments";
import {EQ, LE, GE, Constraint} from "core/layout/solver";
import {logger} from "core/logging";
import * as enums from "core/enums";
import * as p from "core/properties";
import {throttle} from "core/util/throttle";
import {isStrictNaN} from "core/util/types";
import {difference, sortBy, reversed, includes} from "core/util/array";
import {extend, values} from "core/util/object";
import {update_panel_constraints, _view_sizes} from "core/layout/side_panel"
import {Context2d} from "core/util/canvas"

// Notes on WebGL support:
// Glyps can be rendered into the original 2D canvas, or in a (hidden)
// webgl canvas that we create below. In this way, the rest of bokehjs
// can keep working as it is, and we can incrementally update glyphs to
// make them use GL.
//
// When the author or user wants to, we try to create a webgl canvas,
// which is saved on the ctx object that gets passed around during drawing.
// The presence (and not-being-false) of the ctx.glcanvas attribute is the
// marker that we use throughout that determines whether we have gl support.

let global_glcanvas: HTMLCanvasElement | null = null

export type FrameBox = [number, number, number, number]

export class PlotCanvasView extends DOMView {
  model: PlotCanvas

  frame: CartesianFrame

  canvas: Canvas
  canvas_view: CanvasView

  force_paint: Signal0<this>
  state_changed: Signal0<this>

  renderer_views: {[key: string]: RendererView}

  state: {history: any[], index: number}

  css_classes(): string[] {
    return super.css_classes().concat("bk-plot-wrapper")
  }

  get canvas_overlays(): HTMLElement {
    return this.canvas_view.overlays_el
  }

  get canvas_events(): HTMLElement {
    return this.canvas_view.events_el
  }

  get is_paused(): boolean {
    return this._is_paused != null && this._is_paused !== 0
  }

  view_options() { return extend({plot_view: this, parent: this}, this.options); }

  pause() {
    if ((this._is_paused == null)) {
      return this._is_paused = 1;
    } else {
      return this._is_paused += 1;
    }
  }

  unpause(no_render = false) {
    this._is_paused -= 1;
    if ((this._is_paused === 0) && !no_render) {
      return this.request_render();
    }
  }

  request_render() {
    return this.request_paint();
  }

  request_paint() {
    if (!this.is_paused) {
      this.throttled_paint();
    }
  }

  remove() {
    remove_views(this.renderer_views);
    remove_views(this.tool_views);

    this.canvas_view.remove();
    this.canvas_view = null;

    return super.remove();
  }

  initialize(options: any): void {
    this.pause();

    super.initialize(options);

    this.force_paint = new Signal0(this, "force_paint");
    this.state_changed = new Signal0(this, "state_changed");

    this.lod_started = false;
    this.visuals = new Visuals(this.model.plot);

    this._initial_state_info = {
      range: null,                     // set later by set_initial_range()
      selection: {},                   // XXX: initial selection?
      dimensions: {
        width: this.model.canvas._width.value,
        height: this.model.canvas._height.value,
      },
    };

    this.state = {history: [], index: -1}

    // compat, to be removed
    this.frame = this.model.frame;

    this.canvas = this.model.canvas;
    this.canvas_view = new this.canvas.default_view({model: this.canvas, parent: this});
    this.el.appendChild(this.canvas_view.el);
    this.canvas_view.render();

    // If requested, try enabling webgl
    if (this.model.plot.output_backend === "webgl") {
      this.init_webgl();
    }

    this.throttled_paint = throttle((() => this.force_paint.emit()), 15); // TODO (bev) configurable

    this.ui_event_bus = new UIEvents(this, this.model.toolbar, this.canvas_view.el, this.model.plot);

    this.levels = {};
    for (const level of enums.RenderLevel) {
      this.levels[level] = {};
    }

    this.renderer_views = {};
    this.tool_views = {};

    this.build_levels();
    this.build_tools();

    this.update_dataranges();

    this.unpause(true);
    logger.debug("PlotView initialized");
  }

  set_cursor(cursor = "default") {
    return this.canvas_view.el.style.cursor = cursor;
  }

  init_webgl() {
    const { ctx } = this.canvas_view;

    // We use a global invisible canvas and gl context. By having a global context,
    // we avoid the limitation of max 16 contexts that most browsers have.
    let glcanvas = global_glcanvas;
    if (glcanvas == null) {
      global_glcanvas = glcanvas = document.createElement('canvas');
      const opts = {'premultipliedAlpha': true};  // premultipliedAlpha is true by default
      glcanvas.gl = glcanvas.getContext("webgl", opts) || glcanvas.getContext("experimental-webgl", opts);
    }

    // If WebGL is available, we store a reference to the gl canvas on
    // the ctx object, because that's what gets passed everywhere.
    if (glcanvas.gl != null) {
      return ctx.glcanvas = glcanvas;
    } else {
      return logger.warn('WebGL is not supported, falling back to 2D canvas.');
    }
  }

  prepare_webgl(ratio: number, frame_box: FrameBox): void {
    // Prepare WebGL for a drawing pass
    const { ctx } = this.canvas_view;
    const canvas = this.canvas_view.get_canvas_element();
    if (ctx.glcanvas) {
      // Sync canvas size
      ctx.glcanvas.width = canvas.width;
      ctx.glcanvas.height = canvas.height;
      // Prepare GL for drawing
      const { gl } = ctx.glcanvas;
      gl.viewport(0, 0, ctx.glcanvas.width, ctx.glcanvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);
      // Clipping
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(ratio*frame_box[0], ratio*frame_box[1], ratio*frame_box[2], ratio*frame_box[3]);
      // Setup blending
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA, gl.ONE);  // premultipliedAlpha == true
    }
  }
      //gl.blendFuncSeparate(gl.ONE_MINUS_DST_ALPHA, gl.DST_ALPHA, gl.ONE_MINUS_DST_ALPHA, gl.ONE)  # Without premultipliedAlpha == false

  blit_webgl(ratio) {
    // This should be called when the ctx has no state except the HIDPI transform
    const { ctx } = this.canvas_view;
    if (ctx.glcanvas) {
      // Blit gl canvas into the 2D canvas. To do 1-on-1 blitting, we need
      // to remove the hidpi transform, then blit, then restore.
      // ctx.globalCompositeOperation = "source-over"  -> OK; is the default
      logger.debug('drawing with WebGL');
      ctx.restore();
      ctx.drawImage(ctx.glcanvas, 0, 0);
      // Set back hidpi transform
      ctx.save();
      ctx.scale(ratio, ratio);
      return ctx.translate(0.5, 0.5);
    }
  }

  update_dataranges() {
    // Update any DataRange1ds here
    let bounds_to_use;
    const { frame } = this.model;
    const bounds = {};
    const log_bounds = {};

    let calculate_log_bounds = false;
    for (const r of values(frame.x_ranges).concat(values(frame.y_ranges))) {
      if (r instanceof DataRange1d) {
        if (r.scale_hint === "log") {
          calculate_log_bounds = true;
        }
      }
    }

    for (const k in this.renderer_views) {
      const v = this.renderer_views[k];
      const bds = __guardMethod__(v.glyph, 'bounds', o => o.bounds());
      if (bds != null) {
        bounds[k] = bds;
      }
      if (calculate_log_bounds) {
        const log_bds = __guardMethod__(v.glyph, 'log_bounds', o1 => o1.log_bounds());
        if (log_bds != null) {
          log_bounds[k] = log_bds;
        }
      }
    }

    let follow_enabled = false;
    let has_bounds = false;

    let r: number | null = null
    if ((this.model.plot.match_aspect !== false) && (this.frame._width.value !== 0) && (this.frame._height.value !== 0)) {
      r = (1/this.model.plot.aspect_scale)*(this.frame._width.value/this.frame._height.value);
    }

    for (const xr of values(frame.x_ranges)) {
      if (xr instanceof DataRange1d) {
        bounds_to_use = xr.scale_hint === "log" ? log_bounds : bounds;
        xr.update(bounds_to_use, 0, this.model.id, r);
        if (xr.follow) {
          follow_enabled = true;
        }
      }
      if (xr.bounds != null) { has_bounds = true; }
    }

    for (const yr of values(frame.y_ranges)) {
      if (yr instanceof DataRange1d) {
        bounds_to_use = yr.scale_hint === "log" ? log_bounds : bounds;
        yr.update(bounds_to_use, 1, this.model.id, r);
        if (yr.follow) {
          follow_enabled = true;
        }
      }
      if (yr.bounds != null) { has_bounds = true; }
    }

    if (follow_enabled && has_bounds) {
      logger.warn('Follow enabled so bounds are unset.');
      for (const xr of values(frame.x_ranges)) {
        xr.bounds = null;
      }
      for (const yr of values(frame.y_ranges)) {
        yr.bounds = null;
      }
    }

    return this.range_update_timestamp = Date.now();
  }

  map_to_screen(x: Arrayable<number>, y: Arrayable<number>,
                x_name: string = "default", y_name: string = "default"): [Arrayable<number>, Arrayable<number>] {
    return this.frame.map_to_screen(x, y, x_name, y_name);
  }

  push_state(type, info) {
    const prev_info = (this.state.history[this.state.index] != null ? this.state.history[this.state.index].info : undefined) || {};
    info = extend({}, this._initial_state_info, prev_info, info);

    this.state.history.slice(0, this.state.index + 1);
    this.state.history.push({type, info});
    this.state.index = this.state.history.length - 1;

    return this.state_changed.emit();
  }

  clear_state() {
    this.state = {history: [], index: -1};
    return this.state_changed.emit();
  }

  can_undo() {
    return this.state.index >= 0;
  }

  can_redo() {
    return this.state.index < (this.state.history.length - 1);
  }

  undo() {
    if (this.can_undo()) {
      this.state.index -= 1;
      this._do_state_change(this.state.index);
      return this.state_changed.emit();
    }
  }

  redo() {
    if (this.can_redo()) {
      this.state.index += 1;
      this._do_state_change(this.state.index);
      return this.state_changed.emit();
    }
  }

  _do_state_change(index) {
    const info = (this.state.history[index] != null ? this.state.history[index].info : undefined) || this._initial_state_info;

    if (info.range != null) {
      this.update_range(info.range);
    }

    if (info.selection != null) {
      return this.update_selection(info.selection);
    }
  }

  get_selection() {
    const selection = {};
    for (const renderer of this.model.plot.renderers) {
      if (renderer instanceof GlyphRenderer) {
        const { selected } = renderer.data_source;
        selection[renderer.id] = selected;
      }
    }
    return selection;
  }

  update_selection(selection) {
    for (const renderer of this.model.plot.renderers) {
      if (!(renderer instanceof GlyphRenderer)) {
        continue;
      }
      const ds = renderer.data_source;
      if (selection != null) {
        if (includes(selection, renderer.id)) {
          ds.selected = selection[renderer.id];
        }
      } else {
        ds.selection_manager.clear();
      }
    }
  }

  reset_selection() {
    return this.update_selection(null);
  }

  _update_ranges_together(range_info_iter) {
    // Get weight needed to scale the diff of the range to honor interval limits
    let weight = 1.0;
    for (const [rng, range_info] of range_info_iter) {
      weight = Math.min(weight, this._get_weight_to_constrain_interval(rng, range_info));
    }
    // Apply shared weight to all ranges
    if (weight < 1) {
      for (const [rng, range_info] of range_info_iter) {
        range_info['start'] = (weight * range_info['start']) + ((1-weight) * rng.start);
        range_info['end'] = (weight * range_info['end']) + ((1-weight) * rng.end);
      }
    }
  }

  _update_ranges_individually(range_info_iter, is_panning, is_scrolling) {
    let hit_bound = false;
    for (const [rng, range_info] of range_info_iter) {
      // Is this a reversed range?
      const is_reversed = (rng.start > rng.end);

      // Limit range interval first. Note that for scroll events,
      // the interval has already been limited for all ranges simultaneously
      if (!is_scrolling) {
        const weight = this._get_weight_to_constrain_interval(rng, range_info);
        if (weight < 1) {
            range_info['start'] = (weight * range_info['start']) + ((1-weight) * rng.start);
            range_info['end'] = (weight * range_info['end']) + ((1-weight) * rng.end);
          }
      }

      // Prevent range from going outside limits
      // Also ensure that range keeps the same delta when panning/scrolling
      if (rng.bounds != null) {
        const min = rng.bounds[0];
        const max = rng.bounds[1];
        const new_interval = Math.abs(range_info['end'] - range_info['start']);

        if (is_reversed) {
          if (min != null) {
            if (min >= range_info['end']) {
              hit_bound = true;
              range_info['end'] = min;
              if (is_panning || is_scrolling) {
                range_info['start'] = min + new_interval;
              }
            }
          }
          if (max != null) {
            if (max <= range_info['start']) {
              hit_bound = true;
              range_info['start'] = max;
              if (is_panning || is_scrolling) {
                range_info['end'] = max - new_interval;
              }
            }
          }
        } else {
          if (min != null) {
            if (min >= range_info['start']) {
              hit_bound = true;
              range_info['start'] = min;
              if (is_panning || is_scrolling) {
                range_info['end'] = min + new_interval;
              }
            }
          }
          if (max != null) {
            if (max <= range_info['end']) {
              hit_bound = true;
              range_info['end'] = max;
              if (is_panning || is_scrolling) {
                range_info['start'] = max - new_interval;
              }
            }
          }
        }
      }
    }

    // Cancel the event when hitting a bound while scrolling. This ensures that
    // the scroll-zoom tool maintains its focus position. Disabling the next
    // two lines would result in a more "gliding" behavior, allowing one to
    // zoom out more smoothly, at the cost of losing the focus position.
    if (is_scrolling && hit_bound) {
      return;
    }

    for (const [rng, range_info] of range_info_iter) {
      rng.have_updated_interactively = true;
      if ((rng.start !== range_info['start']) || (rng.end !== range_info['end'])) {
        rng.setv(range_info);
      }
    }
  }

  _get_weight_to_constrain_interval(rng, range_info) {
      // Get the weight by which a range-update can be applied
      // to still honor the interval limits (including the implicit
      // max interval imposed by the bounds)
      let max, min;
      const { min_interval } = rng;
      let { max_interval } = rng;
      let weight = 1.0;

      // Express bounds as a max_interval. By doing this, the application of
      // bounds and interval limits can be applied independent from each-other.
      if (rng.bounds != null) {
        [min, max] = rng.bounds;
        if ((min != null) && (max != null)) {
          const max_interval2 = Math.abs(max - min);
          max_interval = (max_interval != null) ? Math.min(max_interval, max_interval2) : max_interval2;
        }
      }

      if ((min_interval != null) || (max_interval != null)) {
        const old_interval = Math.abs(rng.end - rng.start);
        const new_interval = Math.abs(range_info['end'] - range_info['start']);
        if ((min_interval > 0) && (new_interval < min_interval)) {
            weight = (old_interval - min_interval) / (old_interval - new_interval);
          }
        if ((max_interval > 0) && (new_interval > max_interval)) {
            weight = (max_interval - old_interval) / (new_interval - old_interval);
          }
        weight = Math.max(0.0, Math.min(1.0, weight));
      }
      return weight;
    }

  update_range(range_info, is_panning: boolean = false, is_scrolling: boolean = false): void {
    this.pause();
    if ((range_info == null)) {
      for (const name in this.frame.x_ranges) {
        const rng = this.frame.x_ranges[name];
        rng.reset();
      }
      for (const name in this.frame.y_ranges) {
        const rng = this.frame.y_ranges[name];
        rng.reset();
      }
      this.update_dataranges();
    } else {
      const range_info_iter = [];
      for (const name in this.frame.x_ranges) {
        const rng = this.frame.x_ranges[name];
        range_info_iter.push([rng, range_info.xrs[name]]);
      }
      for (const name in this.frame.y_ranges) {
        const rng = this.frame.y_ranges[name];
        range_info_iter.push([rng, range_info.yrs[name]]);
      }
      if (is_scrolling) {
        this._update_ranges_together(range_info_iter);  // apply interval bounds while keeping aspect
      }
      this._update_ranges_individually(range_info_iter, is_panning, is_scrolling);
    }
    this.unpause();
  }

  reset_range(): void {
    this.update_range(null)
  }

  build_levels(): void {
    const renderer_models = this.model.plot.all_renderers;

    // should only bind events on NEW views
    const old_renderers = Object.keys(this.renderer_views)
    const new_renderer_views = build_views(this.renderer_views, renderer_models, this.view_options())
    const renderers_to_remove = difference(old_renderers, renderer_models.map((model) => model.id))

    for (const id_ of renderers_to_remove) {
      delete this.levels.glyph[id_];
    }

    for (const view of new_renderer_views) {
      this.levels[view.model.level][view.model.id] = view;
    }

    for (const view of new_renderer_views)
      this.levels[view.model.level][view.model.id] = view
  }

  get_renderer_views() {
    return (this.model.plot.renderers.map((r) => this.levels[r.level][r.id]));
  }

  build_tools(): void {
    const tool_models = this.model.plot.toolbar.tools;
    const new_tool_views = build_views(this.tool_views, tool_models, this.view_options());

    new_tool_views.map((tool_view) => this.ui_event_bus.register_tool(tool_view))
  }

  connect_signals(): void {
    super.connect_signals();

    this.connect(this.force_paint, () => this.repaint());

    const {x_ranges, y_ranges} = this.model.frame

    for (const name in x_ranges) {
      const rng = x_ranges[name];
      this.connect(rng.change, () => this.request_render())
    }
    for (const name in y_ranges) {
      const rng = y_ranges[name];
      this.connect(rng.change, () => this.request_render())
    }

    this.connect(this.model.plot.properties.renderers.change, () => this.build_levels())
    this.connect(this.model.plot.toolbar.properties.tools.change, () => { this.build_levels(); this.build_tools() })
    this.connect(this.model.plot.change, () => this.request_render())
  }

  set_initial_range() {
    // check for good values for ranges before setting initial range
    let good_vals = true;
    const xrs = {};
    const yrs = {};
    for (const name in this.frame.x_ranges) {
      const rng = this.frame.x_ranges[name];
      if ((rng.start == null) || (rng.end == null) || isStrictNaN(rng.start + rng.end)) {
        good_vals = false;
        break;
      }
      xrs[name] = { start: rng.start, end: rng.end };
    }
    if (good_vals) {
      for (const name in this.frame.y_ranges) {
        const rng = this.frame.y_ranges[name];
        if ((rng.start == null) || (rng.end == null) || isStrictNaN(rng.start + rng.end)) {
          good_vals = false;
          break;
        }
        yrs[name] = { start: rng.start, end: rng.end };
      }
    }
    if (good_vals) {
      this._initial_state_info.range = this.initial_range_info = {xrs, yrs};
      return logger.debug("initial ranges set");
    } else {
      return logger.warn('could not set initial ranges');
    }
  }

  update_constraints() {
    this.solver.suggest_value(this.frame._width, this.canvas._width.value);
    this.solver.suggest_value(this.frame._height, this.canvas._height.value);

    for (const _ in this.renderer_views) {
      const view = this.renderer_views[_];
      if (view.model.panel != null) {
        update_panel_constraints(view);
      }
    }

    return this.solver.update_variables();
  }

  // XXX: bacause PlotCanvas is NOT a LayoutDOM
  _layout(final = false) {
    this.render();

    if (final) {
      this.model.plot.setv({
        inner_width: Math.round(this.frame._width.value),
        inner_height: Math.round(this.frame._height.value),
        layout_width: Math.round(this.canvas._width.value),
        layout_height: Math.round(this.canvas._height.value),
      }, {no_change: true});

      // XXX: can't be @request_paint(), because it would trigger back-and-forth
      // layout recomputing feedback loop between plots. Plots are also much more
      // responsive this way, especially in interactive mode.
      return this.paint();
    }
  }

  has_finished() {
    if (!super.has_finished()) {
      return false;
    }

    for (const level in this.levels) {
      const renderer_views = this.levels[level];
      for (const id in renderer_views) {
        const view = renderer_views[id];
        if (!view.has_finished()) {
          return false;
        }
      }
    }

    return true;
  }

  render() {
    // Set the plot and canvas to the current model's size
    // This gets called upon solver resize events
    const width = this.model._width.value;
    const height = this.model._height.value;

    this.canvas_view.set_dims([width, height]);
    this.update_constraints();
    if ((this.model.plot.match_aspect !== false) && (this.frame._width.value !== 0) && (this.frame._height.value !== 0)) {
      this.update_dataranges();
    }

    // This allows the plot canvas to be positioned around the toolbar
    this.el.style.position = 'absolute';
    this.el.style.left     = `${this.model._dom_left.value}px`;
    this.el.style.top      = `${this.model._dom_top.value}px`;
    this.el.style.width    = `${this.model._width.value}px`;
    return this.el.style.height   = `${this.model._height.value}px`;
  }

  _needs_layout() {
    for (const _ in this.renderer_views) {
      const view = this.renderer_views[_];
      if (view.model.panel != null) {
        if (_view_sizes.get(view) !== view.get_size()) {
          return true;
        }
      }
    }

    return false;
  }

  repaint() {
    if (this._needs_layout()) {
      return this.parent.partial_layout();
    } else {
      return this.paint();
    }
  }

  paint() {
    let ratio;
    if (this.is_paused) {
      return;
    }

    logger.trace(`PlotCanvas.render() for ${this.model.id}`);

    // Prepare the canvas size, taking HIDPI into account. Note that this may cause a resize
    // of the canvas, which means that any previous calls to ctx.save() will be undone.
    this.canvas_view.prepare_canvas();

    if (this.model.document != null) {
      const interactive_duration = this.model.document.interactive_duration();
      if ((interactive_duration >= 0) && (interactive_duration < this.model.plot.lod_interval)) {
        const { lod_timeout } = this.model.plot;
        setTimeout(() => {
            if (this.model.document.interactive_duration() > lod_timeout) {
              this.model.document.interactive_stop(this.model.plot);
            }
            return this.request_render();
          }
          , lod_timeout);
      } else {
        this.model.document.interactive_stop(this.model.plot);
      }
    }

    for (const k in this.renderer_views) {
      const v = this.renderer_views[k];
      if ((this.range_update_timestamp == null) || (v.set_data_timestamp > this.range_update_timestamp)) {
        this.update_dataranges();
        break;
      }
    }

    // TODO (bev) OK this sucks, but the event from the solver update doesn't
    // reach the frame in time (sometimes) so force an update here for now
    // (mp) not only that, but models don't know about solver anymore, so
    // frame can't update its scales.
    this.model.frame.update_scales();

    const { ctx } = this.canvas_view;
    ctx.pixel_ratio = (ratio = this.canvas.pixel_ratio);  // Also store on cts for WebGL

    // Set hidpi-transform
    ctx.save();  // Save default state, do *after* getting ratio, cause setting canvas.width resets transforms
    ctx.scale(ratio, ratio);
    ctx.translate(0.5, 0.5);

    const frame_box: FrameBox = [
      this.frame._left.value,
      this.frame._top.value,
      this.frame._width.value,
      this.frame._height.value,
    ];

    this._map_hook(ctx, frame_box);
    this._paint_empty(ctx, frame_box);

    this.prepare_webgl(ratio, frame_box);

    ctx.save();
    if (this.visuals.outline_line.doit) {
      this.visuals.outline_line.set_value(ctx);
      let [x0, y0, w, h] = frame_box;
      // XXX: shrink outline region by 1px to make right and bottom lines visible
      // if they are on the edge of the canvas.
      if ((x0 + w) === this.canvas._width.value) {
        w -= 1;
      }
      if ((y0 + h) === this.canvas._height.value) {
        h -= 1;
      }
      ctx.strokeRect(x0, y0, w, h);
    }
    ctx.restore();

    this._paint_levels(ctx, ['image', 'underlay', 'glyph'], frame_box);
    this.blit_webgl(ratio);
    this._paint_levels(ctx, ['annotation'], frame_box);
    this._paint_levels(ctx, ['overlay']);

    if ((this.initial_range_info == null)) {
      this.set_initial_range();
    }

    ctx.restore();  // Restore to default state

    if (!this._has_finished) {
      this._has_finished = true;
      return this.notify_finished();
    }
  }

  _paint_levels(ctx: Context2d, levels, clip_region = null) {
    ctx.save();

    if ((clip_region != null) && (this.model.plot.output_backend === "canvas")) {
      ctx.beginPath();
      ctx.rect.apply(ctx, clip_region);
      ctx.clip();
    }

    const indices = {};
    for (let i = 0; i < this.model.plot.renderers.length; i++) {
      const renderer = this.model.plot.renderers[i];
      indices[renderer.id] = i;
    }

    const sortKey = renderer_view => indices[renderer_view.model.id];

    for (const level of levels) {
      const renderer_views = sortBy(values(this.levels[level]), sortKey);

      for (const renderer_view of renderer_views) {
        renderer_view.render();
      }
    }

    return ctx.restore();
  }

  _map_hook(_ctx: Context2d, _frame_box: FrameBox): void {}

  _paint_empty(ctx: Context2d, frame_box: FrameBox): void {
    const [cx, cy, cw, ch] = [0, 0, this.canvas_view.model._width.value, this.canvas_view.model._height.value]
    const [fx, fy, fw, fh] = frame_box

    ctx.clearRect(cx, cy, cw, ch)

    if (this.visuals.border_fill.doit) {
      this.visuals.border_fill.set_value(ctx);
      ctx.fillRect(cx, cy, cw, ch)
      ctx.clearRect(fx, fy, fw, fh)
    }

    if (this.visuals.background_fill.doit) {
      this.visuals.background_fill.set_value(ctx);
      ctx.fillRect(fx, fy, fw, fh)
    }
  }

  save(name) {
    switch (this.model.plot.output_backend) {
      case "canvas":
      case "webgl": {
        const canvas = this.canvas_view.get_canvas_element();
        if (canvas.msToBlob != null) {
          const blob = canvas.msToBlob();
          return window.navigator.msSaveBlob(blob, name);
        } else {
          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = name + ".png";
          link.target = "_blank";
          return link.dispatchEvent(new MouseEvent('click'));
        }
      }
      case "svg": {
        const svg = this.canvas_view.ctx.getSerializedSvg(true);
        const svgblob = new Blob([svg], {type:'text/plain'});
        const downloadLink = document.createElement("a");
        downloadLink.download =  name + ".svg";
        downloadLink.innerHTML = "Download svg";
        downloadLink.href = window.URL.createObjectURL(svgblob);
        downloadLink.onclick = event => document.body.removeChild(event.target);
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        return downloadLink.click();
      }
    }
  }
}

export class AbovePanel extends LayoutCanvas {
  static initClass(): void {
    this.prototype.type = "AbovePanel";
  }
}
AbovePanel.initClass();

export class BelowPanel extends LayoutCanvas {
  static initClass(): void {
    this.prototype.type = "BelowPanel";
  }
}
BelowPanel.initClass();

export class LeftPanel extends LayoutCanvas {
  static initClass(): void {
    this.prototype.type = "LeftPanel";
  }
}
LeftPanel.initClass();

export class RightPanel extends LayoutCanvas {
  static initClass(): void {
    this.prototype.type = "RightPanel";
  }
}
RightPanel.initClass();

export namespace PlotCanvas {
  export interface Attrs extends LayoutDOM.Attrs {
    plot: Plot
    toolbar: Toolbar
    canvas: Canvas
    frame: CartesianFrame
  }
}

export interface PlotCanvas extends PlotCanvas.Attrs {
  use_map: boolean
}

export class PlotCanvas extends LayoutDOM {

  constructor(attrs?: Partial<PlotCanvas.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'PlotCanvas';
    this.prototype.default_view = PlotCanvasView;

    this.internal({
      plot:         [ p.Instance ],
      toolbar:      [ p.Instance ],
      canvas:       [ p.Instance ],
      frame:        [ p.Instance ],
    });

    this.override({
      // We should find a way to enforce this
      sizing_mode: 'stretch_both',
    });
  }

  protected above_panel: AbovePanel
  protected below_panel: BelowPanel
  protected left_panel:  LeftPanel
  protected right_panel: RightPanel

  initialize(): void {
    super.initialize();

    this.canvas = new Canvas({
      map: this.use_map != null ? this.use_map : false,
      use_hidpi: this.plot.hidpi,
      output_backend: this.plot.output_backend,
    });

    this.frame = new CartesianFrame({
      x_range: this.plot.x_range,
      extra_x_ranges: this.plot.extra_x_ranges,
      x_scale: this.plot.x_scale,
      y_range: this.plot.y_range,
      extra_y_ranges: this.plot.extra_y_ranges,
      y_scale: this.plot.y_scale,
    });

    this.above_panel = new AbovePanel();
    this.below_panel = new BelowPanel();
    this.left_panel  = new LeftPanel();
    this.right_panel = new RightPanel();

    logger.debug("PlotCanvas initialized");
  }

  _doc_attached() {
    this.canvas.attach_document(this.document);
    this.frame.attach_document(this.document);
    this.above_panel.attach_document(this.document);
    this.below_panel.attach_document(this.document);
    this.left_panel.attach_document(this.document);
    this.right_panel.attach_document(this.document);
    super._doc_attached();
    logger.debug("PlotCanvas attached to document");
  }

  get_layoutable_children(): LayoutDOM[] {
    const children = [
      this.above_panel, this.below_panel,
      this.left_panel, this.right_panel,
      this.canvas, this.frame,
    ];

    const collect_panels = (layout_renderers) => {
      for (const r of layout_renderers) {
        if (r.panel != null)
          children.push(r.panel)
      }
    }

    collect_panels(this.plot.above);
    collect_panels(this.plot.below);
    collect_panels(this.plot.left);
    collect_panels(this.plot.right);

    return children;
  }

  get_constraints(): Constraint[] {
    return super.get_constraints().concat(this._get_constant_constraints(), this._get_side_constraints());
  }

  _get_constant_constraints(): Constraint[] {
    return [
      // Set the origin. Everything else is positioned absolutely wrt canvas.
      EQ(this.canvas._left, 0),
      EQ(this.canvas._top,  0),

      GE(this.above_panel._top,    [-1, this.canvas._top]        ),
      EQ(this.above_panel._bottom, [-1, this.frame._top]         ),
      EQ(this.above_panel._left,   [-1, this.left_panel._right]  ),
      EQ(this.above_panel._right,  [-1, this.right_panel._left]  ),

      EQ(this.below_panel._top,    [-1, this.frame._bottom]      ),
      LE(this.below_panel._bottom, [-1, this.canvas._bottom]     ),
      EQ(this.below_panel._left,   [-1, this.left_panel._right]  ),
      EQ(this.below_panel._right,  [-1, this.right_panel._left]  ),

      EQ(this.left_panel._top,     [-1, this.above_panel._bottom]),
      EQ(this.left_panel._bottom,  [-1, this.below_panel._top]   ),
      GE(this.left_panel._left,    [-1, this.canvas._left]       ),
      EQ(this.left_panel._right,   [-1, this.frame._left]        ),

      EQ(this.right_panel._top,    [-1, this.above_panel._bottom]),
      EQ(this.right_panel._bottom, [-1, this.below_panel._top]   ),
      EQ(this.right_panel._left,   [-1, this.frame._right]       ),
      LE(this.right_panel._right,  [-1, this.canvas._right]      ),

      EQ(this._top,                    [-1, this.above_panel._bottom]),
      EQ(this._left,                   [-1, this.left_panel._right]),
      EQ(this._height, [-1, this._bottom], [-1, this.canvas._bottom], this.below_panel._top),
      EQ(this._width, [-1, this._right],   [-1, this.canvas._right], this.right_panel._left),

      GE(this._top,                    -this.plot.min_border_top   ),
      GE(this._left,                   -this.plot.min_border_left  ),
      GE(this._height, [-1, this._bottom], -this.plot.min_border_bottom),
      GE(this._width, [-1, this._right],   -this.plot.min_border_right ),
    ];
  }

  _get_side_constraints() {
    const panels = objs => objs.map((obj) => obj.panel);
    const above = vstack(this.above_panel,          panels(this.plot.above));
    const below = vstack(this.below_panel, reversed(panels(this.plot.below)));
    const left  = hstack(this.left_panel,           panels(this.plot.left));
    const right = hstack(this.right_panel, reversed(panels(this.plot.right)));
    return [].concat(above, below, left, right);
  }
}
PlotCanvas.initClass();

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}

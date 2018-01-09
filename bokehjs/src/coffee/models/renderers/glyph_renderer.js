/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Renderer, RendererView} from "./renderer";
import {LineView} from "../glyphs/line";
import {RemoteDataSource} from "../sources/remote_data_source";
import {CDSView} from "../sources/cds_view";
import {logger} from "core/logging";
import * as p from "core/properties";
import {difference, includes, range} from "core/util/array";
import {extend, clone} from "core/util/object"
;

export class GlyphRendererView extends RendererView {

  initialize(options) {
    super.initialize(options);

    const base_glyph = this.model.glyph;
    const has_fill = includes(base_glyph.mixins, "fill");
    const has_line = includes(base_glyph.mixins, "line");
    const glyph_attrs = clone(base_glyph.attributes);
    delete glyph_attrs.id;

    const mk_glyph = function(defaults) {
      const attrs = clone(glyph_attrs);
      if (has_fill) { extend(attrs, defaults.fill); }
      if (has_line) { extend(attrs, defaults.line); }
      return new (base_glyph.constructor)(attrs);
    };

    this.glyph = this.build_glyph_view(base_glyph);

    let { selection_glyph } = this.model;
    if ((selection_glyph == null)) {
      selection_glyph = mk_glyph({fill: {}, line: {}});
    } else if (selection_glyph === "auto") {
      selection_glyph = mk_glyph(this.model.selection_defaults);
    }
    this.selection_glyph = this.build_glyph_view(selection_glyph);

    let { nonselection_glyph } = this.model;
    if ((nonselection_glyph == null)) {
      nonselection_glyph = mk_glyph({fill: {}, line: {}});
    } else if (nonselection_glyph === "auto") {
      nonselection_glyph = mk_glyph(this.model.nonselection_defaults);
    }
    this.nonselection_glyph = this.build_glyph_view(nonselection_glyph);

    const { hover_glyph } = this.model;
    if (hover_glyph != null) {
      this.hover_glyph = this.build_glyph_view(hover_glyph);
    }

    const { muted_glyph } = this.model;
    if (muted_glyph != null) {
      this.muted_glyph = this.build_glyph_view(muted_glyph);
    }

    const decimated_glyph = mk_glyph(this.model.decimated_defaults);
    this.decimated_glyph = this.build_glyph_view(decimated_glyph);

    this.xscale = this.plot_view.frame.xscales[this.model.x_range_name];
    this.yscale = this.plot_view.frame.yscales[this.model.y_range_name];

    this.set_data(false);

    if (this.model.data_source instanceof RemoteDataSource) {
      return this.model.data_source.setup();
    }
  }

  build_glyph_view(model) {
    return new model.default_view({model, renderer: this, plot_view: this.plot_view, parent: this});
  }

  connect_signals(): void {
    super.connect_signals();

    this.connect(this.model.change, () => this.request_render())
    this.connect(this.model.glyph.change, () => this.set_data())
    this.connect(this.model.data_source.change, () => this.set_data())
    this.connect(this.model.data_source.streaming, () => this.set_data())
    this.connect(this.model.data_source.patching, (indices) => this.set_data(true, indices))
    this.connect(this.model.data_source._select, () => this.request_render())
    if (this.hover_glyph != null) {
      this.connect(this.model.data_source.inspect, () => this.request_render())
    }
    this.connect(this.model.properties.view.change, () => this.set_data())
    this.connect(this.model.view.change, () => this.set_data())

    const {x_ranges, y_ranges} = this.plot_model.frame

    for (const name in x_ranges) {
      const rng = x_ranges[name];
      this.connect(rng.change, () => this.set_data())
    }

    for (const name in y_ranges) {
      const rng = y_ranges[name];
      this.connect(rng.change, () => this.set_data())
    }

    this.connect(this.model.glyph.transformchange, () => this.set_data())
  }

  have_selection_glyphs() { return (this.selection_glyph != null) && (this.nonselection_glyph != null); }

  // in case of partial updates like patching, the list of indices that actually
  // changed may be passed as the "indices" parameter to afford any optional optimizations
  set_data(request_render, indices) {
    if (request_render == null) { request_render = true; }
    const t0 = Date.now();
    const source = this.model.data_source;

    this.all_indices = this.model.view.indices;

    // TODO (bev) this is a bit clunky, need to make sure glyphs use the correct ranges when they call
    // mapping functions on the base Renderer class
    this.glyph.model.setv({x_range_name: this.model.x_range_name, y_range_name: this.model.y_range_name}, {silent: true});
    this.glyph.set_data(source, this.all_indices, indices);

    this.glyph.set_visuals(source);
    this.decimated_glyph.set_visuals(source);
    if (this.have_selection_glyphs()) {
      this.selection_glyph.set_visuals(source);
      this.nonselection_glyph.set_visuals(source);
    }
    if (this.hover_glyph != null) {
      this.hover_glyph.set_visuals(source);
    }
    if (this.muted_glyph != null) {
      this.muted_glyph.set_visuals(source);
    }

    const { lod_factor } = this.plot_model.plot;
    this.decimated = [];
    for (let i = 0, end = Math.floor(this.all_indices.length/lod_factor), asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      this.decimated.push(i*lod_factor);
    }

    const dt = Date.now() - t0;
    logger.debug(`${this.glyph.model.type} GlyphRenderer (${this.model.id}): set_data finished in ${dt}ms`);

    this.set_data_timestamp = Date.now();

    if (request_render) {
      return this.request_render();
    }
  }

  render() {
    let dtrender, dtselect, glyph, nonselection_glyph, selection_glyph, trender;
    let i;
    if (!this.model.visible) {
      return;
    }

    const t0 = Date.now();

    const glsupport = this.glyph.glglyph;

    const tmap = Date.now();
    this.glyph.map_data();
    const dtmap = Date.now() - t0;

    const tmask = Date.now();
    // all_indices is in full data space, indices is converted to subset space
    // either by mask_data (that uses the spatial index) or manually
    let indices = this.glyph.mask_data(this.all_indices);
    if (indices.length === this.all_indices.length) {
      indices = range(0, this.all_indices.length);
    }
    const dtmask = Date.now() - tmask;

    const { ctx } = this.plot_view.canvas_view;
    ctx.save();

    // selected is in full set space
    let { selected } = this.model.data_source;
    if (!selected || (selected.length === 0)) {
      selected = [];
    } else {
      if (selected['0d'].glyph) {
        selected = this.model.view.convert_indices_from_subset(indices);
      } else if (selected['1d'].indices.length > 0) {
        selected = selected['1d'].indices;
      } else {
        selected = ((() => {
          const result = [];
          for (i of Array.from(Object.keys(selected["2d"].indices))) {             result.push(parseInt(i));
          }
          return result;
        })());
      }
    }

    // inspected is in full set space
    let { inspected } = this.model.data_source;
    if (!inspected || (inspected.length === 0)) {
      inspected = [];
    } else {
      if (inspected['0d'].glyph) {
        inspected = this.model.view.convert_indices_from_subset(indices);
      } else if (inspected['1d'].indices.length > 0) {
        inspected = inspected['1d'].indices;
      } else {
        inspected = ((() => {
          const result1 = [];
          for (i of Array.from(Object.keys(inspected["2d"].indices))) {             result1.push(parseInt(i));
          }
          return result1;
        })());
      }
    }

    // inspected is transformed to subset space
    inspected = ((() => {
      const result2 = [];
      for (i of Array.from(indices)) {         if (includes(inspected, this.all_indices[i])) {
          result2.push(i);
        }
      }
      return result2;
    })());

    const { lod_threshold } = this.plot_model.plot;
    if (((this.model.document != null ? this.model.document.interactive_duration() : undefined) > 0) && !glsupport && (lod_threshold != null) && (this.all_indices.length > lod_threshold)) {
      // Render decimated during interaction if too many elements and not using GL
      indices = this.decimated;
      glyph = this.decimated_glyph;
      nonselection_glyph = this.decimated_glyph;
      ({ selection_glyph } = this);
    } else {
      glyph = this.model.muted && (this.muted_glyph != null) ? this.muted_glyph : this.glyph;
      ({ nonselection_glyph } = this);
      ({ selection_glyph } = this);
    }

    if ((this.hover_glyph != null) && inspected.length) {
      indices = difference(indices, inspected);
    }

    if (!(selected.length && this.have_selection_glyphs())) {
        trender = Date.now();
        if (this.glyph instanceof LineView) {
          if (this.hover_glyph && inspected.length) {
            this.hover_glyph.render(ctx, this.model.view.convert_indices_from_subset(inspected), this.glyph);
          } else {
            glyph.render(ctx, this.all_indices, this.glyph);
          }
        } else {
          glyph.render(ctx, indices, this.glyph);
          if (this.hover_glyph && inspected.length) {
            this.hover_glyph.render(ctx, inspected, this.glyph);
          }
        }
        dtrender = Date.now() - trender;

    } else {
      // reset the selection mask
      const tselect = Date.now();
      const selected_mask = {};
      for (i of Array.from(selected)) {
        selected_mask[i] = true;
      }

      // intersect/different selection with render mask
      selected = new Array();
      const nonselected = new Array();

      // now, selected is changed to subset space, except for Line glyph
      if (this.glyph instanceof LineView) {
        for (i of Array.from(this.all_indices)) {
          if (selected_mask[i] != null) {
            selected.push(i);
          } else {
            nonselected.push(i);
          }
        }
      } else {
        for (i of Array.from(indices)) {
          if (selected_mask[this.all_indices[i]] != null) {
            selected.push(i);
          } else {
            nonselected.push(i);
          }
        }
      }
      dtselect = Date.now() - tselect;

      trender = Date.now();
      nonselection_glyph.render(ctx, nonselected, this.glyph);
      selection_glyph.render(ctx, selected, this.glyph);
      if (this.hover_glyph != null) {
        if (this.glyph instanceof LineView) {
          this.hover_glyph.render(ctx, this.model.view.convert_indices_from_subset(inspected), this.glyph);
        } else {
          this.hover_glyph.render(ctx, inspected, this.glyph);
        }
      }
      dtrender = Date.now() - trender;
    }

    this.last_dtrender = dtrender;

    const dttot = Date.now() - t0;
    logger.debug(`${this.glyph.model.type} GlyphRenderer (${this.model.id}): render finished in ${dttot}ms`);
    logger.trace(` - map_data finished in       : ${dtmap}ms`);
    if (dtmask != null) {
      logger.trace(` - mask_data finished in      : ${dtmask}ms`);
    }
    if (dtselect != null) {
      logger.trace(` - selection mask finished in : ${dtselect}ms`);
    }
    logger.trace(` - glyph renders finished in  : ${dtrender}ms`);

    return ctx.restore();
  }

  draw_legend(ctx, x0, x1, y0, y1, field, label) {
    const index = this.model.get_reference_point(field, label);
    return this.glyph.draw_legend_for_index(ctx, x0, x1, y0, y1, index);
  }

  hit_test(geometry, final, append, mode) {
    if (mode == null) { mode = "select"; }
    return this.model.hit_test_helper(geometry, this, final, append, mode);
  }
}

export class GlyphRenderer extends Renderer {

  x_range_name: string;
  y_range_name: string
  /*
  data_source: DataSource
  view: CDSView
  glyph: Glyph
  hover_glyph: Glyph
  nonselection_glyph: Glyph | "auto"
  selection_glyph: Glyph | "auto"
  muted_glyph: Glyph
  muted: boolean
  */
  ;

  static initClass() {

    this.prototype.default_view = GlyphRendererView;

    this.prototype.type = 'GlyphRenderer';

    this.define({
        x_range_name:       [ p.String,  'default' ],
        y_range_name:       [ p.String,  'default' ],
        data_source:        [ p.Instance           ],
        view:               [ p.Instance, () => new CDSView() ],
        glyph:              [ p.Instance           ],
        hover_glyph:        [ p.Instance           ],
        nonselection_glyph: [ p.Any,      'auto'   ], // Instance or "auto"
        selection_glyph:    [ p.Any,      'auto'   ], // Instance or "auto"
        muted_glyph:        [ p.Instance           ],
        muted:              [ p.Bool,        false ]
      });

    this.override({
      level: 'glyph'
    });

    this.prototype.selection_defaults = {fill: {}, line: {}};
    this.prototype.decimated_defaults = {fill: {fill_alpha: 0.3, fill_color: "grey"}, line: {line_alpha: 0.3, line_color: "grey"}};
    this.prototype.nonselection_defaults = {fill: {fill_alpha: 0.2, line_alpha: 0.2}, line: {}};
  }

  initialize(options) {
    super.initialize(options);

    if ((this.view.source == null)) {
      this.view.source = this.data_source;
      return this.view.compute_indices();
    }
  }

  get_reference_point(field, value) {
    let index = 0;  // This is the default to return
    if ((field != null) && (this.data_source.get_column != null)) {
      const data = this.data_source.get_column(field);
      if (data) {
        const i = data.indexOf(value);
        if (i > 0) {
          index = i;
        }
      }
    }
    return index;
  }

  hit_test_helper(geometry, renderer_view, final, append, mode) {
    if (!this.visible) {
      return false;
    }

    const hit_test_result = renderer_view.glyph.hit_test(geometry);

    // glyphs that don't have hit-testing implemented will return null
    if (hit_test_result === null) {
      return false;
    }

    const indices = this.view.convert_selection_from_subset(hit_test_result);

    if (mode === "select") {
      const { selector } = this.data_source.selection_manager;
      selector.update(indices, final, append);
      this.data_source.selected = selector.indices;
      this.data_source._select.emit();
    } else { // mode == "inspect"
      const inspector = this.data_source.selection_manager.get_or_create_inspector(this);
      inspector.update(indices, true, false, true);
      // silently set inspected attr to avoid triggering data_source.change event and rerender
      this.data_source.setv({inspected: inspector.indices}, {silent: true});
      this.data_source.inspect.emit([renderer_view, {geometry}]);
    }

    return !indices.is_empty();
  }

  get_selection_manager() {
    return this.data_source.selection_manager;
  }
}
GlyphRenderer.initClass();

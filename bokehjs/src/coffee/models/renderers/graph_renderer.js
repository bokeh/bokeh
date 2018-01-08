/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Renderer, RendererView} from "../renderers/renderer";
import {NodesOnly} from "../graphs/graph_hit_test_policy";

import * as p from "core/properties";
import {build_views} from "core/build_views";
import {contains} from "core/util/array";
import {create_hit_test_result} from "core/hittest"
;

export class GraphRendererView extends RendererView {

  initialize(options) {
    super.initialize(options);

    this.xscale = this.plot_view.frame.xscales["default"];
    this.yscale = this.plot_view.frame.yscales["default"];

    this._renderer_views = {};
    [this.node_view, this.edge_view] = Array.from(build_views(this._renderer_views,
                                           [this.model.node_renderer, this.model.edge_renderer],
                                           this.plot_view.view_options()));

    return this.set_data();
  }

  connect_signals() {
    let rng;
    super.connect_signals();
    this.connect(this.model.layout_provider.change, function() { return this.set_data(); });
    this.connect(this.model.node_renderer.data_source.select, function() { return this.set_data(); });
    this.connect(this.model.node_renderer.data_source.inspect, function() { return this.set_data(); });
    this.connect(this.model.node_renderer.data_source.change, function() { return this.set_data(); });
    this.connect(this.model.edge_renderer.data_source.select, function() { return this.set_data(); });
    this.connect(this.model.edge_renderer.data_source.inspect, function() { return this.set_data(); });
    this.connect(this.model.edge_renderer.data_source.change, function() { return this.set_data(); });

    for (var name in this.plot_model.frame.x_ranges) {
      rng = this.plot_model.frame.x_ranges[name];
      this.connect(rng.change, function() { return this.set_data(); });
    }

    return (() => {
      const result = [];
      for (name in this.plot_model.frame.y_ranges) {
        rng = this.plot_model.frame.y_ranges[name];
        result.push(this.connect(rng.change, function() { return this.set_data(); }));
      }
      return result;
    })();
  }

  set_data(request_render) {
    // TODO (bev) this is a bit clunky, need to make sure glyphs use the correct ranges when they call
    // mapping functions on the base Renderer class
    if (request_render == null) { request_render = true; }
    this.node_view.glyph.model.setv({x_range_name: this.model.x_range_name, y_range_name: this.model.y_range_name}, {silent: true});
    this.edge_view.glyph.model.setv({x_range_name: this.model.x_range_name, y_range_name: this.model.y_range_name}, {silent: true});

    [this.node_view.glyph._x, this.node_view.glyph._y] = Array.from(this.model.layout_provider.get_node_coordinates(this.model.node_renderer.data_source));
    [this.edge_view.glyph._xs, this.edge_view.glyph._ys] = Array.from(this.model.layout_provider.get_edge_coordinates(this.model.edge_renderer.data_source));
    this.node_view.glyph.index = this.node_view.glyph._index_data();
    this.edge_view.glyph.index = this.edge_view.glyph._index_data();

    if (request_render) {
      return this.request_render();
    }
  }

  render() {
    this.edge_view.render();
    return this.node_view.render();
  }

  hit_test(geometry, final, append, mode) {
    if (mode == null) { mode = "select"; }
    if (!this.model.visible) {
      return false;
    }

    let did_hit = false;

    if (mode === "select") {
      did_hit = this.model.selection_policy != null ? this.model.selection_policy.do_selection(geometry, this, final, append) : undefined;
    } else { // if mode == "inspect"
      did_hit = this.model.inspection_policy != null ? this.model.inspection_policy.do_inspection(geometry, this, final, append) : undefined;
    }

    return did_hit;
  }
}


export class GraphRenderer extends Renderer {

  x_range_name: string;
  y_range_name: string
  /*
  layout_provider:
  node_renderer:
  edge_renderer:
  selection_policy:
  inspection_policy:
  */
  ;

  static initClass() {

    this.prototype.default_view = GraphRendererView;
    this.prototype.type = 'GraphRenderer';

    this.define({
        x_range_name:       [ p.String,        'default'              ],
        y_range_name:       [ p.String,        'default'              ],
        layout_provider:    [ p.Instance                              ],
        node_renderer:      [ p.Instance                              ],
        edge_renderer:      [ p.Instance                              ],
        selection_policy:   [ p.Instance,      () => new NodesOnly()  ],
        inspection_policy:  [ p.Instance,      () => new NodesOnly()  ]
      });

    this.override({
      level: 'glyph'
    });
  }

  get_selection_manager() {
    return this.node_renderer.data_source.selection_manager;
  }
}
GraphRenderer.initClass();

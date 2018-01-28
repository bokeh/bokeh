/* XXX: partial */
import {Renderer, RendererView} from "./renderer"
import {GlyphRenderer} from "./glyph_renderer"
import {LayoutProvider} from "../graphs/layout_provider"
import {GraphHitTestPolicy, NodesOnly} from "../graphs/graph_hit_test_policy";
import * as p from "core/properties";
import {build_views} from "core/build_views";

export class GraphRendererView extends RendererView {
  model: GraphRenderer

  initialize(options: any): void {
    super.initialize(options);

    this.xscale = this.plot_view.frame.xscales["default"];
    this.yscale = this.plot_view.frame.yscales["default"];

    this._renderer_views = {};
    [this.node_view, this.edge_view] = build_views(this._renderer_views,
      [this.model.node_renderer, this.model.edge_renderer], this.plot_view.view_options());

    this.set_data();
  }

  connect_signals(): void {
    super.connect_signals();

    this.connect(this.model.layout_provider.change, () => this.set_data())
    this.connect(this.model.node_renderer.data_source._select, () => this.set_data())
    this.connect(this.model.node_renderer.data_source.inspect, () => this.set_data())
    this.connect(this.model.node_renderer.data_source.change, () => this.set_data())
    this.connect(this.model.edge_renderer.data_source._select, () => this.set_data())
    this.connect(this.model.edge_renderer.data_source.inspect, () => this.set_data())
    this.connect(this.model.edge_renderer.data_source.change, () => this.set_data())

    const {x_ranges, y_ranges} = this.plot_model.frame

    for (const  name in x_ranges) {
      const rng = x_ranges[name];
      this.connect(rng.change, () => this.set_data())
    }

    for (const name in y_ranges) {
      const rng = y_ranges[name];
      this.connect(rng.change, () => this.set_data())
    }
  }

  set_data(request_render = true) {
    // TODO (bev) this is a bit clunky, need to make sure glyphs use the correct ranges when they call
    // mapping functions on the base Renderer class
    this.node_view.glyph.model.setv({x_range_name: this.model.x_range_name, y_range_name: this.model.y_range_name}, {silent: true});
    this.edge_view.glyph.model.setv({x_range_name: this.model.x_range_name, y_range_name: this.model.y_range_name}, {silent: true});

    [this.node_view.glyph._x, this.node_view.glyph._y] = this.model.layout_provider.get_node_coordinates(this.model.node_renderer.data_source);
    [this.edge_view.glyph._xs, this.edge_view.glyph._ys] = this.model.layout_provider.get_edge_coordinates(this.model.edge_renderer.data_source);
    this.node_view.glyph.index = this.node_view.glyph._index_data();
    this.edge_view.glyph.index = this.edge_view.glyph._index_data();

    if (request_render) {
      this.request_render();
    }
  }

  render() {
    this.edge_view.render();
    return this.node_view.render();
  }

  hit_test(geometry, final, append, mode = "select") {
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

export namespace GraphRenderer {
  export interface Attrs extends Renderer.Attrs {
    x_range_name: string;
    y_range_name: string
    layout_provider: LayoutProvider
    node_renderer: GlyphRenderer
    edge_renderer: GlyphRenderer
    selection_policy: GraphHitTestPolicy
    inspection_policy: GraphHitTestPolicy
  }

  export interface Opts extends Renderer.Opts {}
}

export interface GraphRenderer extends GraphRenderer.Attrs {}

export class GraphRenderer extends Renderer {

  static initClass() {
    this.prototype.type = 'GraphRenderer';
    this.prototype.default_view = GraphRendererView;

    this.define({
      x_range_name:       [ p.String,        'default'              ],
      y_range_name:       [ p.String,        'default'              ],
      layout_provider:    [ p.Instance                              ],
      node_renderer:      [ p.Instance                              ],
      edge_renderer:      [ p.Instance                              ],
      selection_policy:   [ p.Instance,      () => new NodesOnly()  ],
      inspection_policy:  [ p.Instance,      () => new NodesOnly()  ],
    });

    this.override({
      level: 'glyph',
    });
  }

  get_selection_manager() {
    return this.node_renderer.data_source.selection_manager;
  }
}
GraphRenderer.initClass();

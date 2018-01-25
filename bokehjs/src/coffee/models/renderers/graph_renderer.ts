/* XXX: partial */
import {Renderer, RendererView} from "../renderers/renderer";
import {GlyphRenderer, GlyphRendererView} from "../renderers/glyph_renderer"
import {NodesOnly} from "../graphs/graph_hit_test_policy";
import {SelectionManager} from "core/selection_manager"

import * as p from "core/properties";
import {build_views} from "core/build_views";

export class GraphRendererView extends RendererView {
  node_view: GlyphRendererView
  edge_view: GlyphRendererView
  model: GraphRenderer

  initialize(options: any): void {
    super.initialize(options);

    this.xscale = this.plot_view.frame.xscales["default"];
    this.yscale = this.plot_view.frame.yscales["default"];

    this._renderer_views = {};
    [this.node_view, this.edge_view] = build_views(this._renderer_views,
      [this.model.node_renderer, this.model.edge_renderer], this.plot_view.view_options());

    this.set_data(true);
  }

  connect_signals(): void {
    super.connect_signals();

    this.connect(this.model.layout_provider.change, () => this.set_data(true))
    this.connect(this.model.node_renderer.data_source._select, () => this.set_data(true))
    this.connect(this.model.node_renderer.data_source.inspect, () => this.set_data(true))
    this.connect(this.model.node_renderer.data_source.change, () => this.set_data(true))
    this.connect(this.model.edge_renderer.data_source._select, () => this.set_data(true))
    this.connect(this.model.edge_renderer.data_source.inspect, () => this.set_data(true))
    this.connect(this.model.edge_renderer.data_source.change, () => this.set_data(true))

    const {x_ranges, y_ranges} = this.plot_model.frame

    for (const  name in x_ranges) {
      const rng = x_ranges[name];
      this.connect(rng.change, () => this.set_data(true))
    }

    for (const name in y_ranges) {
      const rng = y_ranges[name];
      this.connect(rng.change, () => this.set_data(true))
    }
  }

  set_data(request_render: boolean) {
    // TODO (bev) this is a bit clunky, need to make sure glyphs use the correct ranges when they call
    // mapping functions on the base Renderer class
    if (request_render == null) { request_render = true; }
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

}


export class GraphRenderer extends Renderer {

  x_range_name: string;
  y_range_name: string
  node_renderer: GlyphRenderer
  edge_renderer: GlyphRenderer
  /*
  layout_provider:
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
        inspection_policy:  [ p.Instance,      () => new NodesOnly()  ],
      });

    this.override({
      level: 'glyph',
    });
  }

  get_selection_manager(): SelectionManager {
    return this.node_renderer.data_source.selection_manager;
  }
}
GraphRenderer.initClass();

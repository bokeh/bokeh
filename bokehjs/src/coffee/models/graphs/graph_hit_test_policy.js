/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Model} from "../../model";
import {includes, uniq, findIndex} from "core/util/array";
import {create_hit_test_result, create_1d_hit_test_result} from "core/hittest";
import {Selector} from "core/selector"
;

export class GraphHitTestPolicy extends Model {

  do_selection(geometry, graph_view, final, append) {
    return false;
  }

  do_inspection(geometry, graph_view, final, append) {
    return false;
  }
}


export class NodesOnly extends GraphHitTestPolicy {
  static initClass() {
    this.prototype.type = 'NodesOnly';
  }

  _do(geometry, graph_view, final, append) {
    const { node_view } = graph_view;
    const hit_test_result = node_view.glyph.hit_test(geometry);

    // glyphs that don't have hit-testing implemented will return null
    if (hit_test_result === null) {
      return false;
    }

    this._node_selector.update(hit_test_result, final, append);

    return !this._node_selector.indices.is_empty();
  }

  do_selection(geometry, graph_view, final, append) {
    this._node_selector = graph_view.node_view.model.data_source.selection_manager.selector;
    const did_hit = this._do(geometry, graph_view, final, append);
    graph_view.node_view.model.data_source.selected = this._node_selector.indices;
    graph_view.node_view.model.data_source._select.emit();
    return did_hit;
  }

  do_inspection(geometry, graph_view, final, append) {
    this._node_selector = graph_view.model.get_selection_manager().get_or_create_inspector(graph_view.node_view.model);
    const did_hit = this._do(geometry, graph_view, final, append);
    // silently set inspected attr to avoid triggering data_source.change event and rerender
    graph_view.node_view.model.data_source.setv({inspected: this._node_selector.indices}, {silent: true});
    graph_view.node_view.model.data_source.inspect.emit([graph_view.node_view, {geometry}]);
    return did_hit;
  }
}
NodesOnly.initClass();


export class NodesAndLinkedEdges extends GraphHitTestPolicy {
  static initClass() {
    this.prototype.type = 'NodesAndLinkedEdges';
  }

  _do(geometry, graph_view, final, append) {
    let asc, end;
    let i;
    const [node_view, edge_view] = Array.from([graph_view.node_view, graph_view.edge_view]);
    const hit_test_result = node_view.glyph.hit_test(geometry);

    // glyphs that don't have hit-testing implemented will return null
    if (hit_test_result === null) {
      return false;
    }

    this._node_selector.update(hit_test_result, final, append);

    const node_indices = ((() => {
      const result = [];
      for (i of Array.from(hit_test_result["1d"].indices)) {         result.push(node_view.model.data_source.data.index[i]);
      }
      return result;
    })());
    const edge_source = edge_view.model.data_source;
    const edge_indices = [];
    for (i = 0, end = edge_source.data.start.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      if (includes(node_indices, edge_source.data.start[i]) || includes(node_indices, edge_source.data.end[i])) {
        edge_indices.push(i);
      }
    }

    const linked_index = create_hit_test_result();
    for (i of Array.from(edge_indices)) {
      linked_index["2d"].indices[i] = [0];
    } //currently only supports 2-element multilines, so this is all of it

    this._edge_selector.update(linked_index, final, append);

    return !this._node_selector.indices.is_empty();
  }

  do_selection(geometry, graph_view, final, append) {
    this._node_selector = graph_view.node_view.model.data_source.selection_manager.selector;
    this._edge_selector = graph_view.edge_view.model.data_source.selection_manager.selector;

    const did_hit = this._do(geometry, graph_view, final, append);

    graph_view.node_view.model.data_source.selected = this._node_selector.indices;
    graph_view.edge_view.model.data_source.selected = this._edge_selector.indices;
    graph_view.node_view.model.data_source._select.emit();

    return did_hit;
  }

  do_inspection(geometry, graph_view, final, append) {
    this._node_selector = graph_view.node_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.node_view.model);
    this._edge_selector = graph_view.edge_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.edge_view.model);

    const did_hit = this._do(geometry, graph_view, final, append);

    // silently set inspected attr to avoid triggering data_source.change event and rerender
    graph_view.node_view.model.data_source.setv({inspected: this._node_selector.indices}, {silent: true});
    graph_view.edge_view.model.data_source.setv({inspected: this._edge_selector.indices}, {silent: true});
    graph_view.node_view.model.data_source.inspect.emit([graph_view.node_view, {geometry}]);

    return did_hit;
  }
}
NodesAndLinkedEdges.initClass();


export class EdgesAndLinkedNodes extends GraphHitTestPolicy {
  static initClass() {
    this.prototype.type = 'EdgesAndLinkedNodes';
  }

  _do(geometry, graph_view, final, append) {
    let i;
    const [node_view, edge_view] = Array.from([graph_view.node_view, graph_view.edge_view]);
    const hit_test_result = edge_view.glyph.hit_test(geometry);

    // glyphs that don't have hit-testing implemented will return null
    if (hit_test_result === null) {
      return false;
    }

    this._edge_selector.update(hit_test_result, final, append);

    const edge_indices = ((() => {
      const result = [];
      for (i of Array.from(Object.keys(hit_test_result['2d'].indices))) {         result.push(parseInt(i));
      }
      return result;
    })());

    const nodes = [];
    for (i of Array.from(edge_indices)) {
      nodes.push(edge_view.model.data_source.data.start[i]);
      nodes.push(edge_view.model.data_source.data.end[i]);
    }

    const node_indices = ((() => {
      const result1 = [];
      for (i of Array.from(uniq(nodes))) {         result1.push(node_view.model.data_source.data.index.indexOf(i));
      }
      return result1;
    })());

    const node_hit_test_result = create_hit_test_result();
    node_hit_test_result["1d"].indices = node_indices;

    this._node_selector.update(node_hit_test_result, final, append);

    return !this._edge_selector.indices.is_empty();
  }

  do_selection(geometry, graph_view, final, append) {
    this._edge_selector = graph_view.edge_view.model.data_source.selection_manager.selector;
    this._node_selector = graph_view.node_view.model.data_source.selection_manager.selector;

    const did_hit = this._do(geometry, graph_view, final, append);

    graph_view.edge_view.model.data_source.selected = this._edge_selector.indices;
    graph_view.node_view.model.data_source.selected = this._node_selector.indices;
    graph_view.edge_view.model.data_source._select.emit();

    return did_hit;
  }

  do_inspection(geometry, graph_view, final, append) {
    this._edge_selector = graph_view.edge_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.edge_view.model);
    this._node_selector = graph_view.node_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.node_view.model);

    const did_hit = this._do(geometry, graph_view, final, append);

    // silently set inspected attr to avoid triggering data_source.change event and rerender
    graph_view.edge_view.model.data_source.setv({inspected: this._edge_selector.indices}, {silent: true});
    graph_view.node_view.model.data_source.setv({inspected: this._node_selector.indices}, {silent: true});
    graph_view.edge_view.model.data_source.inspect.emit([graph_view.edge_view, {geometry}]);

    return did_hit;
  }
}
EdgesAndLinkedNodes.initClass();

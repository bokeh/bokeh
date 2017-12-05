import {HasProps} from "./has_props"
import {Model} from "../model"
import {Selection} from "../models/selections/selection"
import * as hittest from "./hittest"
import * as p from "./properties"

export class SelectionPolicy extends Model

  hit_test: (geometry, renderer_views) ->
    return null

  do_selection: (hit_test_result, renderer_views, final, append) ->
    if hit_test_result?
      source = renderer_views[0].model.data_source
      source.selected.update(hit_test_result, final, append)
      source.select.emit()
      return not source.selected.is_empty()
    else
      return false

export class IntersectRenderers extends SelectionPolicy
  type: 'IntersectRenderers'

  hit_test: (geometry, renderer_views) ->
    hit_test_result_renderers = (r.hit_test(geometry) for r in renderer_views)
    if hit_test_result_renderers.length > 0
      hit_test_result = hit_test_result_renderers[0]
      for hit_test_result_other in hit_test_result_renderers
        hit_test_result.update_through_intersection(hit_test_result_other)
      return hit_test_result
    else
      return null

export class UnionRenderers extends SelectionPolicy
  type: 'UnionRenderers'

  hit_test: (geometry, renderer_views) ->
    hit_test_result_renderers = (r.hit_test(geometry) for r in renderer_views)
    if hit_test_result_renderers.length > 0
      hit_test_result = hit_test_result_renderers[0]
      for hit_test_result_other in hit_test_result_renderers
        hit_test_result.update_through_union(hit_test_result_other)
      return hit_test_result
    else
      return null

export class SelectionManager extends HasProps
  type: 'SelectionManager'

  @define {
    selection_policy:  [ p.Instance, () -> new UnionRenderers() ]
  }

  @internal {
    source: [ p.Any ]
  }

  initialize: (attrs, options) ->
    super(attrs, options)
    @inspectors = {}

  select: (renderer_views, geometry, final, append=false) ->
    # divide renderers into glyph_renderers or graph_renderers
    glyph_renderer_views = []
    graph_renderer_views = []
    for r in renderer_views
      if r.model.type == 'GlyphRenderer'
        glyph_renderer_views.push(r)
      else if r.model.type == 'GraphRenderer'
        graph_renderer_views.push(r)

    did_hit = false

    # graph renderer case
    for r in graph_renderer_views
      hit_test_result = r.model.selection_policy.hit_test(geometry, r)
      did_hit = did_hit || r.model.selection_policy.do_selection(hit_test_result, r, final, append)

    # glyph renderers
    if glyph_renderer_views.length > 0
      hit_test_result = @selection_policy.hit_test(geometry, renderer_views)
      did_hit = did_hit || @selection_policy.do_selection(hit_test_result, glyph_renderer_views, final, append)

    return did_hit

  inspect: (renderer_view, geometry) ->
    did_hit = false

    if renderer_view.model.type == 'GlyphRenderer'
      hit_test_result = renderer_view.hit_test(geometry)
      did_hit = not hit_test_result.is_empty()
      inspection = @get_or_create_inspector(renderer_view.model)
      inspection.update(hit_test_result, true, false)
      @source.setv({inspected: inspection}, {silent: true})
      @source.inspect.emit([renderer_view, {geometry: geometry}])
    else if renderer_view.model.type == 'GraphRenderer'
      hit_test_result = renderer_view.model.inspection_policy.hit_test(geometry, renderer_view)
      did_hit = did_hit || renderer_view.model.inspection_policy.do_inspection(hit_test_result, geometry, renderer_view, false, false)

    return did_hit

  clear: (rview) ->
    @source.selected.clear()

  get_or_create_inspector: (rmodel) ->
    if not @inspectors[rmodel.id]?
      @inspectors[rmodel.id] = new Selection()
    return @inspectors[rmodel.id]

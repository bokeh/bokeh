import {HasProps} from "./has_props"
import {Model} from "../model"
import {Selection} from "../models/selections_and_inspections/selection"
import * as hittest from "./hittest"
import * as p from "./properties"

export class SelectionPolicy extends Model

  do_selection: (geometry, renderer_view, final, append) ->
    return false

export class IntersectRenderers extends SelectionPolicy
  type: 'IntersectRenderers'

  do_selection: (renderer_views, geometry, final, append) ->
    source = renderer_views[0].model.data_source

    selections_renderers = (r.hit_test(geometry) for r in renderer_views)
    if selections_renderers.length > 0
      selection = selections_renderers[0]
      for selection_other in selections_renderers
        selection.update_through_intersection(selection_other)

      source.selected.update(selection, final, append)
      source.select.emit()

      return not selection.is_empty()

    else
      return false

export class UnionRenderers extends SelectionPolicy
  type: 'UnionRenderers'

  do_selection: (renderer_views, geometry, final, append) ->
    source = renderer_views[0].model.data_source

    selections_renderers = (r.hit_test(geometry) for r in renderer_views)
    if selections_renderers.length > 0
      selection = selections_renderers[0]
      for selection_other in selections_renderers
        selection.update_through_union(selection_other)

      source.selected.update(selection, final, append)
      source.select.emit()

      return not selection.is_empty()

    else
      return false

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

    # graph renderer case
    did_hit = false
    for r in graph_renderer_views
      did_hit ||= r.hit_test(geometry, final, append)

    # glyph renderers
    if glyph_renderer_views.length > 0
      did_hit ||= @selection_policy.do_selection(glyph_renderer_views, geometry, final, append)

    return did_hit

  inspect: (renderer_view, geometry) ->
    did_hit = false
    did_hit ||= renderer_view.hit_test(geometry, false, false, "inspect")
    return did_hit

  clear: (rview) ->
    @source.selected.clear()

  get_or_create_inspector: (rmodel) ->
    if not @inspectors[rmodel.id]?
      @inspectors[rmodel.id] = new Selection()
    return @inspectors[rmodel.id]

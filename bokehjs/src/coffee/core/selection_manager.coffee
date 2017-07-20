import {HasProps} from "./has_props"
import {logger} from "./logging"
import {Selector} from "./selector"
import * as hittest from "./hittest"
import * as p from "./properties"
import {GraphRendererView} from "../models/renderers/graph_renderer"

export class SelectionManager extends HasProps
  type: 'SelectionManager'

  @internal {
    source: [ p.Any ]
  }

  initialize: (attrs, options) ->
    super(attrs, options)
    @selector = new Selector()
    @inspectors = {}
    @last_inspection_was_empty = {}

  select: (renderer_views, geometry, final, append=false) ->
    did_hit = false

    for r in renderer_views
      did_hit ||= r.hit_test(geometry, final, append)

    @source.select.emit()

    return did_hit

  inspect: (renderer_view, geometry) ->
    inspector = @_get_inspector(renderer_view)

    did_hit = false
    did_hit ||= renderer_view.hit_test(geometry, false, false, "inspect")

    @last_inspection_was_empty[renderer_view.model.id] = did_hit

    @source.inspect.emit([renderer_view, {"geometry": geometry}])
    return did_hit

  clear: (rview) ->
    @selector.clear()
    @source.selected = hittest.create_hit_test_result()

  _get_inspector: (rview) ->
    id = rview.model.id
    if @inspectors[id]?
      return @inspectors[id]
    else
      return @inspectors[id] = new Selector()

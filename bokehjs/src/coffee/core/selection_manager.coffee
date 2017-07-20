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

  select: (tool, renderer_views, geometry, final, append=false) ->
    did_hit = false

    for r in renderer_views
      did_hit ||= r.hit_test(geometry, final, append)

    @source.select.emit()

    return did_hit

  inspect: (tool, renderer_view, geometry, data) ->
    source = @source

    # if source != renderer_view.model.data_source
    #   logger.warn('inspect called with mis-matched data sources')
    #
    # view = renderer_view.model.view
    # if source != view.source
    #   logger.warn('inspect called with view and data source mismatch')

    hit_test_result = renderer_view.hit_test(geometry)

    if renderer_view instanceof GraphRendererView
      indices = renderer_view.model.node_renderer.view.convert_selection_from_subset(hit_test_result)
      renderer_view = renderer_view.node_view
    else
      indices = renderer_view.model.view.convert_selection_from_subset(hit_test_result)

    if indices?
      r_id = renderer_view.model.id

      if indices.is_empty()
        if not @last_inspection_was_empty[r_id]?
          @last_inspection_was_empty[r_id] = false
        if @last_inspection_was_empty[r_id]
          return
        else
          @last_inspection_was_empty[r_id] = true
      else
        @last_inspection_was_empty[r_id] = false

      inspector = @_get_inspector(renderer_view)
      inspector.update(indices, true, false, true)

      @source.setv({inspected: inspector.indices}, {"silent": true })

      source.inspect.emit([indices, tool, renderer_view, source, data])
      return not indices.is_empty()
    else
      return false

  clear: (rview) ->
    @selector.clear()
    @source.selected = hittest.create_hit_test_result()

  _get_inspector: (rview) ->
    id = rview.model.id
    if @inspectors[id]?
      return @inspectors[id]
    else
      return @inspectors[id] = new Selector()

import {HasProps} from "./has_props"
import {logger} from "./logging"
import {Selector} from "./selector"
import * as hittest from "./hittest"
import * as p from "./properties"

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
    source = @source
    if source != renderer_views[0].model.data_source
      logger.warn('select called with mis-matched data sources')

    #view = renderer_view.model.view
    #if source != view.source
    #  logger.warn('select called with view and data source mismatch')

    indices_renderers = []

    for r in renderer_views
      hit_test_result = r.hit_test(geometry)
      # renderers that don't support hit testing a particular kind of geometry
      # will return null, need to filter those out and see if anything is left
      if hit_test_result != null
        indices_renderers.push(r.model.view.convert_selection_from_subset(hit_test_result))

    if indices_renderers.length == 0
      return false

    if indices_renderers?
      indices = indices_renderers[0]
      for indices_other in indices_renderers
        indices.update_through_union(indices_other)

      @selector.update(indices, final, append)

      @source.selected = @selector.indices

      source.select.emit()

      return not indices.is_empty()
    else
      return false

  inspect: (tool, renderer_view, geometry, data) ->
    source = @source
    if source != renderer_view.model.data_source
      logger.warn('inspect called with mis-matched data sources')

    view = renderer_view.model.view
    if source != view.source
      logger.warn('inspect called with view and data source mismatch')

    indices = renderer_view.model.view.convert_selection_from_subset(renderer_view.hit_test(geometry))

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

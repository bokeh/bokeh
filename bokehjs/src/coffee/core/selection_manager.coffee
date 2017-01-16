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
    @selectors = {}
    @inspectors = {}
    @last_inspection_was_empty = {}

  select: (tool, renderer_view, geometry, final, append=false) ->
    source = @source
    if source != renderer_view.model.data_source
      logger.warn('select called with mis-matched data sources')

    indices = renderer_view.hit_test(geometry)

    if indices?
      selector = @_get_selector(renderer_view)
      selector.update(indices, final, append)

      @source.selected = selector.indices

      source.trigger('select')
      source.trigger('select-' + renderer_view.model.id)

      return not indices.is_empty()
    else
      return false

  inspect: (tool, renderer_view, geometry, data) ->
    source = @source
    if source != renderer_view.model.data_source
      logger.warn('inspect called with mis-matched data sources')

    indices = renderer_view.hit_test(geometry)

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

      source.trigger(
        'inspect', indices, tool, renderer_view, source, data
      )
      source.trigger(
        "inspect#{renderer_view.model.id}", indices, tool, renderer_view,
        source, data
      )
      return not indices.is_empty()
    else
      return false

  clear: (rview) ->
    if rview?
      selector = @_get_selector(rview)
      selector.clear()
    else
      for k, s of @selectors
        s.clear()
    @source.selected = hittest.create_hit_test_result()

  _get_selector_from: (rview, selectors) ->
    id = rview.model.id
    if selectors[id]?
      return selectors[id]
    else
      return selectors[id] = new Selector()

  _get_selector: (rview) -> @_get_selector_from(rview, @selectors)

  _get_inspector: (rview) -> @_get_selector_from(rview, @inspectors)

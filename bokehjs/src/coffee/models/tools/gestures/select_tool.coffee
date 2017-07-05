import {GestureTool, GestureToolView} from "./gesture_tool"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import {logger} from "core/logging"
import * as p from "core/properties"
import {clone} from "core/util/object"

export class SelectToolView extends GestureToolView

  @getters {
    computed_renderers: () ->
      renderers = @model.renderers
      names = @model.names

      if renderers.length == 0
        all_renderers = @plot_model.plot.renderers
        renderers = (r for r in all_renderers when r instanceof GlyphRenderer)

      if names.length > 0
        renderers = (r for r in renderers when names.indexOf(r.name) >= 0)

      return renderers
  }

  _computed_renderers_by_data_source: () ->
    renderers_by_source = {}
    for r in @computed_renderers
      if !(r.data_source.id of renderers_by_source)
        renderers_by_source[r.data_source.id] = [r]
      else
        renderers_by_source[r.data_source.id] = renderers_by_source[r.data_source.id].concat([r])
    return renderers_by_source

  _keyup: (e) ->
    if e.keyCode == 27
      for r in @computed_renderers
        ds = r.data_source
        sm = ds.selection_manager
        sm.clear()

export class SelectTool extends GestureTool

  @define {
    renderers: [ p.Array, [] ]
    names:     [ p.Array, [] ]
  }

  @internal {
    multi_select_modifier: [ p.String, "shift" ]
  }

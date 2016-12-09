import * as _ from "underscore"
import {ButtonTool, ButtonToolView} from "../button_tool"

export class InspectToolView extends ButtonToolView

export class InspectTool extends ButtonTool
  event_type: "move"

  @override {
    active: true
  }

  bind_bokeh_events: () ->
    super()
    @listenTo(events, 'move', @_inspect)

  _inspect: (vx, vy, e) ->

  _exit_inner: () ->

  _exit_outer: () ->

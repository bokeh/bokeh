# Granular event classes for use with the event system
import {logger} from "./logging"

class Event

  @_event_classes = {}

  constructor : (options) ->
    @_options = options
    if options.model_id == undefined
      @model_id = null

  set_model_id : (id) ->
    @_options.model_id = id
    @model_id = id
    return @

  @event_class : (e) ->
    # Given an event with a type attribute matching the event_name,
    # return the appropriate Event class
    if not e.type?
        logger.warn('Event.event_class required events with a string type attribute')
    return @_event_classes[e.type]

  toJSON : () ->
    if not this.constructor.event_name
        throw Error('All events need to have an event name.')
    return {event_name: this.constructor.event_name, event_values: @_options}

  # Called by one of the applicable models processing the event
  _customize_event : (model) ->
    return @


class UIEvent extends Event
  # A UIEvent is an event originating on a PlotCanvas this includes
  # DOM events such as keystrokes as well as hammer events.
  @applicable_models = ['Plot']

  constructor: (options) ->
    super(options)



export class ButtonClick extends Event

  @event_name = 'button_click'
  @applicable_models = ['Button']

  constructor: (options) ->
    super(options)



export class KeyDown extends UIEvent
  @event_name = 'keydown'
  @_event_classes['keydown'] = @

  constructor: (options) ->
    @key = options.key
    super(options)


export class PointEvent extends UIEvent

  constructor: (options) ->
    {@sx, @sy} = options
    [@x, @y] = [null, null]
    super(options)

  @from_event : (e, model_id=null) ->
    # Given a DOM point event, construct a corresponding Event instance
    return new @({sx: e.bokeh['sx'], sy : e.bokeh['sy'], model_id: model_id})


export class MouseMove extends PointEvent
  @event_name = 'mousemove'
  @_event_classes['mousemove'] = @



export class HammerEvent extends UIEvent

  constructor: (options) ->
    {@sx, @sy} = options
    [@x, @y] = [null, null]
    super(options)

  @from_event : (e, model_id=null) ->
    # Given a hammer event, construct a corresponding Event instance
    return new @({sx: e.bokeh['sx'], sy : e.bokeh['sy'], model_id: model_id})

  _customize_event : (plot) ->
    xmapper = plot.plot_canvas.frame.x_mappers['default']
    ymapper = plot.plot_canvas.frame.y_mappers['default']
    @x = xmapper.map_from_target(plot.plot_canvas.canvas.sx_to_vx(@sx))
    @y = ymapper.map_from_target(plot.plot_canvas.canvas.sy_to_vy(@sy))
    @_options['x'] = @x
    @_options['y'] = @y
    return @


export class Tap extends HammerEvent

  @event_name = 'tap'
  @_event_classes['tap'] = @

export class DoubleTap extends HammerEvent

  @event_name = 'doubletap'
  @_event_classes['doubletap'] = @

export class Press extends HammerEvent

  @event_name = 'press'
  @_event_classes['press'] = @


export class PanStart extends HammerEvent

  @event_name = 'panstart'
  @_event_classes['panstart'] = @

export class PanEnd extends HammerEvent

  @event_name = 'panend'
  @_event_classes['panend'] = @


export class Pan extends HammerEvent

  @event_name = 'pan'
  @_event_classes['pan'] = @

  @from_event : (e, model_id=null) ->
    return new @({sx: e.bokeh['sx'], sy : e.bokeh['sy'], deltaX : e.deltaX, deltaY : e.deltaY, direction: e.direction, model_id: model_id })

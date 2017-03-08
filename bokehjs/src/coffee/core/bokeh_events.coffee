# Granular event classes for use with the event system
import {logger} from "./logging"


export class Event

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


export class ButtonClick extends Event

  @event_name = 'button_click'
  @applicable_models = ['Button']

  constructor: (options) ->
    super(options)


export class UIEvent extends Event
  # A UIEvent is an event originating on a PlotCanvas this includes
  # DOM events such as keystrokes as well as hammer events and LOD events.
  @applicable_models = ['Plot']

  constructor: (options) ->
    super(options)


export class LODStart extends UIEvent
  @event_name = 'lodstart'
  @_event_classes['lodstart'] = @

  constructor: (options) ->
    super(options)


export class LODEnd extends UIEvent
  @event_name = 'lodend'
  @_event_classes['lodend'] = @

  constructor: (options) ->
    super(options)


export class PointEvent extends UIEvent

  constructor: (options) ->
    {@sx, @sy} = options
    [@x, @y] = [null, null]
    super(options)

  @from_event : (e, model_id=null) ->
    # Given a DOM point event, construct a corresponding Event instance
    return new @({sx: e.bokeh['sx'], sy : e.bokeh['sy'], model_id: model_id})

  _customize_event : (plot) ->
    xmapper = plot.plot_canvas.frame.x_mappers['default']
    ymapper = plot.plot_canvas.frame.y_mappers['default']
    @x = xmapper.map_from_target(plot.plot_canvas.canvas.sx_to_vx(@sx))
    @y = ymapper.map_from_target(plot.plot_canvas.canvas.sy_to_vy(@sy))
    @_options['x'] = @x
    @_options['y'] = @y
    return @


export class Pan extends PointEvent

  @event_name = 'pan'
  @_event_classes['pan'] = @

  @from_event : (e, model_id=null) ->
    return new @({sx: e.bokeh['sx'], sy : e.bokeh['sy'], deltaX : e.deltaX, deltaY : e.deltaY, direction: e.direction, model_id: model_id })


export class Pinch extends PointEvent

  @event_name = 'pinch'
  @_event_classes['pinch'] = @

  @from_event : (e, model_id=null) ->
    return new @({sx: e.bokeh['sx'], sy : e.bokeh['sy'], scale : e.scale, model_id: model_id })


export class MouseWheel extends PointEvent

  @event_name = 'wheel'
  @_event_classes['wheel'] = @

  @from_event : (e, model_id=null) ->
    return new @({sx: e.bokeh['sx'], sy : e.bokeh['sy'], delta : e.bokeh['delta'], model_id: model_id })



export class MouseMove extends PointEvent
  @event_name = 'mousemove'
  @_event_classes['mousemove'] = @


export class MouseEnter extends PointEvent
  @event_name = 'mouseenter'
  @_event_classes['mouseenter'] = @


export class MouseExit extends PointEvent
  @event_name = 'mouseexit'
  @_event_classes['mouseexit'] = @


export class Tap extends PointEvent
  @event_name = 'tap'
  @_event_classes['tap'] = @


export class DoubleTap extends PointEvent
  @event_name = 'doubletap'
  @_event_classes['doubletap'] = @


export class Press extends PointEvent
  @event_name = 'press'
  @_event_classes['press'] = @


export class PanStart extends PointEvent

  @event_name = 'panstart'
  @_event_classes['panstart'] = @


export class PanEnd extends PointEvent

  @event_name = 'panend'
  @_event_classes['panend'] = @


export class PinchStart extends PointEvent

  @event_name = 'pinchstart'
  @_event_classes['pinchstart'] = @


export class PinchEnd extends PointEvent

  @event_name = 'pinchend'
  @_event_classes['pinchend'] = @

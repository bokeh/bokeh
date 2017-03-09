''' Represent granular events that can be used to trigger callbacks.

Bokeh documents and applications are capable of supporting various kinds of
interactions. These are often associated with events, such as mouse or touch
events, interactive downsampling mode activation, widget or tool events, and
others. The classes in this module represent these different events, so that
callbacks can be attached and executed when they occur.

It is possible to respond to events with ``CustomJS`` callbacks, which will
function with or without a Bokeh server. This can be accomplished with the
:func:`~bokeh.model.Model.js_on_event` method:

.. code-block:: python

    # example setting up JS callback

Alternatively it is possible to trigger Python code to run when events
happen, in the context of a Bokeh application running on a Bokeh server.
This can ccomplished with the :func:`~bokeh.model.Model.on_event` method:

. code-block:: python

    # example setting up python callback

'''
from __future__ import absolute_import

class Event(object):
    ''' Base class for all Bokeh events.

    '''
    _event_classes = []

    def __init__(self, model_id=None):
        self.model_id = model_id

    @classmethod
    def register_event_class(cls, event_cls):
        ''' Register a custom event class.

        '''
        cls._event_classes.append(event_cls)

    @classmethod
    def from_JSON(cls, json):
        eventclasses = [eventcls for eventcls in cls._event_classes]
        for eventscls in eventclasses:
            if eventscls.event_name == json['event_name']:
                return eventscls(**json['event_values'])
        print('Warning: Could not find appropriate Event class')


class ButtonClick(Event):
    ''' Announce a button click event.

    '''
    event_name = 'button_click'

    def __init__(self, model_id=None):
        super(ButtonClick, self).__init__(model_id=model_id)


class LODStart(Event):
    ''' Announce the start of "interactive level-of-detail" mode on a plot.

    '''
    event_name = 'lodstart'

class LODEnd(Event):
    ''' Announce the end of "interactive level-of-detail" mode on a plot.

    '''
    event_name = 'lodend'

class PointEvent(Event):
    ''' Base class for UI events associated with a specific (x,y) point.

    '''
    event_name = None

    def __init__(self, sx=None,sy=None, x=None, y=None, model_id=None):
        self.sx = sx
        self.sy = sy
        self.x = x
        self.y = y
        super(PointEvent, self).__init__(model_id=model_id)

# --- Point Events ------------------------------------------------------------

class DoubleTap(PointEvent):
    ''' Announce a double-tap or double-click event on a Bokeh plot.

    '''
    event_name = 'doubletap'

class MouseEnter(PointEvent):
    '''

    '''
    event_name = 'mouseenter'

class MouseLeave(PointEvent):
    '''

    '''
    event_name = 'mouseleave'

class MouseMove(PointEvent):
    '''

    '''
    event_name = 'mousemove'

class MouseWheel(PointEvent):
    '''

    '''
    event_name = 'wheel'

    def __init__(self, delta=None, **kwargs):
        self.delta = delta
        super(MouseWheel, self).__init__(**kwargs)

class Pan(PointEvent):
    '''

    '''
    event_name = 'pan'

    def __init__(self, deltaX=None, deltaY=None, direction=None, **kwargs):
        self.deltaX = deltaX
        self.deltaY = deltaY
        self.direction = direction
        super(Pan, self).__init__(**kwargs)

class PanEnd(PointEvent):
    '''

    '''
    event_name = 'panend'

class PanStart(PointEvent):
    '''

    '''
    event_name = 'panstart'

class Pinch(PointEvent):
    '''

    '''
    event_name = 'pinch'

    def __init__(self, scale=None, **kwargs):
        self.scale = scale
        super(Pinch, self).__init__(**kwargs)

class PinchEnd(PointEvent):
    '''

    '''
    event_name = 'pinchend'

class PinchStart(PointEvent):
    '''

    '''
    event_name = 'pinchstart'

class Press(PointEvent):
    '''

    '''
    event_name = 'press'

Event._event_classes = [v for v in locals().values()
                        if (type(v)==type and issubclass(v,Event))]

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

    from bokh.models import Button
    button = Button()
    button.js_on_event(events.ButtonClick, CustomJS(code='console.log("JS:Click")'))

Alternatively it is possible to trigger Python code to run when events
happen, in the context of a Bokeh application running on a Bokeh server.
This can ccomplished with the :func:`~bokeh.model.Model.on_event` method:

. code-block:: python

    from bokh.models import Button
    button = Button()

    def click_callback(event):
       print('Python:Click')

    button.on_event(events.ButtonClick, click_callback)

'''
from __future__ import absolute_import
from .util.future import with_metaclass
import logging
logger = logging.getLogger(__file__)

EVENT_CLASSES = set()



class MetaEvent(type):
    ''' Metaclass used to keep track of all classes subclassed from Event.

    All Event classes will be added to the EVENT_CLASSES set which is
    used to decode event instances from JSON.
    '''
    def __new__(cls, clsname, bases, attrs):
        newclass = super(MetaEvent, cls).__new__(cls, clsname, bases, attrs)
        EVENT_CLASSES.add(newclass)
        return newclass


class Event(with_metaclass(MetaEvent, object)):
    ''' Base class for all Bokeh events.

    '''
    _event_classes = []
    event_name = None

    def __init__(self, model):
        self._model_id = None
        if model is not None:
            self._model_id = model._id

    @classmethod
    def decode_json(cls, dct):
        ''' Custom json decoder for Events for use with the object_hook
        argument of json.load or json.loads.
        '''
        if not (('event_name' in dct) and ('event_values' in dct)):
            return dct

        event_values = dct['event_values']
        for eventscls in EVENT_CLASSES:
            if eventscls.event_name == dct['event_name']:
                model_id = event_values.pop('model_id')
                event = eventscls(model=None, **event_values)
                event._model_id = model_id
                return event
        logger.warn("Could not find appropriate Event class for %r" % dct['event_name'])


class ButtonClick(Event):
    ''' Announce a button click event on a Bokeh Button widget

    '''
    event_name = 'button_click'

    def __init__(self, model):
        from .models.widgets import Button
        if model is not None and not isinstance(model, Button):
            msg ='{clsname} event only applies to Button models'
            raise ValueError(msg.format(clsname=self.__class__.__name__))
        super(ButtonClick, self).__init__(model=model)



class PlotEvent(Event):
    ''' PlotEvent is the baseclass for all events applicable to Plot models
    '''

    def __init__(self, model):
        from .models import Plot
        if model is not None and not isinstance(model, Plot):
            msg ='{clsname} event only applies to Plot models'
            raise ValueError(msg.format(clsname=self.__class__.__name__))
        super(PlotEvent, self).__init__(model=model)


class LODStart(PlotEvent):
    ''' Announce the start of "interactive level-of-detail" mode on a plot.

    '''
    event_name = 'lodstart'

class LODEnd(PlotEvent):
    ''' Announce the end of "interactive level-of-detail" mode on a plot.

    '''
    event_name = 'lodend'

class PointEvent(PlotEvent):
    ''' Base class for UI events associated with a specific (x,y) point.

    '''
    event_name = None

    def __init__(self, model, sx=None,sy=None, x=None, y=None):
        self.sx = sx
        self.sy = sy
        self.x = x
        self.y = y
        super(PointEvent, self).__init__(model=model)

# --- Point Events ------------------------------------------------------------

class Tap(PointEvent):
    ''' Announce a tap or click event on a Bokeh plot.

    '''
    event_name = 'tap'


class DoubleTap(PointEvent):
    ''' Announce a double-tap or double-click event on a Bokeh plot.

    '''
    event_name = 'doubletap'

class Press(PointEvent):
    ''' Announce a press event on a Bokeh plot.

    '''
    event_name = 'press'


class MouseEnter(PointEvent):
    ''' Announce a mouse enter event onto a Bokeh plot.

    '''
    event_name = 'mouseenter'

class MouseLeave(PointEvent):
    ''' Announce a mouse leave event from a Bokeh plot.

    '''
    event_name = 'mouseleave'

class MouseMove(PointEvent):
    ''' Announce a mouse movement event over a Bokeh plot.

    '''
    event_name = 'mousemove'

class MouseWheel(PointEvent):
    ''' Announce a mouse whee event on a Bokeh plot.

    '''
    event_name = 'wheel'

    def __init__(self, model, delta=None, **kwargs):
        self.delta = delta
        super(MouseWheel, self).__init__(model, **kwargs)

class Pan(PointEvent):
    ''' Announce a pan event on a Bokeh plot.

    '''
    event_name = 'pan'

    def __init__(self, model, delta_x=None, delta_y=None, direction=None, **kwargs):
        self.delta_x = delta_x
        self.delta_y = delta_y
        self.direction = direction
        super(Pan, self).__init__(model, **kwargs)

class PanEnd(PointEvent):
    ''' Announce the end of a pan event on a Bokeh plot.

    '''
    event_name = 'panend'

class PanStart(PointEvent):
    ''' Announce the start of a pan event on a Bokeh plot.

    '''
    event_name = 'panstart'

class Pinch(PointEvent):
    ''' Announce a pinch event on a Bokeh plot.

    '''
    event_name = 'pinch'

    def __init__(self, model, scale=None, **kwargs):
        self.scale = scale
        super(Pinch, self).__init__(model, **kwargs)

class PinchEnd(PointEvent):
    ''' Announce the end of a pinch event on a Bokeh plot.

    '''
    event_name = 'pinchend'

class PinchStart(PointEvent):
    ''' Announce the start of a pinch event on a Bokeh plot.

    '''
    event_name = 'pinchstart'

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

    def __init__(self, model_id=None):
        self.model_id = model_id

    @classmethod
    def decode_json(cls, dct):
        ''' Custom json decoder for Events for use with the object_hook
        argument of json.load or json.loads.
        '''
        if not (('event_name' in dct) and ('event_values' in dct)):
            return dct

        for eventscls in EVENT_CLASSES:
            if eventscls.event_name == dct['event_name']:
                return eventscls(**dct['event_values'])
        logger.warn("Could not find appropriate Event class for %r" % dct['event_name'])


    def pprint(self, attributes):
        ''' Pretty print the event with the given set of attributes'''
        cls_name = self.__class__.__name__
        attrs = ', '.join(['{attr}={val}'.format(attr=attr, val=self.__dict__[attr])
                           for attr in attributes])
        return '{cls_name}({attrs})'.format(cls_name=cls_name, attrs=attrs)

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

class Tap(PointEvent):
    ''' Announce a tap or click event on a Bokeh plot.

    '''
    event_name = 'tap'


class DoubleTap(PointEvent):
    ''' Announce a double-tap or double-click event on a Bokeh plot.

    '''
    event_name = 'doubletap'

class Press(PointEvent):
    '''

    '''
    event_name = 'press'


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

    def __init__(self, delta_x=None, delta_y=None, direction=None, **kwargs):
        self.delta_x = delta_x
        self.delta_y = delta_y
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

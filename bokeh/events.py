#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Represent granular events that can be used to trigger callbacks.

Bokeh documents and applications are capable of supporting various kinds of
interactions. These are often associated with events, such as mouse or touch
events, interactive downsampling mode activation, widget or tool events, and
others. The classes in this module represent these different events, so that
callbacks can be attached and executed when they occur.

It is possible to respond to events with ``CustomJS`` callbacks, which will
function with or without a Bokeh server. This can be accomplished by passing
and event class, and a ``CustomJS`` model to the
:func:`~bokeh.model.Model.js_on_event` method. When the ``CustomJS`` is
executed in the browser, its ``cb_obj`` argument will contain the concrete
event object that triggered the callback.

.. code-block:: python

    from bokeh.events import ButtonClick
    from bokeh.models import Button, CustomJS

    button = Button()

    button.js_on_event(ButtonClick, CustomJS(code='console.log("JS:Click")'))

Alternatively it is possible to trigger Python code to run when events
happen, in the context of a Bokeh application running on a Bokeh server.
This can accomplished by passing an event class, and a callback function
to the the :func:`~bokeh.model.Model.on_event` method. The callback should
accept a single argument ``event``, which will be passed the concrete
event object that triggered the callback.

.. code-block:: python

    from bokeh.events import ButtonClick
    from bokeh.models import Button

    button = Button()

    def callback(event):
        print('Python:Click')

    button.on_event(ButtonClick, callback)

.. note ::
    There is no throttling of events. Some events such as ``MouseMove``
    may trigger at a very high rate.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from .util.future import with_metaclass

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ButtonClick',
    'DoubleTap',
    'Event',
    'LODStart',
    'LODEnd',
    'MenuItemClick',
    'MouseEnter',
    'MouseLeave',
    'MouseMove',
    'MouseWheel',
    'Pan',
    'PanEnd',
    'PanStart',
    'Pinch',
    'PinchEnd',
    'PinchStart',
    'PlotEvent',
    'PointEvent',
    'Press',
    'Reset',
    'SelectionGeometry',
    'Tap',
)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_CONCRETE_EVENT_CLASSES = dict()

class _MetaEvent(type):
    ''' Metaclass used to keep track of all classes subclassed from Event.

    All Concrete Event classes (i.e. not "abstract" event base classes with
    no ``event_name``) will be added to the _CONCRETE_EVENT_CLASSES set which
    is used to decode event instances from JSON.

    '''
    def __new__(cls, clsname, bases, attrs):
        newclass = super(_MetaEvent, cls).__new__(cls, clsname, bases, attrs)
        if newclass.event_name is not None:
            _CONCRETE_EVENT_CLASSES[newclass.event_name] = newclass
        return newclass

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Event(with_metaclass(_MetaEvent, object)):
    ''' Base class for all Bokeh events.

    This base class is not typically useful to instantiate on its own.

    '''
    _event_classes = []
    event_name = None

    def __init__(self, model):
        ''' Create a new base event.

        Args:

            model (Model) : a Bokeh model to register event callbacks on

        '''
        self._model_id = None
        if model is not None:
            self._model_id = model.id

    @classmethod
    def decode_json(cls, dct):
        ''' Custom JSON decoder for Events.

        Can be used as the ``object_hook`` argument of ``json.load`` or
        ``json.loads``.

        Args:
            dct (dict) : a JSON dictionary to decode
                The dictionary should have keys ``event_name`` and ``event_values``

        Raises:
            ValueError, if the event_name is unknown

        Examples:

            .. code-block:: python

                >>> import json
                >>> from bokeh.events import Event
                >>> data = '{"event_name": "pan", "event_values" : {"model_id": 1, "x": 10, "y": 20, "sx": 200, "sy": 37}}'
                >>> json.loads(data, object_hook=Event.decode_json)
                <bokeh.events.Pan object at 0x1040f84a8>

        '''
        if not ('event_name' in dct and 'event_values' in dct):
            return dct

        event_name = dct['event_name']

        if event_name not in _CONCRETE_EVENT_CLASSES:
            raise ValueError("Could not find appropriate Event class for event_name: %r" % event_name)

        event_values = dct['event_values']
        model_id = event_values.pop('model_id')
        event = _CONCRETE_EVENT_CLASSES[event_name](model=None, **event_values)
        event._model_id = model_id
        return event

class ButtonClick(Event):
    ''' Announce a button click event on a Bokeh button widget.

    '''
    event_name = 'button_click'

    def __init__(self, model):
        from .models.widgets import AbstractButton
        if model is not None and not isinstance(model, AbstractButton):
            msg ='{clsname} event only applies to button models'
            raise ValueError(msg.format(clsname=self.__class__.__name__))
        super(ButtonClick, self).__init__(model=model)

class MenuItemClick(Event):
    ''' Announce a button click event on a Bokeh menu item.

    '''
    event_name = 'menu_item_click'

    def __init__(self, model, item=None):
        self.item = item
        super(MenuItemClick, self).__init__(model=model)

class PlotEvent(Event):
    ''' The base class for all events applicable to Plot models.

    '''

    def __init__(self, model):
        from .models import Plot
        if model is not None and not isinstance(model, Plot):
            msg ='{clsname} event only applies to Plot models'
            raise ValueError(msg.format(clsname=self.__class__.__name__))
        super(PlotEvent, self).__init__(model=model)

class LODStart(PlotEvent):
    ''' Announce the start of "interactive level-of-detail" mode on a plot.

    During interactive actions such as panning or zooming, Bokeh can
    optionally, temporarily draw a reduced set of the data, in order to
    maintain high interactive rates. This is referred to as interactive
    Level-of-Detail (LOD) mode. This event fires whenever a LOD mode
    has just begun.

    '''
    event_name = 'lodstart'

class LODEnd(PlotEvent):
    ''' Announce the end of "interactive level-of-detail" mode on a plot.

    During interactive actions such as panning or zooming, Bokeh can
    optionally, temporarily draw a reduced set of the data, in order to
    maintain high interactive rates. This is referred to as interactive
    Level-of-Detail (LOD) mode. This event fires whenever a LOD mode
    has just ended.

    '''
    event_name = 'lodend'

class SelectionGeometry(PlotEvent):
    ''' Announce the coordinates of a selection event on a plot.

    Attributes:
        geometry (dict) : a dictionary containing the coordinates of the
            selection event.
        final (bool) : whether the selection event is the last selection event
            in the case of selections on every mousemove.

    '''
    event_name = "selectiongeometry"

    def __init__(self, model, geometry=None, final=True):
        self.geometry = geometry
        self.final = final
        super(SelectionGeometry, self).__init__(model=model)

class Reset(PlotEvent):
    ''' Announce a button click event on a plot ``ResetTool``.

    '''
    event_name = "reset"

    def __init__(self, model):
        super(Reset, self).__init__(model=model)

class PointEvent(PlotEvent):
    ''' Base class for UI events associated with a specific (x,y) point.

    Attributes:
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space

    Note that data space coordinates are relative to the default range, not
    any extra ranges, and the the screen space origin is at the top left of
    the HTML canvas.

    '''
    event_name = None

    def __init__(self, model, sx=None, sy=None, x=None, y=None):
        self.sx = sx
        self.sy = sy
        self.x = x
        self.y = y
        super(PointEvent, self).__init__(model=model)

class Tap(PointEvent):
    ''' Announce a tap or click event on a Bokeh plot.

    Attributes:
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space

    '''
    event_name = 'tap'

class DoubleTap(PointEvent):
    ''' Announce a double-tap or double-click event on a Bokeh plot.

    Attributes:
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space

    '''
    event_name = 'doubletap'

class Press(PointEvent):
    ''' Announce a press event on a Bokeh plot.

    Attributes:
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space

    '''
    event_name = 'press'

class MouseEnter(PointEvent):
    ''' Announce a mouse enter event onto a Bokeh plot.

    Attributes:
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space

    .. note::
        The enter event is generated when the mouse leaves the entire Plot
        canvas, including any border padding and space for axes or legends.

    '''
    event_name = 'mouseenter'

class MouseLeave(PointEvent):
    ''' Announce a mouse leave event from a Bokeh plot.

    Attributes:
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space

    .. note::
        The leave event is generated when the mouse leaves the entire Plot
        canvas, including any border padding and space for axes or legends.

    '''
    event_name = 'mouseleave'

class MouseMove(PointEvent):
    ''' Announce a mouse movement event over a Bokeh plot.

    Attributes:
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space

    .. note::
        This event can fire at a very high rate, potentially increasing network
        traffic or CPU load.

    '''
    event_name = 'mousemove'

class MouseWheel(PointEvent):
    ''' Announce a mouse wheel event on a Bokeh plot.

    Attributes:
        delta (float) : the (signed) scroll speed
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space


    .. note::
        By default, Bokeh plots do not prevent default scroll events unless a
        ``WheelZoomTool`` or ``WheelPanTool`` is active. This may change in
        future releases.

    '''
    event_name = 'wheel'

    def __init__(self, model, delta=None, **kwargs):
        self.delta = delta
        super(MouseWheel, self).__init__(model, **kwargs)

class Pan(PointEvent):
    ''' Announce a pan event on a Bokeh plot.

    Attributes:
        delta_x (float) : the amount of scroll in the x direction
        delta_y (float) : the amount of scroll in the y direction
        direction (float) : the direction of scroll (1 or -1)
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space

    '''
    event_name = 'pan'

    def __init__(self, model, delta_x=None, delta_y=None, direction=None, **kwargs):
        self.delta_x = delta_x
        self.delta_y = delta_y
        self.direction = direction
        super(Pan, self).__init__(model, **kwargs)

class PanEnd(PointEvent):
    ''' Announce the end of a pan event on a Bokeh plot.

    Attributes:
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space

    '''
    event_name = 'panend'

class PanStart(PointEvent):
    ''' Announce the start of a pan event on a Bokeh plot.

    Attributes:
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space

    '''
    event_name = 'panstart'

class Pinch(PointEvent):
    ''' Announce a pinch event on a Bokeh plot.

    Attributes:
        scale (float) : the (signed) amount of scaling
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space

    .. note::
        This event is only applicable for touch-enabled devices.

    '''
    event_name = 'pinch'

    def __init__(self, model, scale=None, **kwargs):
        self.scale = scale
        super(Pinch, self).__init__(model, **kwargs)

class PinchEnd(PointEvent):
    ''' Announce the end of a pinch event on a Bokeh plot.

    Attributes:
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space

    .. note::
        This event is only applicable for touch-enabled devices.

    '''
    event_name = 'pinchend'

class PinchStart(PointEvent):
    ''' Announce the start of a pinch event on a Bokeh plot.

    Attributes:
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space

    .. note::
        This event is only applicable for touch-enabled devices.

    '''
    event_name = 'pinchstart'

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

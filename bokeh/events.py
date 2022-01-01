#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import (
    TYPE_CHECKING,
    ClassVar,
    Dict,
    Type,
)

# External imports
from typing_extensions import Literal, TypedDict

## Bokeh imports
if TYPE_CHECKING:
    from .core.types import ID, GeometryData, Unknown
    from .model import Model
    from .models.plots import Plot
    from .models.widgets.buttons import AbstractButton

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ButtonClick',
    'DocumentEvent',
    'DocumentReady',
    'DoubleTap',
    'Event',
    'LODStart',
    'LODEnd',
    'MenuItemClick',
    'ModelEvent',
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
    'RangesUpdate',
    'Rotate',
    'RotateEnd',
    'RotateStart',
    'PlotEvent',
    'PointEvent',
    'Press',
    'PressUp',
    'Reset',
    'SelectionGeometry',
    'Tap',
)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_CONCRETE_EVENT_CLASSES: Dict[str, Type[Event]] = {}

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class EventJson(TypedDict):
    event_name: str
    event_values: Dict[str, Unknown]

class Event:
    ''' Base class for all Bokeh events.

    This base class is not typically useful to instantiate on its own.

    '''
    event_name: ClassVar[str]

    @classmethod
    def __init_subclass__(cls):
        super().__init_subclass__()

        if hasattr(cls, "event_name"):
            _CONCRETE_EVENT_CLASSES[cls.event_name] = cls

    @classmethod
    def decode_json(cls, dct: EventJson) -> Event:
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
        model_id = event_values.pop('model', {"id": None})["id"]
        event_cls = _CONCRETE_EVENT_CLASSES[event_name]
        if issubclass(event_cls, ModelEvent):
            event = event_cls(model=None, **event_values)
            event._model_id = model_id
        else:
            event = event_cls(**event_values)
        return event


class DocumentEvent(Event):
    ''' Base class for all Bokeh Document events.

    This base class is not typically useful to instantiate on its own.

    '''


class DocumentReady(DocumentEvent):
    ''' Announce when a Document is fully idle.

    '''
    event_name = 'document_ready'


class ModelEvent(Event):
    ''' Base class for all Bokeh Model events.

    This base class is not typically useful to instantiate on its own.

    '''

    _model_id: ID | None

    def __init__(self, model: Model | None) -> None:
        ''' Create a new base event.

        Args:

            model (Model) : a Bokeh model to register event callbacks on

        '''
        self._model_id = None
        if model is not None:
            self._model_id = model.id


class ButtonClick(ModelEvent):
    ''' Announce a button click event on a Bokeh button widget.

    '''
    event_name = 'button_click'

    def __init__(self, model: AbstractButton | None) -> None:
        from .models.widgets import AbstractButton
        if model is not None and not isinstance(model, AbstractButton):
            clsname = self.__class__.__name__
            raise ValueError(f"{clsname} event only applies to button models")
        super().__init__(model=model)

class MenuItemClick(ModelEvent):
    ''' Announce a button click event on a Bokeh menu item.

    '''
    event_name = 'menu_item_click'

    def __init__(self, model: Model, item: str | None = None) -> None:
        self.item = item
        super().__init__(model=model)

class PlotEvent(ModelEvent):
    ''' The base class for all events applicable to Plot models.

    '''
    def __init__(self, model: Plot | None) -> None:
        from .models import Plot
        if model is not None and not isinstance(model, Plot):
            raise ValueError(f"{self.__class__.__name__} event only applies to Plot models")
        super().__init__(model)

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

class RangesUpdate(PlotEvent):
    ''' Announce combined range updates in a single event.

    Attributes:
        x0 (float) : start x-coordinate for the default x-range
        x1 (float) : end x-coordinate for the default x-range
        y0 (float) : start x-coordinate for the default y-range
        y1 (float) : end y-coordinate for the default x-range

    Callbacks may be added to range ``start`` and ``end`` properties to respond
    to range changes, but this can result in multiple callbacks being invoked
    for a single logical operation (e.g. a pan or zoom). This event is emitted
    by supported tools when the entire range update is complete, in order to
    afford a *single* event that can be responded to.

    '''
    event_name = 'rangesupdate'

    def __init__(self, model: Plot | None, *,
            x0: float | None = None,
            x1: float | None = None,
            y0: float | None = None,
            y1: float | None = None):
        self.x0 = x0
        self.x1 = x1
        self.y0 = y0
        self.y1 = y1
        super().__init__(model=model)

class SelectionGeometry(PlotEvent):
    ''' Announce the coordinates of a selection event on a plot.

    Attributes:
        geometry (dict) : a dictionary containing the coordinates of the
            selection event.
        final (bool) : whether the selection event is the last selection event
            in the case of selections on every mousemove.

    '''
    event_name = "selectiongeometry"

    def __init__(self, model: Plot | None, geometry: GeometryData | None = None, final: bool = True) -> None:
        self.geometry = geometry
        self.final = final
        super().__init__(model=model)

class Reset(PlotEvent):
    ''' Announce a button click event on a plot ``ResetTool``.

    '''
    event_name = "reset"

    def __init__(self, model: Plot | None) -> None:
        super().__init__(model=model)

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
    def __init__(self, model: Plot | None, sx: float | None = None, sy:
            float | None = None, x: float | None = None, y: float | None = None):
        self.sx = sx
        self.sy = sy
        self.x = x
        self.y = y
        super().__init__(model=model)

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

class PressUp(PointEvent):
    ''' Announce a pressup event on a Bokeh plot.

    Attributes:
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space

    '''
    event_name = 'pressup'

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

    def __init__(self,
            model: Plot | None,
            *,
            delta: float | None = None,
            sx: float | None = None,
            sy: float | None = None,
            x: float | None = None,
            y: float | None = None):
        self.delta = delta
        super().__init__(model, sx=sx, sy=sy, x=x, y=y)

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

    def __init__(self,
            model: Plot | None,
            *,
            delta_x: float | None = None,
            delta_y: float | None = None,
            direction: Literal[-1, -1] | None = None,
            sx: float | None = None,
            sy: float | None = None,
            x: float | None = None,
            y: float | None = None):
        self.delta_x = delta_x
        self.delta_y = delta_y
        self.direction = direction
        super().__init__(model, sx=sx, sy=sy, x=x, y=y)

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

    def __init__(self,
            model: Plot | None,
            *,
            scale: float | None = None,
            sx: float | None = None,
            sy: float | None = None,
            x: float | None = None,
            y: float | None = None):
        self.scale = scale
        super().__init__(model, sx=sx, sy=sy, x=x, y=y)

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

class Rotate(PointEvent):
    ''' Announce a rotate event on a Bokeh plot.

    Attributes:
        rotation (float) : the rotation that has been done (in deg)
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space

    .. note::
        This event is only applicable for touch-enabled devices.

    '''
    event_name = 'rotate'

    def __init__(self,
            model: Plot | None,
            *,
            rotation: float | None = None,
            sx: float | None = None,
            sy: float | None = None,
            x: float | None = None,
            y: float | None = None):
        self.rotation = rotation
        super().__init__(model, sx=sx, sy=sy, x=x, y=y)

class RotateEnd(PointEvent):
    ''' Announce the end of a rotate event on a Bokeh plot.

    Attributes:
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space

    .. note::
        This event is only applicable for touch-enabled devices.

    '''
    event_name = 'rotateend'

class RotateStart(PointEvent):
    ''' Announce the start of a rotate event on a Bokeh plot.

    Attributes:
        sx (float) : x-coordinate of the event in *screen* space
        sy (float) : y-coordinate of the event in *screen* space
        x (float) : x-coordinate of the event in *data* space
        y (float) : y-coordinate of the event in *data* space

    .. note::
        This event is only applicable for touch-enabled devices.

    '''
    event_name = 'rotatestart'

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from bokeh.models import Button, Div, Plot

# Module under test
from bokeh import events # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

concrete_events = {v for v in globals().values() if isinstance(v, type) and issubclass(v, events.Event) and v.event_name is not None}
point_events = {v for v in globals().values() if isinstance(v, type) and issubclass(v, events.PointEvent)}

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class EventCallback:
    def __init__(self, attributes=[]):
        self.event_name = None
        self.attributes = attributes
        self.payload = {}

    def __call__(self, event):
        self.event_name = event.event_name
        self.payload = {attr:getattr(event, attr) for attr in self.attributes}

def test_event_metaclass() -> None:
    # All events currently in the namespace should be in the EVENT_CLASSES set
    assert len(concrete_events - set(events._CONCRETE_EVENT_CLASSES.values())) == 0

def test_common_decode_json() -> None:
    for event_name, event_cls in events._CONCRETE_EVENT_CLASSES.items():
        if event_name is None: continue # Skip abstract base class
        event = events.Event.decode_json({
            'event_name': event_cls.event_name,
            'event_values': {'model': {'id': 'test-model-id'}},
        })
        assert isinstance(event, events.Event)
        if isinstance(event, events.ModelEvent):
            assert event._model_id == 'test-model-id'

def test_pointevent_subclass_decode_json() -> None:
    event_values = dict(model_id='test-model-id', sx=3, sy=-2, x=10, y=100)
    for event_cls in point_events:
        if event_cls.event_name is None: continue # Skip abstract base class
        event = events.Event.decode_json({'event_name':  event_cls.event_name,
                                         'event_values': event_values.copy()})
        assert event.sx == 3
        assert event.sy == -2
        assert event.x == 10
        assert event.y == 100
        assert event._model_id == 'test-model-id'

def test_panevent_decode_json() -> None:
    event_values = dict(model={'id': 'test-model-id'}, delta_x=0.1, delta_y=0.3,
                        sx=3, sy=-2, x=10, y=100)
    event = events.Event.decode_json({'event_name':  events.Pan.event_name,
                                     'event_values': event_values.copy()})
    assert event.delta_x == 0.1
    assert event.delta_y == 0.3
    assert event.sx == 3
    assert event.sy == -2
    assert event.x == 10
    assert event.y == 100
    assert event._model_id == 'test-model-id'

def test_mousewheelevent_decode_json() -> None:
    event_values = dict(model={'id': 'test-model-id'}, delta=-0.1, sx=3, sy=-2, x=10, y=100)
    event = events.Event.decode_json({'event_name':  events.MouseWheel.event_name,
                                      'event_values': event_values.copy()})
    assert event.delta == -0.1
    assert event.sx == 3
    assert event.sy == -2
    assert event.x == 10
    assert event.y == 100
    assert event._model_id == 'test-model-id'

def test_pinchevent_decode_json() -> None:
    event_values = dict(model={'id': 'test-model-id'}, scale=42, sx=3, sy=-2, x=10, y=100)
    event = events.Event.decode_json({'event_name':  events.Pinch.event_name,
                                      'event_values': event_values.copy()})
    assert event.scale == 42
    assert event.sx == 3
    assert event.sy == -2
    assert event.x == 10
    assert event.y == 100
    assert event._model_id == 'test-model-id'

def test_event_constructor_button() -> None:
    model = Button()
    event = events.ModelEvent(model)
    assert event._model_id == model.id

def test_event_constructor_div() -> None:
    model = Div()
    event = events.ModelEvent(model)
    assert event._model_id == model.id

def test_event_constructor_plot() -> None:
    model = Plot()
    event = events.ModelEvent(model)
    assert event._model_id == model.id

def test_buttonclick_constructor_button() -> None:
    model = Button()
    event = events.ButtonClick(model)
    assert event._model_id == model.id

def test_buttonclick_constructor_div() -> None:
    with pytest.raises(ValueError):
        events.ButtonClick(Div())

def test_buttonclick_constructor_plot() -> None:
    with pytest.raises(ValueError):
        events.ButtonClick(Plot())

def test_lodstart_constructor_button() -> None:
    with pytest.raises(ValueError):
        events.LODStart(Button())

def test_lodstart_constructor_div() -> None:
    with pytest.raises(ValueError):
        events.LODStart(Div())

def test_lodstart_constructor_plot() -> None:
    model = Plot()
    event = events.LODStart(model)
    assert event._model_id == model.id

def test_lodend_constructor_button() -> None:
    with pytest.raises(ValueError):
        events.LODEnd(Button())

def test_lodend_constructor_div() -> None:
    with pytest.raises(ValueError):
        events.LODEnd(Div())

def test_lodend_constructor_plot() -> None:
    model = Plot()
    event = events.LODEnd(model)
    assert event._model_id == model.id


def test_plotevent_constructor_button() -> None:
    with pytest.raises(ValueError):
        events.PlotEvent(Button())

def test_plotevent_constructor_div() -> None:
    with pytest.raises(ValueError):
        events.PlotEvent(Div())

def test_plotevent_constructor_plot() -> None:
    model = Plot()
    event = events.PlotEvent(model)
    assert event._model_id == model.id

def test_pointEvent_constructor_plot() -> None:
    model = Plot()
    event = events.PointEvent(model, sx=3, sy=-2, x=10, y=100)
    assert event.sx == 3
    assert event.sy == -2
    assert event.x == 10
    assert event.y == 100
    assert event._model_id == model.id

def test_pointevent_constructor_button() -> None:
    with pytest.raises(ValueError):
        events.PointEvent(Button(), sx=3, sy=-2, x=10, y=100)

def test_pointevent_constructor_div() -> None:
    with pytest.raises(ValueError):
        events.PointEvent(Div(), sx=3, sy=-2, x=10, y=100)

def test_pointevent_subclass_constructor_plot() -> None:
    model = Plot()
    for subcls in point_events:
        event = subcls(model, sx=3, sy=-2, x=10, y=100)
        assert event.sx == 3
        assert event.sy == -2
        assert event.x == 10
        assert event.y == 100
        assert event._model_id == model.id

def test_pointevent_subclass_constructor_button() -> None:
    model = Button()
    for subcls in point_events:
        with pytest.raises(ValueError):
            subcls(model, sx=3, sy=-2, x=10, y=100)

def test_pointevent_subclass_constructor_div() -> None:
    model = Div()
    for subcls in point_events:
        with pytest.raises(ValueError):
            subcls(model, sx=3, sy=-2, x=10, y=100)

# Testing event callback invocation

def test_buttonclick_event_callbacks() -> None:
    button = Button()
    test_callback = EventCallback()
    button.on_event(events.ButtonClick, test_callback)
    assert test_callback.event_name == None
    button._trigger_event(events.ButtonClick(button))
    assert test_callback.event_name == events.ButtonClick.event_name

def test_atomic_plot_event_callbacks() -> None:
    plot = Plot()
    for event_cls in [events.LODStart, events.LODEnd]:
        test_callback = EventCallback()
        plot.on_event(event_cls, test_callback)
        assert test_callback.event_name == None
        plot._trigger_event(event_cls(plot))
        assert test_callback.event_name == event_cls.event_name


def test_pointevent_callbacks() -> None:
    plot = Plot()
    payload = dict(sx=3, sy=-2, x=10, y=100)
    for event_cls in point_events:
        test_callback = EventCallback(['sx','sy','x','y'])
        plot.on_event(event_cls, test_callback)
        assert test_callback.event_name == None
        plot._trigger_event(event_cls(plot, **payload))
        assert test_callback.event_name == event_cls.event_name
        assert test_callback.payload == payload

def test_mousewheel_callbacks() -> None:
    plot = Plot()
    payload = dict(sx=3, sy=-2, x=10, y=100, delta=5)
    test_callback = EventCallback(['sx','sy','x','y', 'delta'])
    plot.on_event(events.MouseWheel, test_callback)
    assert test_callback.event_name == None
    plot._trigger_event(events.MouseWheel(plot, **payload))
    assert test_callback.event_name == events.MouseWheel.event_name
    assert test_callback.payload == payload

def test_pan_callbacks() -> None:
    plot = Plot()
    payload = dict(sx=3, sy=-2, x=10, y=100, delta_x=2, delta_y=3.2)
    test_callback = EventCallback(['sx','sy','x','y', 'delta_x', 'delta_y'])
    plot.on_event(events.Pan, test_callback)
    assert test_callback.event_name == None
    plot._trigger_event(events.Pan(plot, **payload))
    assert test_callback.event_name == events.Pan.event_name
    assert test_callback.payload == payload

def test_pinch_callbacks() -> None:
    plot = Plot()
    payload = dict(sx=3, sy=-2, x=10, y=100, scale=42)
    test_callback = EventCallback(['sx','sy','x','y', 'scale'])
    plot.on_event(events.Pinch, test_callback)
    assert test_callback.event_name == None
    plot._trigger_event(events.Pinch(plot, **payload))
    assert test_callback.event_name == events.Pinch.event_name
    assert test_callback.payload == payload

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

import pytest

from bokeh.models import Plot, Button, Div
from bokeh.events import *


all_events = set([v for v in globals().values()
                  if isinstance(v,type) and issubclass(v, Event)])

point_events = set([v for v in globals().values()
                    if isinstance(v,type) and issubclass(v, PointEvent)])


def test_event_metaclass():
    # All events currently in the namespace should be in the EVENT_CLASSES set
    assert len(all_events - EVENT_CLASSES) == 0

def test_common_decode_json():
    for event_cls in EVENT_CLASSES:
        if event_cls.event_name is None: continue # Skip abstract base class
        event = Event.decode_json({'event_name':event_cls.event_name,
                                   'event_values':{'model_id':'test-model-id'}})
        assert event._model_id == 'test-model-id'


def test_pointevent_subclass_decode_json():
    event_values = dict(model_id='test-model-id', sx=3, sy=-2, x=10, y=100)
    for event_cls in point_events:
        if event_cls.event_name is None: continue # Skip abstract base class
        event = Event.decode_json({'event_name':  event_cls.event_name,
                                   'event_values': event_values.copy()})
        assert event.sx == 3
        assert event.sy == -2
        assert event.x == 10
        assert event.y == 100
        assert event._model_id == 'test-model-id'

def test_panevent_decode_json():
    event_values = dict(model_id='test-model-id', delta_x=0.1, delta_y=0.3,
                        sx=3, sy=-2, x=10, y=100)
    event = Event.decode_json({'event_name':  Pan.event_name,
                               'event_values': event_values.copy()})
    assert event.delta_x == 0.1
    assert event.delta_y == 0.3
    assert event.sx == 3
    assert event.sy == -2
    assert event.x == 10
    assert event.y == 100
    assert event._model_id == 'test-model-id'


def test_mousewheelevent_decode_json():
    event_values = dict(model_id='test-model-id', delta=-0.1, sx=3, sy=-2, x=10, y=100)
    event = Event.decode_json({'event_name':  MouseWheel.event_name,
                               'event_values': event_values.copy()})
    assert event.delta == -0.1
    assert event.sx == 3
    assert event.sy == -2
    assert event.x == 10
    assert event.y == 100
    assert event._model_id == 'test-model-id'


def test_pinchevent_decode_json():
    event_values = dict(model_id='test-model-id', scale=42, sx=3, sy=-2, x=10, y=100)
    event = Event.decode_json({'event_name':  Pinch.event_name,
                               'event_values': event_values.copy()})
    assert event.scale == 42
    assert event.sx == 3
    assert event.sy == -2
    assert event.x == 10
    assert event.y == 100
    assert event._model_id == 'test-model-id'


def test_Event_constructor_button():
    model = Button()
    event = Event(model)
    assert event._model_id == model._id

def test_Event_constructor_div():
    model = Div()
    event = Event(model)
    assert event._model_id == model._id

def test_Event_constructor_plot():
    model = Plot()
    event = Event(model)
    assert event._model_id == model._id

def test_ButtonClick_constructor_button():
    model = Button()
    event = ButtonClick(model)
    assert event._model_id == model._id

def test_ButtonClick_constructor_div():
    with pytest.raises(ValueError) as e:
        ButtonClick(Div())

def test_ButtonClick_constructor_plot():
    with pytest.raises(ValueError) as e:
        ButtonClick(Plot())

def test_LODStart_constructor_button():
    with pytest.raises(ValueError) as e:
        LODStart(Button())

def test_LODStart_constructor_div():
    with pytest.raises(ValueError) as e:
        LODStart(Div())

def test_LODStart_constructor_plot():
    model = Plot()
    event = LODStart(model)
    assert event._model_id == model._id

def test_LODEnd_constructor_button():
    with pytest.raises(ValueError) as e:
        LODEnd(Button())

def test_LODEnd_constructor_div():
    with pytest.raises(ValueError) as e:
        LODEnd(Div())

def test_LODEnd_constructor_plot():
    model = Plot()
    event = LODEnd(model)
    assert event._model_id == model._id


def test_PlotEvent_constructor_button():
    with pytest.raises(ValueError) as e:
        PlotEvent(Button())

def test_PlotEvent_constructor_div():
    with pytest.raises(ValueError) as e:
        PlotEvent(Div())

def test_PlotEvent_constructor_plot():
    model = Plot()
    event = PlotEvent(model)
    assert event._model_id == model._id

def test_PointEvent_constructor_plot():
    model = Plot()
    event = PointEvent(model, sx=3, sy=-2, x=10, y=100)
    assert event.sx == 3
    assert event.sy == -2
    assert event.x == 10
    assert event.y == 100
    assert event._model_id == model._id

def test_PointEvent_constructor_button():
    with pytest.raises(ValueError) as e:
        PointEvent(Button(), sx=3, sy=-2, x=10, y=100)

def test_PointEvent_constructor_div():
    with pytest.raises(ValueError) as e:
        PointEvent(Div(), sx=3, sy=-2, x=10, y=100)

def test_PointEvent_subclass_constructor_plot():
    model = Plot()
    for subcls in point_events:
        event = subcls(model, sx=3, sy=-2, x=10, y=100)
        assert event.sx == 3
        assert event.sy == -2
        assert event.x == 10
        assert event.y == 100
        assert event._model_id == model._id

def test_PointEvent_subclass_constructor_button():
    model = Button()
    for subcls in point_events:
        with pytest.raises(ValueError) as e:
            subcls(model, sx=3, sy=-2, x=10, y=100)

def test_PointEvent_subclass_constructor_div():
    model = Div()
    for subcls in point_events:
        with pytest.raises(ValueError) as e:
            subcls(model, sx=3, sy=-2, x=10, y=100)


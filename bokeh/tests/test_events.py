import pytest

from bokeh.models import Plot, Button, Div
from bokeh import events

all_events = set([v for v in globals().values()
                  if isinstance(v,type) and issubclass(v, events.Event)])

point_events = set([v for v in globals().values()
                    if isinstance(v,type) and issubclass(v, events.PointEvent)])

class TestCallback(object):
    def __init__(self, attributes=[]):
        self.event_name = None
        self.attributes = attributes
        self.payload = {}

    def __call__(self, event):
        self.event_name = event.event_name
        self.payload = {attr:getattr(event, attr) for attr in self.attributes}


def test_event_metaclass():
    # All events currently in the namespace should be in the EVENT_CLASSES set
    assert len(all_events - events.EVENT_CLASSES) == 0

def test_common_decode_json():
    for event_cls in events.EVENT_CLASSES:
        if event_cls.event_name is None: continue # Skip abstract base class
        event = events.Event.decode_json({'event_name':event_cls.event_name,
                                          'event_values':{'model_id':'test-model-id'}})
        assert event._model_id == 'test-model-id'


def test_pointevent_subclass_decode_json():
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

def test_panevent_decode_json():
    event_values = dict(model_id='test-model-id', delta_x=0.1, delta_y=0.3,
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

def test_mousewheelevent_decode_json():
    event_values = dict(model_id='test-model-id', delta=-0.1, sx=3, sy=-2, x=10, y=100)
    event = events.Event.decode_json({'event_name':  events.MouseWheel.event_name,
                                      'event_values': event_values.copy()})
    assert event.delta == -0.1
    assert event.sx == 3
    assert event.sy == -2
    assert event.x == 10
    assert event.y == 100
    assert event._model_id == 'test-model-id'

def test_pinchevent_decode_json():
    event_values = dict(model_id='test-model-id', scale=42, sx=3, sy=-2, x=10, y=100)
    event = events.Event.decode_json({'event_name':  events.Pinch.event_name,
                                      'event_values': event_values.copy()})
    assert event.scale == 42
    assert event.sx == 3
    assert event.sy == -2
    assert event.x == 10
    assert event.y == 100
    assert event._model_id == 'test-model-id'

def test_event_constructor_button():
    model = Button()
    event = events.Event(model)
    assert event._model_id == model._id

def test_event_constructor_div():
    model = Div()
    event = events.Event(model)
    assert event._model_id == model._id

def test_event_constructor_plot():
    model = Plot()
    event = events.Event(model)
    assert event._model_id == model._id

def test_buttonclick_constructor_button():
    model = Button()
    event = events.ButtonClick(model)
    assert event._model_id == model._id

def test_buttonclick_constructor_div():
    with pytest.raises(ValueError):
        events.ButtonClick(Div())

def test_buttonclick_constructor_plot():
    with pytest.raises(ValueError):
        events.ButtonClick(Plot())

def test_lodstart_constructor_button():
    with pytest.raises(ValueError):
        events.LODStart(Button())

def test_lodstart_constructor_div():
    with pytest.raises(ValueError):
        events.LODStart(Div())

def test_lodstart_constructor_plot():
    model = Plot()
    event = events.LODStart(model)
    assert event._model_id == model._id

def test_lodend_constructor_button():
    with pytest.raises(ValueError):
        events.LODEnd(Button())

def test_lodend_constructor_div():
    with pytest.raises(ValueError):
        events.LODEnd(Div())

def test_lodend_constructor_plot():
    model = Plot()
    event = events.LODEnd(model)
    assert event._model_id == model._id


def test_plotevent_constructor_button():
    with pytest.raises(ValueError):
        events.PlotEvent(Button())

def test_plotevent_constructor_div():
    with pytest.raises(ValueError):
        events.PlotEvent(Div())

def test_plotevent_constructor_plot():
    model = Plot()
    event = events.PlotEvent(model)
    assert event._model_id == model._id

def test_pointEvent_constructor_plot():
    model = Plot()
    event = events.PointEvent(model, sx=3, sy=-2, x=10, y=100)
    assert event.sx == 3
    assert event.sy == -2
    assert event.x == 10
    assert event.y == 100
    assert event._model_id == model._id

def test_pointevent_constructor_button():
    with pytest.raises(ValueError):
        events.PointEvent(Button(), sx=3, sy=-2, x=10, y=100)

def test_pointevent_constructor_div():
    with pytest.raises(ValueError):
        events.PointEvent(Div(), sx=3, sy=-2, x=10, y=100)

def test_pointevent_subclass_constructor_plot():
    model = Plot()
    for subcls in point_events:
        event = subcls(model, sx=3, sy=-2, x=10, y=100)
        assert event.sx == 3
        assert event.sy == -2
        assert event.x == 10
        assert event.y == 100
        assert event._model_id == model._id

def test_pointevent_subclass_constructor_button():
    model = Button()
    for subcls in point_events:
        with pytest.raises(ValueError):
            subcls(model, sx=3, sy=-2, x=10, y=100)

def test_pointevent_subclass_constructor_div():
    model = Div()
    for subcls in point_events:
        with pytest.raises(ValueError):
            subcls(model, sx=3, sy=-2, x=10, y=100)

import bokeh.transform as bt

from bokeh.models import CategoricalColorMapper, Dodge, FactorRange, Jitter, LinearColorMapper, LogColorMapper

def test_transform():
    t = bt.transform("foo", "junk")
    assert t == dict(field="foo", transform="junk")

def test_dodge():
    t = bt.dodge("foo", 0.5)
    assert isinstance(t, dict)
    assert set(t) == {"field", "transform"}
    assert t['field'] == "foo"
    assert isinstance(t['transform'], Dodge)
    assert t['transform'].value == 0.5
    assert t['transform'].range is None

def test_dodge_with_range():
    r = FactorRange("a")
    t = bt.dodge("foo", 0.5, range=r)
    assert isinstance(t, dict)
    assert set(t) == {"field", "transform"}
    assert t['field'] == "foo"
    assert isinstance(t['transform'], Dodge)
    assert t['transform'].value == 0.5
    assert t['transform'].range is r
    assert t['transform'].range.factors == ["a"]

def test_jitter_defaults():
    t = bt.jitter("foo", width=0.5)
    assert isinstance(t, dict)
    assert set(t) == {"field", "transform"}
    assert t['field'] == "foo"
    assert isinstance(t['transform'], Jitter)
    assert t['transform'].width == 0.5
    assert t['transform'].mean == 0
    assert t['transform'].distribution == "uniform"
    assert t['transform'].range is None

def test_jitter():
    t = bt.jitter("foo", width=0.5, mean=0.1, distribution="normal")
    assert isinstance(t, dict)
    assert set(t) == {"field", "transform"}
    assert t['field'] == "foo"
    assert isinstance(t['transform'], Jitter)
    assert t['transform'].width == 0.5
    assert t['transform'].mean == 0.1
    assert t['transform'].distribution == "normal"
    assert t['transform'].range is None

def test_jitter_with_range():
    r = FactorRange("a")
    t = bt.jitter("foo", width=0.5, mean=0.1, range=r)
    assert isinstance(t, dict)
    assert set(t) == {"field", "transform"}
    assert t['field'] == "foo"
    assert isinstance(t['transform'], Jitter)
    assert t['transform'].width == 0.5
    assert t['transform'].mean == 0.1
    assert t['transform'].distribution == "uniform"
    assert t['transform'].range is r
    assert t['transform'].range.factors == ["a"]

def test_factor_cmap_defaults():
    t = bt.factor_cmap("foo", ["red", "green"], ["foo", "bar"])
    assert isinstance(t, dict)
    assert set(t) == {"field", "transform"}
    assert t['field'] == "foo"
    assert isinstance(t['transform'], CategoricalColorMapper)
    assert t['transform'].palette == ["red", "green"]
    assert t['transform'].factors == ["foo", "bar"]
    assert t['transform'].start == 0
    assert t['transform'].end is None
    assert t['transform'].nan_color == "gray"

def test_factor_cmap():
    t = bt.factor_cmap("foo", ["red", "green"], ["foo", "bar"], start=1, end=2, nan_color="pink")
    assert isinstance(t, dict)
    assert set(t) == {"field", "transform"}
    assert t['field'] == "foo"
    assert isinstance(t['transform'], CategoricalColorMapper)
    assert t['transform'].palette == ["red", "green"]
    assert t['transform'].factors == ["foo", "bar"]
    assert t['transform'].start == 1
    assert t['transform'].end is 2
    assert t['transform'].nan_color == "pink"

def test_linear_cmap_defaults():
    t = bt.linear_cmap("foo", ["red", "green"], 0, 10)
    assert isinstance(t, dict)
    assert set(t) == {"field", "transform"}
    assert t['field'] == "foo"
    assert isinstance(t['transform'], LinearColorMapper)
    assert t['transform'].palette == ["red", "green"]
    assert t['transform'].low == 0
    assert t['transform'].high is 10
    assert t['transform'].low_color is None
    assert t['transform'].high_color is None
    assert t['transform'].nan_color == "gray"

def test_linear_cmap():
    t = bt.linear_cmap("foo", ["red", "green"], 0, 10, low_color="orange", high_color="blue", nan_color="pink")
    assert isinstance(t, dict)
    assert set(t) == {"field", "transform"}
    assert t['field'] == "foo"
    assert isinstance(t['transform'], LinearColorMapper)
    assert t['transform'].palette == ["red", "green"]
    assert t['transform'].low == 0
    assert t['transform'].high is 10
    assert t['transform'].low_color == "orange"
    assert t['transform'].high_color == "blue"
    assert t['transform'].nan_color == "pink"

def test_log_cmap_defaults():
    t = bt.log_cmap("foo", ["red", "green"], 0, 10)
    assert isinstance(t, dict)
    assert set(t) == {"field", "transform"}
    assert t['field'] == "foo"
    assert isinstance(t['transform'], LogColorMapper)
    assert t['transform'].palette == ["red", "green"]
    assert t['transform'].low == 0
    assert t['transform'].high is 10
    assert t['transform'].low_color is None
    assert t['transform'].high_color is None
    assert t['transform'].nan_color == "gray"

def test_log_cmap():
    t = bt.log_cmap("foo", ["red", "green"], 0, 10, low_color="orange", high_color="blue", nan_color="pink")
    assert isinstance(t, dict)
    assert set(t) == {"field", "transform"}
    assert t['field'] == "foo"
    assert isinstance(t['transform'], LogColorMapper)
    assert t['transform'].palette == ["red", "green"]
    assert t['transform'].low == 0
    assert t['transform'].high is 10
    assert t['transform'].low_color == "orange"
    assert t['transform'].high_color == "blue"
    assert t['transform'].nan_color == "pink"

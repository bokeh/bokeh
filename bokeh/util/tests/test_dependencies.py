import pytest
import bokeh.util.dependencies as dep

def test_optional_success():
    assert dep.optional('sys') is not None

def test_optional_fail():
    assert dep.optional('bleepbloop') is None

def test_required_success():
    assert dep.required('sys', 'yep') is not None

def test_required_fail():
    with pytest.raises(RuntimeError) as excinfo:
        dep.required('bleepbloop', 'nope')
    assert 'nope' in str(excinfo.value)

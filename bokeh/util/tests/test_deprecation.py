import pytest
from mock import patch
import bokeh.util.deprecation as dep

def foo(): pass

def test_bad_arg_type():
    for x in [10, True, foo, [], (), {}]:
        with pytest.raises(ValueError):
            dep.deprecated(x)

@patch('warnings.warn')
def test_message(mock_warn):
    dep.deprecated('test')
    assert mock_warn.called
    assert mock_warn.call_args[0] == ("test", dep.BokehDeprecationWarning)
    assert mock_warn.call_args[1] == {'stacklevel': 2}

def test_message_no_extra_args():
    with pytest.raises(ValueError):
        dep.deprecated('test', 'foo')
    with pytest.raises(ValueError):
        dep.deprecated('test', old='foo')
    with pytest.raises(ValueError):
        dep.deprecated('test', new='foo')
    with pytest.raises(ValueError):
        dep.deprecated('test', extra='foo')

def test_since_missing_extra_args():
    with pytest.raises(ValueError):
        dep.deprecated((1,2,3))
    with pytest.raises(ValueError):
        dep.deprecated((1,2,3), old="foo")
    with pytest.raises(ValueError):
        dep.deprecated((1,2,3), new="foo")

def test_since_bad_tuple():
    with pytest.raises(ValueError):
        dep.deprecated((1,), old="foo", new="bar")
    with pytest.raises(ValueError):
        dep.deprecated((1,2), old="foo", new="bar")
    with pytest.raises(ValueError):
        dep.deprecated((1,2,3,4), old="foo", new="bar")
    with pytest.raises(ValueError):
        dep.deprecated((1,2,-4), old="foo", new="bar")
    with pytest.raises(ValueError):
        dep.deprecated((1,2,"3"), old="foo", new="bar")

@patch('warnings.warn')
def test_since(mock_warn):
    dep.deprecated((1,2,3), old="foo", new="bar")
    assert mock_warn.called
    assert mock_warn.call_args[0] == ("foo was deprecated in Bokeh 1.2.3 and will be removed, use bar instead.", dep.BokehDeprecationWarning)
    assert mock_warn.call_args[1] == {'stacklevel': 2}

@patch('warnings.warn')
def test_since_with_extra(mock_warn):
    dep.deprecated((1,2,3), old="foo", new="bar", extra="baz")
    assert mock_warn.called
    assert mock_warn.call_args[0] == ("foo was deprecated in Bokeh 1.2.3 and will be removed, use bar instead. baz", dep.BokehDeprecationWarning)
    assert mock_warn.call_args[1] == {'stacklevel': 2}

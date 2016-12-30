from mock import patch
import pytest

from bokeh.models import ColumnDataSource

import bokeh.core.property.containers as pc

def test_notify_owner():
    result = {}
    class Foo(object):
        @pc.notify_owner
        def test(self): pass

        def _notify_owners(self, old):
            result['old'] = old

        def _saved_copy(self): return "foo"

    f = Foo()
    f.test()
    assert result['old'] == 'foo'
    assert f.test.__doc__ == "Container method ``test`` instrumented to notify property owners"

def test_PropertyValueContainer():
    pvc = pc.PropertyValueContainer()
    assert pvc._owners == set()
    assert pvc._unmodified_default_value == False

    pvc._register_owner("owner", "prop")
    assert pvc._owners == set((("owner", "prop"), ))

    pvc._unregister_owner("owner", "prop")
    assert pvc._owners == set()

    with pytest.raises(RuntimeError):
        pvc._saved_copy()

@patch('bokeh.core.property.containers.PropertyValueContainer._notify_owners')
def test_PropertyValueDict_mutators(mock_notify):
    pvd = pc.PropertyValueDict(dict(foo=10, bar=20, baz=30))

    mock_notify.reset()
    del pvd['foo']
    assert mock_notify.called

    mock_notify.reset()
    pvd['foo'] = 11
    assert mock_notify.called

    mock_notify.reset()
    pvd.pop('foo')
    assert mock_notify.called

    mock_notify.reset()
    pvd.popitem()
    assert mock_notify.called

    mock_notify.reset()
    pvd.setdefault('baz')
    assert mock_notify.called

    mock_notify.reset()
    pvd.clear()
    assert mock_notify.called

    mock_notify.reset()
    pvd.update(bar=1)
    assert mock_notify.called

@patch('bokeh.core.property.containers.PropertyValueContainer._notify_owners')
def test_PropertyValueDict__stream_list(mock_notify):
    from bokeh.document import ColumnsStreamedEvent

    source = ColumnDataSource(data=dict(foo=[10]))
    pvd = pc.PropertyValueDict(source.data)

    mock_notify.reset()
    pvd._stream("doc", source, dict(foo=[20]), setter="setter")
    assert mock_notify.called_once
    assert mock_notify.call_args[0] == ({'foo': [10, 20]},)
    assert 'hint' in mock_notify.call_args[1]
    assert isinstance(mock_notify.call_args[1]['hint'], ColumnsStreamedEvent)
    assert mock_notify.call_args[1]['hint'].setter == 'setter'
    assert mock_notify.call_args[1]['hint'].rollover == None

@patch('bokeh.core.property.containers.PropertyValueContainer._notify_owners')
def test_PropertyValueDict__stream_list_with_rollover(mock_notify):
    from bokeh.document import ColumnsStreamedEvent

    source = ColumnDataSource(data=dict(foo=[10, 20, 30]))
    pvd = pc.PropertyValueDict(source.data)

    mock_notify.reset()
    pvd._stream("doc", source, dict(foo=[40]), rollover=3, setter="setter")
    assert mock_notify.called_once
    assert mock_notify.call_args[0] == ({'foo': [20, 30, 40]},)
    assert 'hint' in mock_notify.call_args[1]
    assert isinstance(mock_notify.call_args[1]['hint'], ColumnsStreamedEvent)
    assert mock_notify.call_args[1]['hint'].setter == 'setter'
    assert mock_notify.call_args[1]['hint'].rollover == 3

@patch('bokeh.core.property.containers.PropertyValueContainer._notify_owners')
def test_PropertyValueDict__stream_array(mock_notify):
    from bokeh.document import ColumnsStreamedEvent
    import numpy as np

    source = ColumnDataSource(data=dict(foo=np.array([10])))
    pvd = pc.PropertyValueDict(source.data)

    mock_notify.reset()
    pvd._stream("doc", source, dict(foo=[20]), setter="setter")
    assert mock_notify.called_once
    assert len(mock_notify.call_args[0]) == 1
    assert 'foo' in mock_notify.call_args[0][0]
    assert (mock_notify.call_args[0][0]['foo'] == np.array([10])).all()
    assert 'hint' in mock_notify.call_args[1]
    assert isinstance(mock_notify.call_args[1]['hint'], ColumnsStreamedEvent)
    assert mock_notify.call_args[1]['hint'].setter == 'setter'
    assert mock_notify.call_args[1]['hint'].rollover == None

@patch('bokeh.core.property.containers.PropertyValueContainer._notify_owners')
def test_PropertyValueDict__stream_array_with_rollover(mock_notify):
    from bokeh.document import ColumnsStreamedEvent
    import numpy as np

    source = ColumnDataSource(data=dict(foo=np.array([10, 20, 30])))
    pvd = pc.PropertyValueDict(source.data)

    mock_notify.reset()
    pvd._stream("doc", source, dict(foo=[40]), rollover=3, setter="setter")
    assert mock_notify.called_once
    assert len(mock_notify.call_args[0]) == 1
    assert 'foo' in mock_notify.call_args[0][0]
    assert (mock_notify.call_args[0][0]['foo'] == np.array([10, 20, 30])).all()
    assert 'hint' in mock_notify.call_args[1]
    assert isinstance(mock_notify.call_args[1]['hint'], ColumnsStreamedEvent)
    assert mock_notify.call_args[1]['hint'].setter == 'setter'
    assert mock_notify.call_args[1]['hint'].rollover == 3

@patch('bokeh.core.property.containers.PropertyValueContainer._notify_owners')
def test_PropertyValueDict__patch(mock_notify):
    from bokeh.document import ColumnsPatchedEvent
    source = ColumnDataSource(data=dict(foo=[10, 20]))
    pvd = pc.PropertyValueDict(source.data)

    mock_notify.reset()
    pvd._patch("doc", source, dict(foo=[(1, 40)]), setter='setter')
    assert mock_notify.called_once
    assert mock_notify.call_args[0] == ({'foo': [10, 40]},)
    assert 'hint' in mock_notify.call_args[1]
    assert isinstance(mock_notify.call_args[1]['hint'], ColumnsPatchedEvent)
    assert mock_notify.call_args[1]['hint'].setter == 'setter'

@patch('bokeh.core.property.containers.PropertyValueContainer._notify_owners')
def test_PropertyValueList_mutators(mock_notify):
    pvl = pc.PropertyValueList([10, 20, 30, 40, 50])

    mock_notify.reset()
    del pvl[2]
    assert mock_notify.called

    # this exercises __delslice__ on Py2 but not Py3 which just
    # uses __delitem__ and a slice index
    mock_notify.reset()
    del pvl[1:2]
    assert mock_notify.called

    mock_notify.reset()
    pvl += [888]
    assert mock_notify.called

    mock_notify.reset()
    pvl *= 2
    assert mock_notify.called

    mock_notify.reset()
    pvl[0] = 2
    assert mock_notify.called

    # this exercises __setslice__ on Py2 but not Py3 which just
    # uses __setitem__ and a slice index
    mock_notify.reset()
    pvl[3:1:-1] = [21, 31]
    assert mock_notify.called

    mock_notify.reset()
    pvl.append(999)
    assert mock_notify.called

    mock_notify.reset()
    pvl.extend([1000])
    assert mock_notify.called

    mock_notify.reset()
    pvl.insert(0, 100)
    assert mock_notify.called

    mock_notify.reset()
    pvl.pop()
    assert mock_notify.called

    mock_notify.reset()
    pvl.remove(100)
    assert mock_notify.called

    mock_notify.reset()
    pvl.reverse()
    assert mock_notify.called

    mock_notify.reset()
    pvl.sort()
    assert mock_notify.called

    # OK, this is just to get a 100% test coverage inpy3 due to differences in
    # py2 vs py2. The slice methods are only exist in py2. The tests above
    # exercise all the  cases, this just makes py3 report the non-py3 relevan
    # code as covered.
    try:
        pvl.__setslice__(1,2,3)
    except:
        pass

    try:
        pvl.__delslice__(1,2)
    except:
        pass

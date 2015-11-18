import pytest
import bokeh.util.dependencies as dep

def test_optional_success():
    ''' Check that optional dep is found

    '''
    assert dep.optional('sys') is not None

def test_optional_fail():
    ''' Check that, if optional dep is missing, the script continues
    as normal

    '''
    assert dep.optional('bleepbloop') is None

def test_required_success():
    ''' Check that required dep is found

    '''
    assert dep.required('sys', 'yep') is not None

def test_required_fail():
    ''' Check that, if required dep is not found, a
    RuntimeError is raised with the given error message
    '''

    with pytest.raises(RuntimeError) as excinfo:
        dep.required('bleepbloop', 'nope')
    assert 'nope' in str(excinfo.value)

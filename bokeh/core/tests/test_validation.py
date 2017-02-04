from mock import patch
import bokeh.core.validation as v

from bokeh.core.validation.errors import codes as ec
from bokeh.core.validation.warnings import codes as wc

from bokeh.model import Model
from bokeh.core.properties import Int

def test_error_decorator_code():
    for code in ec:
        @v.error(code)
        def good():
            return None
        assert good() == []

        @v.error(code)
        def bad():
            return "bad"
        assert bad() == [(code,) + ec[code] + ('bad',)]

def test_warning_decorator_code():
    for code in wc:
        @v.warning(code)
        def good():
            return None
        assert good() == []

        @v.warning(code)
        def bad():
            return "bad"
        assert bad() == [(code,) + wc[code] + ('bad',)]

def test_error_decorator_custom():
    @v.error("E1")
    def good():
        return None
    assert good() == []

    @v.error("E2")
    def bad():
        return "bad"
    assert bad() == [(9999, 'EXT:E2', 'Custom extension reports error', 'bad')]

def test_warning_decorator_custom():
    @v.warning("W1")
    def good():
        return None
    assert good() == []

    @v.warning("W2")
    def bad():
        return "bad"
    assert bad() == [ (9999, 'EXT:W2', 'Custom extension reports warning', 'bad')]

class Mod(Model):

    foo = Int(default=0)

    @v.error("E")
    def _check_error(self):
        if self.foo > 5: return "err"

    @v.warning("W")
    def _check_warning(self):
        if self.foo < -5: return "wrn"

@patch('bokeh.core.validation.check.logger.error')
@patch('bokeh.core.validation.check.logger.warning')
def test_check_pass(mock_warn, mock_error):
    m = Mod()

    v.check_integrity([m])
    assert not mock_error.called
    assert not mock_warn.called

@patch('bokeh.core.validation.check.logger.error')
@patch('bokeh.core.validation.check.logger.warning')
def test_check_error(mock_warn, mock_error):
    m = Mod(foo=10)
    v.check_integrity([m])
    assert mock_error.called
    assert not mock_warn.called

@patch('bokeh.core.validation.check.logger.error')
@patch('bokeh.core.validation.check.logger.warning')
def test_check_warn(mock_warn, mock_error):
    m = Mod(foo=-10)
    v.check_integrity([m])
    assert not mock_error.called
    assert mock_warn.called

from mock import MagicMock
import pytest

import bokeh.command.subcommand as sc

class _Bad(sc.Subcommand): pass
class _Good(sc.Subcommand):
    def invoke(self, args): pass

def test_is_abstract():
    with pytest.raises(TypeError):
        _Bad()

def test_missing_args():
    p = MagicMock()
    _Good(p)
    p.add_argument.assert_not_called()

def test_no_args():
    _Good.args = ()
    p = MagicMock()
    _Good(p)
    p.add_argument.assert_not_called()

def test_one_arg():
    _Good.args = (('foo', dict(a=1, b=2)),)
    p = MagicMock()
    _Good(p)
    p.add_argument.assert_called_once_with('foo', **dict(a=1, b=2))

def test_args():
    _Good.args = (('foo', dict(a=1, b=2)),('bar', dict(a=3, b=4)))
    p = MagicMock()
    _Good(p)
    p.call_count == 2

def test_base_invoke():
    with pytest.raises(NotImplementedError):
        p = MagicMock()
        obj = _Good(p)
        super(_Good, obj).invoke("foo")

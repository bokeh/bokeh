import tempfile

import pytest

import bokeh.command.util as util

def test_die(capsys):
    with pytest.raises(SystemExit):
        util.die("foo")
    out, err = capsys.readouterr()
    assert err == "foo\n"
    assert out == ""

def test_build_single_handler_application_unknown_file():
    with pytest.raises(ValueError):
        f = tempfile.NamedTemporaryFile(suffix=".bad")
        util.build_single_handler_application(f.name)

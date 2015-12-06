

import pytest

import bokeh.command.util as util

def test_die(capsys):
    with pytest.raises(SystemExit):
        util.die("foo")
    out, err = capsys.readouterr()
    assert err == "foo\n"
    assert out == ""


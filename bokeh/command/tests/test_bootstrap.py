import pytest

from bokeh.command.bootstrap import main
from bokeh import __version__

def test_no_subcommand(capsys):
    with pytest.raises(SystemExit):
        main(["bokeh"])
    out, err = capsys.readouterr()
    assert err == "ERROR: Must specify subcommand, one of: html, json or serve\n"
    assert out == ""

def test_version(capsys):
    with pytest.raises(SystemExit):
        main(["bokeh", "--version"])
    out, err = capsys.readouterr()
    assert err == ("%s\n" % __version__)
    assert out == ""

def test_version_short(capsys):
    with pytest.raises(SystemExit):
        main(["bokeh", "-v"])
    out, err = capsys.readouterr()
    assert err == ("%s\n" % __version__)
    assert out == ""

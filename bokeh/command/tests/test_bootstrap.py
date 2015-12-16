import pytest

from bokeh.command.bootstrap import main

def test_no_subcommand(capsys):
    with pytest.raises(SystemExit):
        main(["bokeh"])
    out, err = capsys.readouterr()
    assert err == "ERROR: Must specify subcommand, one of: html, json or serve\n"
    assert out == ""

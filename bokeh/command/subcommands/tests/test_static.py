from __future__ import absolute_import

import bokeh.command.subcommands.static as scstatic
from bokeh.command.bootstrap import main

def test_create():
    import argparse
    from bokeh.command.subcommand import Subcommand

    obj = scstatic.Static(parser=argparse.ArgumentParser())
    assert isinstance(obj, Subcommand)

def test_name():
    assert scstatic.Static.name == "static"

def test_help():
    assert scstatic.Static.help == "output the locations of BokehJS static files"

def test_args():
    assert scstatic.Static.args == (
    )

def test_run(capsys):
    main(["bokeh", "static"])
    out, err = capsys.readouterr()
    assert err == ""
    assert out.endswith('/bokeh/server/static\n')

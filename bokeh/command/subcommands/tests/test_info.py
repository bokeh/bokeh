from __future__ import absolute_import

import bokeh.command.subcommands.info as scinfo
from bokeh.command.bootstrap import main

def test_create():
    import argparse
    from bokeh.command.subcommand import Subcommand

    obj = scinfo.Info(parser=argparse.ArgumentParser())
    assert isinstance(obj, Subcommand)

def test_name():
    assert scinfo.Info.name == "info"

def test_help():
    assert scinfo.Info.help == "output the locations of BokehJS static files"

def test_args():
    assert scinfo.Info.args == (
    )

def test_run(capsys):
    main(["bokeh", "info"])
    out, err = capsys.readouterr()
    assert err == ""
    assert out.endswith('/bokeh/server/static\n')

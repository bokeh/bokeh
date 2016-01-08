from __future__ import absolute_import

import bokeh.command.subcommands.sampledata as scsample
from bokeh.command.bootstrap import main

def test_create():
    import argparse
    from bokeh.command.subcommand import Subcommand

    obj = scsample.Sampledata(parser=argparse.ArgumentParser())
    assert isinstance(obj, Subcommand)

def test_name():
    assert scsample.Sampledata.name == "sampledata"

def test_help():
    assert scsample.Sampledata.help == "Download the bokeh sample data sets"

def test_args():
    assert scsample.Sampledata.args == (
    )

def test_run(capsys):
    main(["bokeh", "sampledata"])
    out, err = capsys.readouterr()
    assert err == ""
    assert out.endswith('/bokeh/server/static\n')

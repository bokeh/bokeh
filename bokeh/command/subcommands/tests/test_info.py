from __future__ import absolute_import

from os.path import join

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
    assert scinfo.Info.help == "print information about Bokeh and Bokeh server configuration"

def test_args():
    assert scinfo.Info.args == (
        ('--static', dict(
            action='store_true',
            help="Print the locations of BokehJS static files",
        )),
    )

def test_run(capsys):
    main(["bokeh", "info"])
    out, err = capsys.readouterr()
    lines = out.split("\n")
    assert len(lines) == 7
    assert lines[0].startswith("Python version")
    assert lines[1].startswith("IPython version")
    assert lines[2].startswith("Bokeh version")
    assert lines[3].startswith("BokehJS static")
    assert lines[4].startswith("node.js version")
    assert lines[5].startswith("npm version")
    assert lines[6] == ""
    assert err == ""

def test_run_static(capsys):
    main(["bokeh", "info", "--static"])
    out, err = capsys.readouterr()
    assert err == ""
    assert out.endswith(join('bokeh', 'server', 'static') + '\n')

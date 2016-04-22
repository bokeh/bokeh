from __future__ import absolute_import

import bokeh.command.subcommands.secret as scsecret
from bokeh.command.bootstrap import main

def test_create():
    import argparse
    from bokeh.command.subcommand import Subcommand

    obj = scsecret.Secret(parser=argparse.ArgumentParser())
    assert isinstance(obj, Subcommand)

def test_name():
    assert scsecret.Secret.name == "secret"

def test_help():
    assert scsecret.Secret.help == "Create a Bokeh secret key for use with Bokeh server"

def test_args():
    assert scsecret.Secret.args == (
    )

def test_run(capsys):
    main(["bokeh", "secret"])
    out, err = capsys.readouterr()
    assert err == ""
    assert len(out) == 45
    assert out[-1] == '\n'

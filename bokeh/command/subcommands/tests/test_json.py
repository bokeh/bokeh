from __future__ import absolute_import

import bokeh.command.subcommands.json as scjson

def test_create():
    import argparse
    from bokeh.command.subcommand import Subcommand

    obj = scjson.JSON(parser=argparse.ArgumentParser())
    assert isinstance(obj, Subcommand)

def test_name():
    assert scjson.JSON.name == "json"

def test_help():
    assert scjson.JSON.help == "Emit serialized JSON for one application"

def test_args():
    assert scjson.JSON.args == (

        ('file', dict(
            metavar='DIRECTORY-OR-SCRIPT',
            help="The app directory or script to generate JSON for",
            default=None
        )),

        ('--indent', dict(
            metavar='LEVEL',
            type=int,
            help="indentation to use when printing",
            default=None
        )),

    )





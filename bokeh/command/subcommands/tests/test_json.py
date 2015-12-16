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
    assert scjson.JSON.help == "Create JSON files for one or more applications"

def test_args():
    assert scjson.JSON.args == (

        ('files', dict(
            metavar='DIRECTORY-OR-SCRIPT',
            nargs='+',
            help="The app directories or scripts to generate JSON for",
            default=None
        )),

        ('--indent', dict(
            metavar='LEVEL',
            type=int,
            help="indentation to use when printing",
            default=None
        )),

        (('-o', '--output'), dict(
                metavar='FILENAME',
                action='append',
                type=str,
                help="Name of the output file or - for standard output."
        )),
    )





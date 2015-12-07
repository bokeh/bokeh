from __future__ import absolute_import

import bokeh.command.subcommands.html as schtml

def test_create():
    import argparse
    from bokeh.command.subcommand import Subcommand

    obj = schtml.HTML(parser=argparse.ArgumentParser())
    assert isinstance(obj, Subcommand)

def test_name():
    assert schtml.HTML.name == "html"

def test_help():
    assert schtml.HTML.help == "Create standalone HTML files for one or more applications"

def test_args():
    assert schtml.HTML.args == (

        ('files', dict(
            metavar='DIRECTORY-OR-SCRIPT',
            nargs='+',
            help="The app directories or scripts to generate HTML for",
            default=None,
        )),

        (
            '--show', dict(
            action='store_true',
            help="Open generated file(s) in a browser"
        )),

    )






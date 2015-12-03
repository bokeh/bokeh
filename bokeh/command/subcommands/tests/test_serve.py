from __future__ import absolute_import

import bokeh.command.subcommands.serve as scserve

def test_create():
    import argparse
    from bokeh.command.subcommand import Subcommand

    obj = scserve.Serve(parser=argparse.ArgumentParser())
    assert isinstance(obj, Subcommand)

def test_default_port():
    assert scserve.DEFAULT_PORT == 5006

def test_loglevels():
    assert scserve.LOGLEVELS == ('debug', 'info', 'warning', 'error', 'critical')

def test_name():
    assert scserve.Serve.name == "serve"

def test_help():
    assert scserve.Serve.help == "Run a Bokeh server hosting one or more applications"

def test_args():
    from bokeh.util.string import nice_join

    assert scserve.Serve.args == (

        ('files', dict(
            metavar='DIRECTORY-OR-SCRIPT',
            nargs='*',
            help="The app directories or scripts to serve (serve empty document if not specified)",
            default=None,
        )),

        ('--develop', dict(
            action='store_true',
            help="Enable develop-time features that should not be used in production",
        )),

        ('--show', dict(
            action='store_true',
            help="Open server app(s) in a browser",
        )),

        ('--port', dict(
            metavar='PORT',
            type=int,
            help="Port to listen on",
            default=scserve.DEFAULT_PORT,
        )),

        ('--address', dict(
            metavar='ADDRESS',
            type=str,
            help="Address to listen on",
            default=None,
        )),

        ('--log-level', dict(
            metavar='LOG-LEVEL',
            action  = 'store',
            default = 'debug',
            choices = scserve.LOGLEVELS,
            help    = "One of: %s" % nice_join(scserve.LOGLEVELS),
        )),

    )

''' Provides a main function to run the ``bokeh`` command.

'''
from __future__ import absolute_import

import argparse

from bokeh.settings import settings
from bokeh.util.string import nice_join

from .util import die
from . import subcommands

def main(argv):
    ''' Execute the Bokeh command.

    Args:
        argv (seq[str]) : a list of command line arguments to process

    Returns:
        None

    '''
    if len(argv) == 1:
        die("ERROR: Must specify subcommand, one of: %s" % nice_join(x.name for x in subcommands.all))

    parser = argparse.ArgumentParser(prog=argv[0])

    # does this get set by anything other than BOKEH_VERSION env var?
    version = settings.version()
    if not version:
        version = "unknown version"
    parser.add_argument('-v', '--version', action='version', version=version)

    subs = parser.add_subparsers(help="Sub-commands")

    for cls in subcommands.all:
        subparser = subs.add_parser(cls.name, help=cls.help)
        subcommand = cls(parser=subparser)
        subparser.set_defaults(invoke=subcommand.invoke)

    args = parser.parse_args(argv[1:])
    try:
        args.invoke(args)
    except Exception as e:
        die(str(e))

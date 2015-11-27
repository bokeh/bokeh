'''

'''
import argparse

from bokeh.settings import settings

from .subcommands.html import HTML
from .subcommands.json import JSON
from .subcommands.serve import Serve

subcommands = [Serve, HTML, JSON]

def main(argv):
    parser = argparse.ArgumentParser(prog=argv[0])

    # does this get set by anything other than BOKEH_VERSION env var?
    version = settings.version()
    if not version:
        version = "unknown version"
    parser.add_argument('-v', '--version', action='version', version=version)

    subs = parser.add_subparsers(help="Sub-commands")

    for cls in subcommands:
        subparser = subs.add_parser(cls.name, help=cls.help)
        subcommand = cls(parser=subparser)
        subparser.set_defaults(func=subcommand.func)

    # TODO (bev) unhelpful error if no subcommand given
    args = parser.parse_args(argv[1:])
    args.func(args)
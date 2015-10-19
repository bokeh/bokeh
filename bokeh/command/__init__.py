from __future__ import print_function

import argparse
import sys
import os

from bokeh.settings import settings
from bokeh.application import Application
from bokeh.server.server import Server
from bokeh.spellings import ScriptHandler, DirectoryHandler
from bokeh.io import output_file, save

import logging
log = logging.getLogger(__name__)

def die(message):
    print(message, file=sys.stderr)
    sys.exit(1)

class Subcommand(object):
    """Abstract base class for subcommands"""

    def __init__(self, parser):
        """Initialize the subcommand with its parser; can call parser.add_argument to add subcommand flags"""
        self.parser = parser

    def func(self, args):
        """Takes over main program flow to perform the subcommand"""
        pass

class ApplicationsSubcommand(Subcommand):
    """Abstract base class for subcommand that operates on a list of applications."""

    def __init__(self, **kwargs):
        super(ApplicationsSubcommand, self).__init__(**kwargs)
        self.parser.add_argument('files', metavar='DIRECTORY-OR-SCRIPT', nargs='*',  help="The app directories or scripts to serve (current directory if not specified)",
                                 default=os.getcwd())

    def build_applications(self, args):
        if args.files:
            files = args.files
        else:
            files = [os.getcwd()]

        applications = {}

        for file in files:
            if os.path.isdir(file):
                handler = DirectoryHandler(filename=file)
            else:
                handler = ScriptHandler(filename=file)

            application = Application()
            application.add(handler)

            route = handler.url_path()
            if not route:
                if '/' in applications:
                    die("Don't know the URL path to use for %s" % (file))
                route = '/'
            applications[route] = application

        return applications

class Serve(ApplicationsSubcommand):
    """Subcommand to launch the Bokeh server."""

    name = "serve"
    help = "Run a Bokeh server hosting one or more applications"

    def __init__(self, **kwargs):
        super(Serve, self).__init__(**kwargs)
        self.parser.add_argument('--port', metavar='PORT', type=int, help="Port to listen on", default=-1)
        self.parser.add_argument('--develop', type=bool, help="Enable develop-time features that should not be used in production", default=False)
        self.port = 5006
        self.develop_mode = False
        self.server = None

    def func(self, args):
        if args.port >= 0:
            self.port = args.port

        self.develop_mode = args.develop

        applications = self.build_applications(args)

        # TODO make log level a command line option
        logging.basicConfig(level=logging.DEBUG)

        server = Server(applications)
        if self.develop_mode:
            log.info("Using develop mode (do not enable --develop in production)")
        log.info("Starting Bokeh server on port %d with apps at %r", server.port, sorted(applications.keys()))
        server.start()

class Html(ApplicationsSubcommand):
    """Subcommand to output applications as standalone HTML files."""

    name = "html"
    help = "Create standalone HTML files for one or more applications"

    def __init__(self, **kwargs):
        super(Html, self).__init__(**kwargs)

    def func(self, args):
        applications = self.build_applications(args)

        for (route, app) in applications.items():
            doc = app.create_document()
            output_file(route[1:] + ".html")
            save(doc)

subcommands = [Serve, Html]

def main(argv):
    parser = argparse.ArgumentParser(prog=argv[0])
    # does this get set by anything other than BOKEH_VERSION env var?
    version = settings.version()
    if not version:
        version = "unknown version"
    parser.add_argument('-v', '--version', action='version', version=version)
    subs = parser.add_subparsers(help="Sub-commands")
    for klass in subcommands:
        c_parser = subs.add_parser(klass.name, help=klass.help)
        c = klass(parser=c_parser)
        c_parser.set_defaults(func=c.func)

    args = parser.parse_args(argv[1:])
    args.func(args)

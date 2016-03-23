'''
Abstract base class for subcommands that output to a file (or stdout).
'''
from __future__ import absolute_import

from abc import abstractmethod
import argparse
import io

from bokeh.util.string import decode_utf8

from ..subcommand import Subcommand
from ..util import build_single_handler_applications, die

class FileOutputSubcommand(Subcommand):
    ''' Abstract subcommand to output applications as some type of file.

    '''

    extension = None # subtype must set this to file extension

    @classmethod
    def files_arg(cls, output_type_name):
        """ Subtypes must use this to make a files arg and include it in their args. """
        return ('files', dict(
            metavar='DIRECTORY-OR-SCRIPT',
            nargs='+',
            help=("The app directories or scripts to generate %s for" % (output_type_name)),
            default=None
        ))

    @classmethod
    def other_args(cls):
        """ Subtypes should append these to their args. """
        return (
            (('-o', '--output'), dict(
                metavar='FILENAME',
                action='append',
                type=str,
                help="Name of the output file or - for standard output."
            )),

            ('--args', dict(
                metavar='COMMAND-LINE-ARGS',
                nargs=argparse.REMAINDER,
                help="Any command line arguments remaining are passed on to the application handler",
            )),
        )

    def filename_from_route(self, route, ext):
        if route == "/":
            base = "index"
        else:
            base = route[1:]

        return "%s.%s" % (base, ext)

    def invoke(self, args):
        argvs = { f : args.args for f in args.files}
        applications = build_single_handler_applications(args.files, argvs)

        if args.output is None:
            outputs = []
        else:
            outputs = list(args.output) # copy so we can pop from it

        if len(outputs) > len(applications):
            die("--output/-o was given too many times (%d times for %d applications)" %
                (len(outputs), len(applications)))

        for (route, app) in applications.items():
            doc = app.create_document()

            if len(outputs) > 0:
                filename = outputs.pop(0)
            else:
                filename = self.filename_from_route(route, self.extension)

            self.write_file(args, filename, doc)

    def write_file(self, args, filename, doc):
        contents = self.file_contents(args, doc)
        if filename == '-':
            print(decode_utf8(contents))
        else:
            with io.open(filename, "w", encoding="utf-8") as file:
                file.write(decode_utf8(contents))
        self.after_write_file(args, filename, doc)

    # can be overridden optionally
    def after_write_file(self, args, filename, doc):
        pass

    @abstractmethod
    def file_contents(self, args, doc):
        """ Subtypes must override this to return the contents of the output file for the given doc."""
        raise NotImplementedError("file_contents")

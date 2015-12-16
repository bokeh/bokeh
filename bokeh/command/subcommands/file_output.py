'''
Abstract base class for subcommands that output to a file (or stdout).
'''
from __future__ import absolute_import

from abc import abstractmethod

from ..subcommand import Subcommand
from ..util import build_single_handler_applications

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

    def filename_from_route(self, route, ext):
        if route == "/":
            base = "index"
        else:
            base = route[1:]

        return "%s.%s" % (base, ext)

    def invoke(self, args):
        applications = build_single_handler_applications(args.files)

        for (route, app) in applications.items():
            doc = app.create_document()

            filename = self.filename_from_route(route, self.extension)

            self.write_file(args, filename, doc)

    @abstractmethod
    def write_file(self, args, filename, doc):
        raise NotImplementedError("write_file")

#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Abstract base class for subcommands that output to a file (or stdout).

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
import argparse
import io
from typing import Union, List, Tuple

# External imports

# Bokeh imports
from ..subcommand import Subcommand
from ..util import build_single_handler_applications, die
from ...document import Document


#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'FileOutputSubcommand',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class FileOutputSubcommand(Subcommand):
    ''' Abstract subcommand to output applications as some type of file.

    '''

    extension: str = ""  # subtype must set this to file extension

    @classmethod
    def files_arg(cls, output_type_name: str) -> Tuple[str, dict]:
        ''' Returns a positional arg for ``files`` to specify file inputs to
        the command.

        Subclasses should include this to their class ``args``.

        Example:

            .. code-block:: python

                class Foo(FileOutputSubcommand):

                    args = (

                        FileOutputSubcommand.files_arg("FOO"),

                        # more args for Foo

                    ) + FileOutputSubcommand.other_args()

        '''
        return ('files', dict(
            metavar='DIRECTORY-OR-SCRIPT',
            nargs='+',
            help=("The app directories or scripts to generate %s for" % (output_type_name)),
            default=None
        ))

    # TODO - unsure how to specify a suitable return type. The mypy suggested was very specific to this method datastructure
    # Tuple[Tuple[Tuple[str, str], Dict[Any, Union[str, Type[str]]]], Tuple[str, Dict[Any, str]]]
    # Sequence[str, dict] does not work because then added to another Tuple in subclasses
    @classmethod
    def other_args(cls):
        ''' Return args for ``-o`` / ``--output`` to specify where output
        should be written, and for a ``--args`` to pass on any additional
        command line args to the subcommand.

        Subclasses should append these to their class ``args``.

        Example:

            .. code-block:: python

                class Foo(FileOutputSubcommand):

                    args = (

                        FileOutputSubcommand.files_arg("FOO"),

                        # more args for Foo

                    ) + FileOutputSubcommand.other_args()

        '''
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

    def filename_from_route(self, route: str, ext: str) -> str:
        '''

        '''
        if route == "/":
            base = "index"
        else:
            base = route[1:]

        return "%s.%s" % (base, ext)

    def invoke(self, args: argparse.Namespace) -> None:
        '''

        '''
        argvs = {f: args.args for f in args.files}
        applications = build_single_handler_applications(args.files, argvs)

        if args.output is None:
            outputs: List[str] = []
        else:
            outputs = list(args.output)  # copy so we can pop from it

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

    def write_file(self, args: argparse.Namespace, filename: str, doc: Document) -> None:
        '''

        '''
        contents = self.file_contents(args, doc)
        if filename == '-':
            print(contents)
        else:
            with io.open(filename, "w", encoding="utf-8") as file:
                file.write(contents)
        self.after_write_file(args, filename, doc)

    # can be overridden optionally
    def after_write_file(self, args: argparse.Namespace, filename: str, doc: Document) -> None:
        '''

        '''
        pass

    @abstractmethod
    def file_contents(self, args: argparse.Namespace, doc: Document) -> Union[str, bytes, None]:
        ''' Subtypes must override this to return the contents of the output file for the given doc.
        subclassed methods return different types:
            str:
            bytes: SVG, png
            None:
        '''
        raise NotImplementedError("file_contents")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

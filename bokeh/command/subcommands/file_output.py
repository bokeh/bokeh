#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Abstract base class for subcommands that output to a file (or stdout).

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import argparse
import sys
from abc import abstractmethod
from os.path import splitext
from typing import Dict, List, Optional, Tuple, Union

# Bokeh imports
from ...document import Document
from ..subcommand import Subcommand
from ..util import build_single_handler_applications, die

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

    # subtype must set this instance attribute to file extension
    extension: str

    @classmethod
    def files_arg(cls, output_type_name: str) -> Tuple[str, Dict[str, Optional[str]]]:
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
    def other_args(cls) -> Tuple[Tuple[Tuple[str, str], Dict[str, object]], Tuple[str, Dict[str, str]]]:
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
        argvs = { f : args.args for f in args.files}
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
        def write_str(content: str, filename: str) -> None:
            if filename == "-":
                print(content)
            else:
                with open(filename, "w", encoding="utf-8") as file:
                    file.write(content)
            self.after_write_file(args, filename, doc)

        def write_bytes(content: bytes, filename: str) -> None:
            if filename == "-":
                sys.stdout.buffer.write(content)
            else:
                with open(filename, "wb") as f:
                    f.write(content)
            self.after_write_file(args, filename, doc)

        contents = self.file_contents(args, doc)

        if isinstance(contents, str):
            write_str(contents, filename)
        elif isinstance(contents, bytes):
            write_bytes(contents, filename)
        else:
            if filename == "-" or len(contents) <= 1:
                def indexed(i: int) -> str:
                    return filename
            else:
                def indexed(i: int) -> str:
                    root, ext = splitext(filename)
                    return f"{root}_{i}{ext}"

            for i, content in enumerate(contents):
                if isinstance(content, str):
                    write_str(content, indexed(i))
                elif isinstance(content, bytes):
                    write_bytes(content, indexed(i))

    # can be overridden optionally
    def after_write_file(self, args: argparse.Namespace, filename: str, doc: Document) -> None:
        '''

        '''
        pass

    @abstractmethod
    def file_contents(self, args: argparse.Namespace, doc: Document) -> Union[str, bytes, List[str], List[bytes]]:
        ''' Subclasses must override this method to return the contents of the output file for the given doc.
        subclassed methods return different types:
        str: html, json
        bytes: SVG, png

        Raises:
            NotImplementedError

        '''
        raise NotImplementedError()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provides a base class for defining subcommands of the Bokeh command
line application.

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
from abc import ABCMeta, abstractmethod
from argparse import ArgumentParser, Namespace
from typing import Union

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Subcommand',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Subcommand(metaclass=ABCMeta):
    ''' Abstract base class for subcommands

    Subclasses should implement an ``invoke(self, args)`` method that accepts
    a set of argparse processed arguments as input.

    Subclasses should also define the following class attributes:

    * ``name`` a name for this subcommand

    * ``help`` a help string for argparse to use for this subcommand

    * ``args`` the parameters to pass to ``parser.add_argument``

    The format of the ``args`` should be a sequence of tuples of the form:

    .. code-block:: python

        ('argname', dict(
            metavar='ARGNAME',
            nargs='+',
        ))

    Example:

        A simple subcommand "foo" might look like this:

        .. code-block:: python

            class Foo(Subcommand):

                name = "foo"
                help = "performs the Foo action"
                args = (
                    ('--yell', dict(
                        action='store_true',
                        help="Make it loud",
                    )),
                )

                def invoke(self, args):
                    if args.yell:
                        print("FOO!")
                    else:
                        print("foo")

        Then executing ``bokeh foo --yell`` would print ``FOO!`` at the console.

    '''

    # specifying static typing of instance attributes
    # see https://stackoverflow.com/a/51191130
    name: str
    help: str

    def __init__(self, parser: ArgumentParser) -> None:
        ''' Initialize the subcommand with its parser

        Args:
            parser (Parser) : an Argparse ``Parser`` instance to configure
                with the args for this subcommand.

        This method will automatically add all the arguments described in
        ``self.args``. Subclasses can perform any additional customizations
        on ``self.parser``.

        '''
        self.parser = parser
        args = getattr(self, 'args', ())
        for arg in args:
            flags = arg[0]
            if not isinstance(flags, tuple):
                flags = (flags,)
            self.parser.add_argument(*flags, **arg[1])

    @abstractmethod
    def invoke(self, args: Namespace) -> Union[bool, None]:
        ''' Takes over main program flow to perform the subcommand.

        *This method must be implemented by subclasses.*
        subclassed overwritten methods return different types:
        bool: Build
        None: FileOutput (subclassed by HTML, SVG and JSON. PNG overwrites FileOutput.invoke method), Info, Init, \
                Sampledata, Secret, Serve, Static


        Args:
            args (argparse.Namespace) : command line arguments for the subcommand to parse

        Raises:
            NotImplementedError

        '''
        raise NotImplementedError("implement invoke()")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

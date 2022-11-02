#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from abc import ABCMeta, abstractmethod
from argparse import ArgumentParser, Namespace
from typing import (
    TYPE_CHECKING,
    Any,
    ClassVar,
    Literal,
    Sequence,
    Tuple,
    Type,
    Union,
)

# Bokeh imports
from ..util.dataclasses import (
    NotRequired,
    Unspecified,
    dataclass,
    entries,
)

if TYPE_CHECKING:
    from typing_extensions import TypeAlias

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

@dataclass
class Argument:
    action: NotRequired[Literal["store", "store_const", "store_true", "append", "append_const", "count", "help", "version", "extend"]] = Unspecified
    nargs: NotRequired[int | Literal["?", "*", "+", "..."]] = Unspecified
    const: NotRequired[Any] = Unspecified
    default: NotRequired[Any] = Unspecified
    type: NotRequired[Type[Any]] = Unspecified
    choices: NotRequired[Sequence[Any]] = Unspecified
    required: NotRequired[bool] = Unspecified
    help: NotRequired[str] = Unspecified
    metavar: NotRequired[str] = Unspecified

Arg: TypeAlias = Tuple[Union[str, Tuple[str, ...]], Argument]
Args: TypeAlias = Tuple[Arg, ...]

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

        ('argname', Argument(
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
                    ('--yell', Argument(
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

    name: ClassVar[str]
    help: ClassVar[str]
    args: ClassVar[Args] = ()

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
        for arg in self.args:
            flags, spec = arg
            if not isinstance(flags, tuple):
                flags = (flags,)
            if not isinstance(spec, dict):
                kwargs = dict(entries(spec))
            else:
                # NOTE: allow dict for run time backwards compatibility, but don't include in types
                kwargs = spec
            self.parser.add_argument(*flags, **kwargs)

    @abstractmethod
    def invoke(self, args: Namespace) -> bool | None:
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

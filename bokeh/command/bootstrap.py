#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a ``main`` function to run bokeh commands.

The following are equivalent:

* Running the ``bokeh`` command line script:

  .. code-block:: sh

      bokeh serve --show app.py

* Using ``python -m bokeh``:

  .. code-block:: sh

      python -m bokeh serve --show app.py

* Executing ``main`` programmatically:

  .. code-block:: python

      from bokeh.command.bootstrap import main

      main(["bokeh", "serve", "--show", "app.py"])

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
from typing import List

# Bokeh imports
from bokeh import __version__
from bokeh.settings import settings
from bokeh.util.string import nice_join

# Bokeh imports
from . import subcommands
from .util import die

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'main',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------
# TODO - struggling to resolve argv mypy typing. is nested tuple of ((arg_name, arg_dict), ...) not Sequence[str]
def main(argv: List[str]) -> None:
    ''' Execute the Bokeh command.

    Args:
        argv (seq[str]) : a list of command line arguments to process

    Returns:
        None

    The first item in ``argv`` is typically "bokeh", and the second should
    be the name of one of the available subcommands:

    * :ref:`info <bokeh.command.subcommands.info>`
    * :ref:`json <bokeh.command.subcommands.json>`
    * :ref:`sampledata <bokeh.command.subcommands.sampledata>`
    * :ref:`secret <bokeh.command.subcommands.secret>`
    * :ref:`serve <bokeh.command.subcommands.serve>`
    * :ref:`static <bokeh.command.subcommands.static>`

    '''
    if len(argv) == 1:
        die("ERROR: Must specify subcommand, one of: %s" % nice_join([x.name for x in subcommands.all]))

    parser = argparse.ArgumentParser(
        prog=argv[0],
        epilog="See '<command> --help' to read about a specific subcommand.")

    parser.add_argument('-v', '--version', action='version', version=__version__)

    subs = parser.add_subparsers(help="Sub-commands")

    for cls in subcommands.all:
        subparser = subs.add_parser(cls.name, help=cls.help)
        subcommand = cls(parser=subparser)
        subparser.set_defaults(invoke=subcommand.invoke)

    args = parser.parse_args(argv[1:])
    try:
        ret = args.invoke(args)
    except Exception as e:
        if settings.dev:
            raise
        else:
            die("ERROR: " + str(e))

    if ret is False:
        sys.exit(1)
    elif ret is not True and isinstance(ret, int) and ret != 0:
        sys.exit(ret)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

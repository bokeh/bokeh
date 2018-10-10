#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
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
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import argparse

# External imports

# Bokeh imports
from bokeh import __version__
from bokeh.util.string import nice_join

from .util import die
from . import subcommands

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'main',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def main(argv):
    ''' Execute the Bokeh command.

    Args:
        argv (seq[str]) : a list of command line arguments to process

    Returns:
        None

    The first item in ``argv`` is typically "bokeh", and the second should
    be the name of one of the available subcommands:

    * :ref:`html <bokeh.command.subcommands.html>`
    * :ref:`info <bokeh.command.subcommands.info>`
    * :ref:`json <bokeh.command.subcommands.json>`
    * :ref:`png <bokeh.command.subcommands.png>`
    * :ref:`sampledata <bokeh.command.subcommands.sampledata>`
    * :ref:`secret <bokeh.command.subcommands.secret>`
    * :ref:`serve <bokeh.command.subcommands.serve>`
    * :ref:`static <bokeh.command.subcommands.static>`
    * :ref:`svg <bokeh.command.subcommands.svg>`

    '''
    if len(argv) == 1:
        die("ERROR: Must specify subcommand, one of: %s" % nice_join(x.name for x in subcommands.all))

    parser = argparse.ArgumentParser(
        prog=argv[0],
        epilog="See '<command> --help' to read about a specific subcommand.")

    # we don't use settings.version() because the point of this option
    # is to report the actual version of Bokeh, while settings.version()
    # lets people change the version used for CDN for example.
    parser.add_argument('-v', '--version', action='version', version=__version__)

    subs = parser.add_subparsers(help="Sub-commands")

    for cls in subcommands.all:
        subparser = subs.add_parser(cls.name, help=cls.help)
        subcommand = cls(parser=subparser)
        subparser.set_defaults(invoke=subcommand.invoke)

    args = parser.parse_args(argv[1:])
    try:
        args.invoke(args)
    except Exception as e:
        die("ERROR: " + str(e))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

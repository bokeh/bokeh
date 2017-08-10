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
from __future__ import absolute_import

import argparse

from bokeh import __version__
from bokeh.util.string import format_docstring, nice_join

from .util import die
from . import subcommands

def main(argv):
    ''' Execute the Bokeh command.

    Args:
        argv (seq[str]) : a list of command line arguments to process

    Returns:
        None

    The first item in ``argv`` is typically "bokeh", and the second should
    be the name of one of the available subcommands:

    * {subcmds}

    '''
    if len(argv) == 1:
        die("ERROR: Must specify subcommand, one of: %s" % nice_join(x.name for x in subcommands.all))

    parser = argparse.ArgumentParser(prog=argv[0])

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
        die("ERROR:" + str(e))

main.__doc__ = format_docstring(main.__doc__, subcmds="\n    * ".join(":ref:`%s <bokeh.command.subcommands.%s>`" % (x.name, x.name) for x in subcommands.all))

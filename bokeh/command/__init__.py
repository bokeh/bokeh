''' Provides a command line application for Bokeh.

The following subcommands are available:

'''
from __future__ import absolute_import

def _build_docstring():
    global __doc__
    from . import subcommands

    for cls in subcommands.all:
        __doc__ += "%8s : %s\n" % (cls.name, cls.help)

_build_docstring()
del _build_docstring

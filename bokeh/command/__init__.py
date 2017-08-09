''' Provides a command line application for Bokeh.

The following subcommands are available:

'''
from __future__ import absolute_import

def _build_docstring():
    global __doc__
    from . import subcommands

    for cls in subcommands.all:
        # running python with -OO will discard docstrings -> __doc__ is None
        if __doc__ is None:
            __doc__ = ''
        __doc__ += "%s\n    %s\n\n" % (cls.name, cls.help)

_build_docstring()
del _build_docstring

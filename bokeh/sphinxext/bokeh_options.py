#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Thoroughly document Bokeh options classes.

The ``bokeh-options`` directive will automatically document all the properties
of a Bokeh Options class under a heading of "Keyword Args".

This directive takes the name of a Bokeh Options subclass as the argument, and
its module as an option:

.. code-block:: rest

    .. bokeh-options:: Opts
        :module: bokeh.sphinxext.sample

Examples
--------

For the following definition of ``bokeh.sphinxext.sample.Opts``:

.. code-block:: python

    class Opts(Options):
        """ This is an Options class """

        host = String(default="localhost", help="a host to connect to")
        port = Int(default=5890, help="a port to connect to")

the above usage yields the output:

    .. bokeh-options:: Opts
        :module: bokeh.sphinxext.sample

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
import importlib
import textwrap

# External imports
from docutils.parsers.rst.directives import unchanged

from sphinx.errors import SphinxError

# Bokeh imports
from ..util.options import Options
from .bokeh_directive import BokehDirective, py_sig_re
from .templates import OPTIONS_DETAIL

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'BokehOptionsDirective',
    'setup',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class BokehOptionsDirective(BokehDirective):

    has_content = True
    required_arguments = 1
    optional_arguments = 1
    option_spec = {
        'module': unchanged
    }

    def run(self):
        sig = " ".join(self.arguments)

        m = py_sig_re.match(sig)
        if m is None:
            raise SphinxError("Unable to parse signature for bokeh-options: %r" % sig)
        name_prefix, options_name, arglist, retann = m.groups()

        module_name = self.options['module']

        try:
            module = importlib.import_module(module_name)
        except ImportError:
            raise SphinxError("Unable to generate reference docs for %s, couldn't import module '%s'" % (options_name, module_name))

        options = getattr(module, options_name, None)
        if options is None:
            raise SphinxError("Unable to generate reference docs for %s, no options '%s' in %s" % (options_name, options_name, module_name))

        if not issubclass(options, Options):
            raise SphinxError("Unable to generate reference docs for %s, options '%s' is not a subclass of Options" % (options_name, options_name))

        options_obj = options({})

        opts = [];
        for prop_name in sorted(options_obj.properties()):
            descriptor = getattr(options_obj.__class__, prop_name)
            opts.append(dict(
                name=prop_name,
                type=descriptor.property._sphinx_type(),
                default=repr(descriptor.instance_default(options_obj)),
                doc="" if descriptor.__doc__ is None else textwrap.dedent(descriptor.__doc__.rstrip()),
            ))

        rst_text = OPTIONS_DETAIL.render(opts=opts)

        return self._parse(rst_text, "<bokeh-options>")

def setup(app):
    ''' Required Sphinx extension setup function. '''
    app.add_directive_to_domain('py', 'bokeh-options', BokehOptionsDirective)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Thoroughly document Bokeh enumerations

The ``bokeh-enum`` directive generates useful documentation for enumerations,
including all the allowable values. If the number of values is large, the full
list is put in a collapsible code block.

This directive takes the name of a Bokeh enum variable as the argument and the
module name as an option. An optional description may be added as content:

.. code-block:: rest

    .. bokeh-enum:: baz
        :module: bokeh.sphinxext.sample

        Specify a baz style

Examples
--------

The directive above will generate the following output:

    .. bokeh-enum:: baz
        :module: bokeh.sphinxext.sample

        Specify a baz style

Although ``bokeh-enum`` may be used explicitly, it is more often convenient in
conjunction with the :ref:`bokeh.sphinxext.bokeh_autodoc` extension. Together,
the same output above will be generated directly from the following code:

.. code-block:: python

    #: Specify a baz style
    baz = enumeration("a", "b", "c")

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
from .bokeh_directive import BokehDirective
from .templates import ENUM_DETAIL

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'BokehEnumDirective',
    'setup',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class BokehEnumDirective(BokehDirective):

    has_content = True
    required_arguments = 1
    option_spec = {
        'module': unchanged,
        'noindex': lambda x: True, # directives.flag weirdly returns None
    }

    def run(self):
        name = self.arguments[0]

        try:
            module = importlib.import_module(self.options['module'])
        except ImportError:
            raise SphinxError("Could not generate reference docs for %r: could not import module %r" % (self.arguments[0], self.options['module']))

        enum = getattr(module, name, None)

        fullrepr = repr(enum)
        if len(fullrepr) > 180:
            shortrepr = fullrepr[:40] + " .... " + fullrepr[-40:]
            fullrepr = _wrapper.wrap(fullrepr)
        else:
            shortrepr = fullrepr
            fullrepr = None

        rst_text = ENUM_DETAIL.render(
            name=name,
            module=self.options['module'],
            noindex=self.options.get('noindex', False),
            content=self.content,
            shortrepr=shortrepr,
            fullrepr=fullrepr,
        )

        return self._parse(rst_text, "<bokeh-enum>")

def setup(app):
    ''' Required Sphinx extension setup function. '''
    app.add_directive_to_domain('py', 'bokeh-enum', BokehEnumDirective)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_wrapper = textwrap.TextWrapper(subsequent_indent='    ')

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

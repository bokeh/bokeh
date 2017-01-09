""" Thoroughly document Bokeh enumerations

The ``bokeh-enum`` directive generates useful type information
for the enumeration, including all the allowable values. If the
number of values is large, the full list is put in a collapsible
code block.

This directive takes the name of a Bokeh enum variable and the
module to find the value as an argument::

    .. bokeh-enum:: baz
        :module: bokeh.sphinxext.sample

Examples
--------

For the following definition of ``bokeh.sphinxext.sample.Bar``::

    baz = enumeration("a", "b", "c")

the above usage yields the output:

    .. bokeh-enum:: baz
        :module: bokeh.sphinxext.sample

"""
from __future__ import absolute_import, print_function

import importlib
import textwrap

from docutils.parsers.rst.directives import unchanged

from sphinx.errors import SphinxError

from .bokeh_directive import BokehDirective
from .templates import ENUM_DETAIL

wrapper = textwrap.TextWrapper(subsequent_indent='    ')

class BokehEnumDirective(BokehDirective):

    has_content = True
    required_arguments = 1
    optional_arguments = 2

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
            fullrepr = wrapper.wrap(fullrepr)
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
    app.add_directive_to_domain('py', 'bokeh-enum', BokehEnumDirective)

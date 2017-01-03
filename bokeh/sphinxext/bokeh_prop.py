""" Thoroughly document Bokeh property attributes.

The ``bokeh-prop`` directive generates useful type information
for the property attribute, including cross links to the relevant
property types. Additionally, any per-attribute docstrings are
also displayed.

This directive takes the path to an attribute on a Bokeh
model class as an argument::

    .. bokeh-prop:: Bar.thing
        :module: bokeh.sphinxext.sample

Examples
--------

For the following definition of ``bokeh.sphinxext.sample.Bar``::

    class Bar(Model):
        ''' This is a Bar model. '''
        thing = List(Int, help="doc for thing")

the above usage yields the output:

    .. bokeh-prop:: Bar.thing
        :module: bokeh.sphinxext.sample

"""
from __future__ import absolute_import, print_function

import importlib
import textwrap

from docutils.parsers.rst.directives import unchanged

from sphinx.errors import SphinxError

from .bokeh_directive import BokehDirective
from .templates import PROP_DETAIL

class BokehPropDirective(BokehDirective):

    has_content = True
    required_arguments = 1
    optional_arguments = 2

    option_spec = {
        'module': unchanged
    }

    def run(self):

        model_name, prop_name = self.arguments[0].rsplit('.')

        try:
            module = importlib.import_module(self.options['module'])
        except ImportError:
            raise SphinxError("Could not generate reference docs for %r: could not import module %r" % (self.arguments[0], self.options['module']))

        model = getattr(module, model_name, None)
        if model is None:
            raise SphinxError("Unable to generate reference docs for %s, no model '%s' in %s" % (self.arguments[0], model_name, self.options['module']))

        model_obj = model()

        try:
            descriptor = getattr(model_obj.__class__, prop_name)
        except AttributeError:
            raise SphinxError("Unable to generate reference docs for %s, no property '%s' in %s" % (self.arguments[0], prop_name, model_name))

        rst_text = PROP_DETAIL.render(
            name=prop_name,
            module=self.options['module'],
            type_info=descriptor.property._sphinx_type(),
            doc="" if descriptor.__doc__ is None else textwrap.dedent(descriptor.__doc__),
        )

        return self._parse(rst_text, "<bokeh-prop>")

def setup(app):
    app.add_directive_to_domain('py', 'bokeh-prop', BokehPropDirective)

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

from docutils import nodes
from docutils.core import publish_parts
from docutils.parsers.rst.directives import unchanged
from docutils.statemachine import ViewList

import textwrap

from sphinx.errors import SphinxError
from sphinx.util.compat import Directive
from sphinx.util.nodes import nested_parse_with_titles

from .templates import PROP_DETAIL

class BokehPropDirective(Directive):

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

        model_obj = model()

        prop = getattr(model_obj.__class__, prop_name)

        rst_text = PROP_DETAIL.render(
            name=prop_name,
            module=self.options['module'],
            type_info=prop._sphinx_type(),
            doc="" if prop.__doc__ is None else textwrap.dedent(prop.__doc__),
        )

        # Set this to True to hunt for Sphynx warning (e.g. unexpected indentation)
        if False and prop.__doc__:
            print('--', prop_name)
            try:
                publish_parts(prop.__doc__)
            except Exception as err:
                print('Error in docstring: ' + str(err))

        result = ViewList()
        for line in rst_text.split("\n"):
            result.append(line, "<bokeh-prop>")
        node = nodes.paragraph()
        node.document = self.state.document
        nested_parse_with_titles(self.state, result, node)
        return node.children

def setup(app):
    app.add_directive_to_domain('py', 'bokeh-prop', BokehPropDirective)

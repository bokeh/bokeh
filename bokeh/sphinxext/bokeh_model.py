""" Thoroughly document Bokeh model classes.

The ``bokeh-model`` directive will automatically document
all the attributes (including Bokeh properties) of a Bokeh
model class. A JSON prototype showing all the possible
JSON fields will also be generated.

This directive takes the path to a Bokeh model class as an
argument::

    .. bokeh-model:: bokeh.sphinxext.sample.Foo

Examples
--------

For the following definition of ``bokeh.sphinxext.sample.Foo``::

    class Foo(Model):
        ''' This is a Foo model. '''
        index = Either(Auto, Enum('abc', 'def', 'xzy'), help="doc for index")
        value = Tuple(Float, Float, help="doc for value")


the above usage yields the output:

    .. bokeh-model:: bokeh.sphinxext.sample.Foo

"""
from __future__ import absolute_import, print_function

import importlib
import json

from docutils import nodes
from docutils.statemachine import ViewList

import jinja2

from sphinx.errors import SphinxError
from sphinx.util.compat import Directive
from sphinx.util.nodes import nested_parse_with_titles

from bokeh.model import Viewable


MODEL_TEMPLATE = jinja2.Template(u"""
.. autoclass::  {{ model_path }}
    :members:
    :undoc-members:
    :exclude-members: get_class
    :show-inheritance:

.. _{{ model_path }}.json:

.. collapsible-code-block:: javascript
    :heading: JSON Prototype

    {{ model_json|indent(4) }}

""")


class BokehModelDirective(Directive):

    has_content = True
    required_arguments = 1

    def run(self):
        model_path = self.arguments[0]
        module_name, model_name = model_path.rsplit(".", 1)

        try:
            module = importlib.import_module(module_name)
        except ImportError:
            raise SphinxError("Unable to generate reference docs for %s, couldn't import module '%s'" %
                (model_path, module_name))

        model = getattr(module, model_name, None)
        if model is None:
            raise SphinxError("Unable to generate reference docs for %s, no model '%s' in %s" %
                (model_path, model_name, module_name))

        if type(model) != Viewable:
            raise SphinxError("Unable to generate reference docs for %s, model '%s' is not a subclass of Viewable" %
                (model_path, model_name))

        model_obj = model()

        model_json = json.dumps(
            model_obj.to_json(include_defaults=True),
            sort_keys=True,
            indent=2,
            separators=(',', ': ')
        )

        rst_text = MODEL_TEMPLATE.render(
            model_path=model_path,
            model_json=model_json,
        )

        result = ViewList()
        for line in rst_text.split("\n"):
            result.append(line, "<bokeh-model>")
        node = nodes.paragraph()
        node.document = self.state.document
        nested_parse_with_titles(self.state, result, node)
        return node.children

def setup(app):
    app.add_directive_to_domain('py', 'bokeh-model', BokehModelDirective)

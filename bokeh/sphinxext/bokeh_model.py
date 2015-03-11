""" Thoroughly document Bokeh model classes.

The ``bokeh-model`` directive will automatically document
all the attributes (including Bokeh properties) of a Bokeh
model class. A JSON prototype showing all the possible
JSON fields will also be generated.

Usage
-----

This directive takes the path to a Bokeh model class as an
argument::

    .. bokeh-model:: bokeh.sphinxext.sample.Foo

Examples
--------

For the following definition of ``bokeh.sphinxext.sample.Foo``::

    class Foo(PlotObject):
        ''' This is a Foo model. '''
        index = Either(Auto, Enum('abc', 'def', 'xzy'), help="doc for index")
        value = Tuple(Float, Float, help="doc for value")


the above usage yields the output:

----

    .. bokeh-model:: bokeh.sphinxext.sample.Foo

"""
from __future__ import absolute_import, print_function

import importlib
import json

from docutils import nodes
from docutils.statemachine import ViewList

import jinja2

from sphinx.util.compat import Directive
from sphinx.util.nodes import nested_parse_with_titles

from bokeh.plot_object import Viewable
from bokeh.protocol import serialize_json


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
            pass

        model = getattr(module, model_name, None)
        if model is None:
            pass

        if type(model) != Viewable:
            pass

        model_obj = model()

        model_json = json.dumps(
            json.loads(serialize_json(model_obj.dump(changed_only=False))),
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

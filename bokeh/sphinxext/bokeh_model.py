from __future__ import print_function

import importlib
import json

from docutils import nodes
from docutils.statemachine import ViewList

import jinja2

from sphinx.locale import _
from sphinx.util.compat import Directive

from bokeh.plot_object import PlotObject, Viewable
from bokeh.protocol import serialize_json


MODEL_TEMPLATE = jinja2.Template(u"""
.. autoclass::  {{ model_path }}
    :members:

.. code-block:: javascript

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

        model_json = json.dumps(
            json.loads(serialize_json(model().dump(changed_only=False))),
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
        self.state.nested_parse(result, 0, node)
        return node.children

def setup(app):
    app.add_directive('bokeh-model', BokehModelDirective)


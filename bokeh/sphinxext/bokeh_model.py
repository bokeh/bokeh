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

.. currentmodule:: {{ module_name }}

{% for prop in properties %}
.. attribute:: {{ prop.name }}

    type: `{{ prop.type_name }} <{{ prop.type_link }}>`_
    {% if prop.description %}{{ prop.description }}{% endif %}

{% endfor %}

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

        model_obj = model()

        model_json = json.dumps(
            json.loads(serialize_json(model_obj.dump(changed_only=False))),
            sort_keys=True,
            indent=2,
            separators=(',', ': ')
        )

        properties = []
        for prop_name in sorted(model_obj.properties()):

            # NOTE: (bev) session not really relevant for anyone
            if prop_name == "session": continue

            prop = getattr(model_obj.__class__, prop_name)

            properties.append({
                "name"        : prop_name,
                "type_name"   : str(prop),
                "type_link"   : "properties.html#bokeh.properties.%s"  % prop.__class__.__name__,
                "description" : None,
            })

        rst_text = MODEL_TEMPLATE.render(
            model_path=model_path,
            module_name=module_name,
            model_json=model_json,
            properties=properties,
        )

        result = ViewList()
        for line in rst_text.split("\n"):
            result.append(line, "<bokeh-model>")
        node = nodes.paragraph()
        node.document = self.state.document
        self.state.nested_parse(result, 0, node)
        return node.children

def setup(app):
    app.add_directive_to_domain('py', 'bokeh-model', BokehModelDirective)


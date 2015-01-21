from __future__ import print_function

import importlib

from docutils import nodes
from docutils.statemachine import ViewList

import jinja2

from sphinx.util.compat import Directive

from bokeh.plot_object import Viewable


PROP_TEMPLATE = jinja2.Template(u"""
.. attribute:: {{ name }}
    :module: {{ module }}

    type: {{ type_info }}

{% if doc %}{{ doc|indent(3) }}{% endif %}

""")


class BokehPropDirective(Directive):

    has_content = True
    required_arguments = 1

    def run(self):

        prop_path = self.arguments[0]
        module_path, model_name, prop_name = prop_path.rsplit('.', 2)

        try:
            module = importlib.import_module(module_path)
        except ImportError:
            pass

        model = getattr(module, model_name, None)
        if model is None:
            pass

        if type(model) != Viewable:
            pass

        model_obj = model()

        prop = getattr(model_obj.__class__, prop_name)

        type_info = "`%s <properties.html#bokeh.properties.%s>`_"  % (str(prop), prop.__class__.__name__)

        # This test is not great, but it will do. We only want to
        # individual property attributes docs, not the general doc
        # for the property doc, which is what happens if there is
        # no explicit doc provided
        if len(self.content) > 0 and self.content[0] in prop.__doc__:
            doc = None
        else:
            doc = "%s\n\n" % "\n\n".join(self.content)

        rst_text = PROP_TEMPLATE.render(
            name=prop_name,
            module=module_path,
            type_info=type_info,
            doc=doc,
        )

        result = ViewList()
        for line in rst_text.split("\n"):
            result.append(line, "<bokeh-prop>")
        node = nodes.paragraph()
        node.document = self.state.document
        self.state.nested_parse(result, 0, node)
        return node.children

def setup(app):
    app.add_directive_to_domain('py', 'bokeh-prop', BokehPropDirective)


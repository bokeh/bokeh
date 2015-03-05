""" Thoroughly document Bokeh property attributes.

The ``bokeh-prop`` directive generates useful type information
for the property attribute, including cross links to the relevant
property types. Additionally, any per-attribute docstrings are
also displayed.

Usage
-----

This directive takes the path to an attribute on a Bokeh
model class as an argument::

    .. bokeh-prop:: bokeh.sphinxext.sample.Bar.thing

Examples
--------

For the following definition of ``bokeh.sphinxext.sample.Bar``::

    class Bar(PlotObject):
        ''' This is a Bar model. '''
        thing = List(Int, help="doc for thing")

the above usage yields the output:

----

    .. bokeh-prop:: bokeh.sphinxext.sample.Bar.thing

"""
from __future__ import absolute_import, print_function

import importlib

from docutils import nodes
from docutils.statemachine import ViewList

import textwrap

import jinja2

from sphinx.util.compat import Directive
from sphinx.util.nodes import nested_parse_with_titles

from bokeh.plot_object import Viewable
import bokeh.properties


PROP_TEMPLATE = jinja2.Template(u"""
.. attribute:: {{ name }}
    :module: {{ module }}

    *property type:* {{ type_info }}

    {% if doc %}{{ doc|indent(4) }}{% endif %}

""")

PROP_NAMES = [
    name for name, cls in bokeh.properties.__dict__.items()
    if isinstance(cls, type) and issubclass(cls, bokeh.properties.Property)
]
PROP_NAMES.sort(reverse=True, key=len)

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

        type_info = self._get_type_info(prop)

        rst_text = PROP_TEMPLATE.render(
            name=prop_name,
            module=module_path,
            type_info=type_info,
            doc="" if prop.__doc__ is None else textwrap.dedent(prop.__doc__),
        )

        result = ViewList()
        for line in rst_text.split("\n"):
            result.append(line, "<bokeh-prop>")
        node = nodes.paragraph()
        node.document = self.state.document
        nested_parse_with_titles(self.state, result, node)
        return node.children

    def _get_type_info(self, prop):
        desc = str(prop)
        template = ":class:`~bokeh.properties.%s`\ "
        # some of the property names are substrings of other property names
        # so first go through greedily replacing the longest possible match
        # with a unique id (PROP_NAMES is reverse sorted by length)
        for i, name in enumerate(PROP_NAMES):
            desc = desc.replace(name, "__ID%d" % i)
        # now replace the unique id with the corresponding prop name. Go in
        # reverse to make sure replacements are greedy
        for i in range(len(PROP_NAMES)-1, 0, -1):
            name = PROP_NAMES[i]
            desc = desc.replace("__ID%d" % i, template % name)
        return desc

def setup(app):
    app.add_directive_to_domain('py', 'bokeh-prop', BokehPropDirective)

""" Automatically document Bokeh Jinja2 templates.

The ``bokeh-jinja`` directive generates useful type information
for the property attribute, including cross links to the relevant
property types. Additionally, any per-attribute docstrings are
also displayed.

Usage
-----

This directive takes the path to an attribute on a Bokeh
model class as an argument::

    .. bokeh-jinja:: bokeh.templates.FOO


"""
from __future__ import absolute_import, print_function

import importlib
from os.path import basename
import re
import sys
import textwrap

from docutils import nodes
from docutils.statemachine import ViewList
import jinja2

from sphinx.util.compat import Directive
from sphinx.util.nodes import nested_parse_with_titles


JINJA_TEMPLATE = jinja2.Template(u"""
.. data:: {{ name }}
    :module: {{ module }}
    :annotation: = {{ objrepr }}

    {% if doc %}{{ doc|indent(4) }}{% endif %}

    .. collapsible-code-block:: {{ lang }}
        :heading: Template: {{ filename }}

        {{ template_text|indent(8) }}

""")

DOCPAT = re.compile(r"\{\#(.+?)\#\}", flags=re.MULTILINE|re.DOTALL)



class BokehJinjaDirective(Directive):

    has_content = True
    required_arguments = 1

    def run(self):

        env = self.state.document.settings.env
        app = env.app

        template_path = self.arguments[0]
        module_path, template_name = template_path.rsplit('.', 1)

        try:
            module = importlib.import_module(module_path)
        except ImportError:
            msg = "Unable to import Bokeh template module: %s" % module_path
            app.warn(msg)
            node = nodes.error(None,
                               nodes.paragraph(text=msg),
                               nodes.paragraph(text=str(sys.exc_info()[1])))
            return [node]

        template = getattr(module, template_name, None)
        if template is None:
            msg = "Unable to find Bokeh template: %s" % template_path
            app.warn(msg)
            node = nodes.error(None, nodes.paragraph(text=msg))
            return [node]

        template_text = open(template.filename).read()
        m = DOCPAT.match(template_text)
        if m: doc = m.group(1)
        else: doc = None

        filename = basename(template.filename)
        rst_text = JINJA_TEMPLATE.render(
            name=template_name,
            module=module_path,
            objrepr=repr(template),
            doc="" if doc is None else textwrap.dedent(doc),
            lang=filename.rsplit('.', 1)[-1],
            filename=filename,
            template_text=DOCPAT.sub("", template_text),
        )

        result = ViewList()
        for line in rst_text.split("\n"):
            result.append(line, "<bokeh-jinja>")
        node = nodes.paragraph()
        node.document = self.state.document
        nested_parse_with_titles(self.state, result, node)
        return node.children

def setup(app):
    app.add_directive_to_domain('py', 'bokeh-jinja', BokehJinjaDirective)

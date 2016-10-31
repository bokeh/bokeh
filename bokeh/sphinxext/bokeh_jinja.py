""" Automatically document Bokeh Jinja2 templates.

The ``bokeh-jinja`` directive generates useful type information
for the property attribute, including cross links to the relevant
property types. Additionally, any per-attribute docstrings are
also displayed.

This directive takes the path to an attribute on a Bokeh
model class as an argument::

    .. bokeh-jinja:: bokeh.core.templates.FOO


"""
from __future__ import absolute_import, print_function

import importlib
from os.path import basename
import re
import textwrap

from sphinx.errors import SphinxError

from .bokeh_directive import BokehDirective
from .templates import JINJA_DETAIL

DOCPAT = re.compile(r"\{\#(.+?)\#\}", flags=re.MULTILINE|re.DOTALL)

class BokehJinjaDirective(BokehDirective):

    has_content = True
    required_arguments = 1

    def run(self):

        template_path = self.arguments[0]
        module_path, template_name = template_path.rsplit('.', 1)

        try:
            module = importlib.import_module(module_path)
        except ImportError:
            SphinxError("Unable to import Bokeh template module: %s" % module_path)

        template = getattr(module, template_name, None)
        if template is None:
            SphinxError("Unable to find Bokeh template: %s" % template_path)

        template_text = open(template.filename).read()
        m = DOCPAT.match(template_text)
        if m: doc = m.group(1)
        else: doc = None

        filename = basename(template.filename)
        rst_text = JINJA_DETAIL.render(
            name=template_name,
            module=module_path,
            objrepr=repr(template),
            doc="" if doc is None else textwrap.dedent(doc),
            filename=filename,
            template_text=DOCPAT.sub("", template_text),
        )

        return self._parse(rst_text, "<bokeh-jinja>")

def setup(app):
    app.add_directive_to_domain('py', 'bokeh-jinja', BokehJinjaDirective)

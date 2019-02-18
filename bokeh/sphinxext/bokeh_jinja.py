#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Automatically document Bokeh Jinja2 templates.

This directive takes the module path to an attribute name that defines a Jinja2
template:

.. code-block:: rest

    .. bokeh-jinja:: bokeh.core.templates.FILE

Any template parameters will be displayed and the template source code will
be rendered in a collapsible code block. For example, the usage above will
generate the following output:

    .. bokeh-jinja:: bokeh.core.templates.FILE
        :noindex:

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import importlib
from os.path import basename
import re
import textwrap

# External imports
from sphinx.errors import SphinxError

# Bokeh imports
from .bokeh_directive import BokehDirective
from .templates import JINJA_DETAIL

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'BokehJinjaDirective',
    'setup',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class BokehJinjaDirective(BokehDirective):

    has_content = True
    required_arguments = 1
    option_spec = {
        'noindex': lambda x: True, # directives.flag weirdly returns None
    }

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
        m = _DOCPAT.match(template_text)
        if m: doc = m.group(1)
        else: doc = None

        filename = basename(template.filename)
        rst_text = JINJA_DETAIL.render(
            name=template_name,
            module=module_path,
            objrepr=repr(template),
            noindex=self.options.get('noindex', False),
            doc="" if doc is None else textwrap.dedent(doc),
            filename=filename,
            template_text=_DOCPAT.sub("", template_text),
        )

        return self._parse(rst_text, "<bokeh-jinja>")

def setup(app):
    ''' Required Sphinx extension setup function. '''
    app.add_directive_to_domain('py', 'bokeh-jinja', BokehJinjaDirective)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_DOCPAT = re.compile(r"\{\#(.+?)\#\}", flags=re.MULTILINE|re.DOTALL)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

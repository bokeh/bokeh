#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Render versioned BokehJS script tags with SRI hashes.

This directive takes a js_files option to load versioned
BokehJS script tags based on the files in the string. If this option is
not provided, all BokehJS files will be included in the script tags:

.. code-block:: rest

    .. bokehjs-script-tag::
        :js_files: bokeh-widgets,bokeh-tables

This directive is identical to the standard ``code-block`` directive
that Sphinx supplies, with the addition of one new option:

js_files (string):
    A comma separated string of JavaScript files to look for.

Examples
--------

The inline example code above produces the following output:

.. bokehjs-script-tag::
    :js_files: bokeh-widgets,bokeh-tables

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from os.path import basename

# External imports
from docutils import nodes
from docutils.parsers.rst.directives import unchanged
from sphinx.directives.code import CodeBlock

# Bokeh imports
from .templates import BJS_SCRIPT_TAGS
from .util import get_codeblock_node, get_sphinx_resources

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'bokehjs_script',
    'BokehJSScript',
    'html_depart_bokehjs_script',
    'html_visit_bokehjs_script',
    'setup',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class bokehjs_script(nodes.General, nodes.Element):
    pass


class BokehJSScript(CodeBlock):

    option_spec = CodeBlock.option_spec
    option_spec.update(js_files=unchanged)

    def run(self):
        env = self.state.document.settings.env

        rst_source = self.state_machine.node.document['source']
        rst_filename = basename(rst_source)

        target_id = "%s.ccb-%d" % (rst_filename, env.new_serialno('ccb'))
        target_id = target_id.replace(".", "-")
        target_node = nodes.target('', '', ids=[target_id])

        node = bokehjs_script()
        node['target_id'] = target_id

        resources = get_sphinx_resources(include_bokehjs_api=False)

        js_components = self.options.get('js_files', 'all')
        if js_components != 'all':
            resources = self.get_modified_resources(js_components, resources)

        html_source = BJS_SCRIPT_TAGS.render(
            js_files=resources.js_files,
            hashes=resources.hashes)

        cb = get_codeblock_node(self, html_source, "html")
        node.setup_child(cb[0])
        node.children.append(cb[0])

        return [target_node, node]

    def get_modified_resources(self, components_str, resources):
        components = resources.components(kind='js')
        resource_components = ["bokeh"]

        components_split = components_str.split(',')

        for component in components:
            if component in components_split:
                resource_components.append(component)

        resources.js_components = resource_components

        return resources

def html_visit_bokehjs_script(self, node):
    self.body.append('<bokehjs-script-tag>')

def html_depart_bokehjs_script(self, node):
    self.body.append('</bokehjs-script-tag>')

def setup(app):
    ''' Required Sphinx extension setup function. '''
    app.add_node(
        bokehjs_script,
        html=(
            html_visit_bokehjs_script,
            html_depart_bokehjs_script
        )
    )
    app.add_directive('bokehjs-script-tag', BokehJSScript)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

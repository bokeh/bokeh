#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Make javascript code blocks also include a live link to codepen.io for instant experiementation.

This directive takes a title to use for the codepen example:

.. code-block:: rest

    .. bokehjs-contnet:: javascript
        :title: Some Code

        alert('this is called in the codepen');

This directive is identical to the standard ``code-block`` directive
that Sphinx supplies, with the addition of one new option:

title : string
    A title for the codepen.

Examples
--------

The inline example code above produces the following output:

.. bokehjs-content:: javascript
    :title: Some Code

    alert('this is called in the codepen');

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
from os.path import basename

# External imports
from docutils import nodes
from docutils.parsers.rst.directives import unchanged
# Bokeh imports
from sphinx.directives.code import CodeBlock
from .util import get_sphinx_resources
from .templates import BJS_PROLOGUE, BJS_EPILOGUE, BJS_CODEPEN_INIT



#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'bokehjs_content',
    'BokehJSContent',
    'html_depart_bokehjs_content',
    'html_visit_bokehjs_content',
    'setup',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class bokehjs_content(nodes.General, nodes.Element):
    pass


class BokehJSContent(CodeBlock):

    option_spec = CodeBlock.option_spec
    option_spec.update(title=unchanged)

    def run(self):
        env = self.state.document.settings.env

        rst_source = self.state_machine.node.document['source']
        rst_filename = basename(rst_source)

        target_id = "%s.ccb-%d" % (rst_filename, env.new_serialno('ccb'))
        target_id = target_id.replace(".", "-")
        target_node = nodes.target('', '', ids=[target_id])

        node = bokehjs_content()
        node['target_id'] = target_id
        node['title'] = self.options.get('title', "bokehjs example")
        node['include_bjs_header'] = False

        source_doc = self.state_machine.node.document
        if not hasattr(source_doc, 'bjs_seen'):
            #we only want to inject the CODEPEN_INIT on one
            #bokehjs-content block per page, here we check to see if
            #bjs_seen exists, if not set it to true, and set
            #node['include_bjs_header'] to true.  This way the
            #CODEPEN_INIT is only injected once per document (html
            #page)
            source_doc.bjs_seen = True
            node['include_bjs_header'] = True
        cb = CodeBlock.run(self)
        node.setup_child(cb[0])
        node.children.append(cb[0])
        return [target_node, node]

def html_visit_bokehjs_content(self, node):
    resources = get_sphinx_resources(include_bokehjs_api=True)
    script_block = ""
    for js_url in resources.js_files:
        script_block += '''
        <script type="text/javascript" src="%s"></script>
        ''' % js_url

    css_block = ""
    for css_url in resources.css_files:
        css_block += '''
        <link rel="stylesheet" href="%s" type="text/css" />
        ''' % css_url

    if node['include_bjs_header']:
        #we only want to inject the CODEPEN_INIT on one
        #bokehjs-content block per page
        self.body.append(BJS_CODEPEN_INIT.render(
            css_block=css_block,
            script_block=script_block))

    self.body.append(
        BJS_PROLOGUE.render(
            id=node['target_id'],
            title=node['title']))

def html_depart_bokehjs_content(self, node):
    self.body.append(BJS_EPILOGUE.render(
        title=node['title']))

def setup(app):
    ''' Required Sphinx extension setup function. '''
    app.add_node(
        bokehjs_content,
        html=(
            html_visit_bokehjs_content,
            html_depart_bokehjs_content
        )
    )
    app.add_directive('bokehjs-content', BokehJSContent)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Make javascript code blocks also include a live link to codepen.io for instant experiementation.

This directive must be inserted into pages using bokehjs-content, it inserts the codepen open link js into the top of the page

.. code-block:: rest

    .. bokehjs-preamble:




Examples
--------

The inline example code above produces the following output:

.. bokehjs-preamble:

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
from docutils.parsers.rst import Directive

# Bokeh imports
from .templates import BJS_PREAMBLE_BODY
from ..settings import settings
from ..resources import Resources
#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'bokehjs_preamble',
    'BokehJSPreamble',
    'html_depart_bokehjs_preamble',
    'html_visit_bokehjs_preamble',
    'setup',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class bokehjs_preamble(nodes.General, nodes.Element):
    pass

class BokehJSPreamble(Directive):
    has_content = False

    def run(self):
        env = self.state.document.settings.env

        rst_source = self.state_machine.node.document['source']
        rst_filename = basename(rst_source)

        target_id = "%s.ccb-%d" % (rst_filename, env.new_serialno('ccb'))
        target_id = target_id.replace(".", "-")
        target_node = nodes.target('', '', ids=[target_id])

        node = bokehjs_preamble()
        node['target_id'] = target_id

        return [target_node, node]

def html_visit_bokehjs_preamble(self, node):
    pass

def html_depart_bokehjs_preamble(self, node):

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
    
    self.body.append(BJS_PREAMBLE_BODY.render(
        css_block=css_block,
        script_block=script_block
    ))

def setup(app):
    ''' Required Sphinx extension setup function. '''
    app.add_node(
        bokehjs_preamble,
        html=(
            html_visit_bokehjs_preamble,
            html_depart_bokehjs_preamble
        )
    )
    app.add_directive('bokehjs-preamble', BokehJSPreamble)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
docs_cdn = settings.docs_cdn()

# if BOKEH_DOCS_CDN is unset just use default CDN resources
if docs_cdn is None:
    resources = Resources(mode="cdn", extra_js_components=["bokeh-api"])

else:
    # "BOKEH_DOCS_CDN=local" is used for building and displaying the docs locally
    if docs_cdn == "local":
        resources = Resources(mode="server", root_url="/en/latest/",
                              extra_js_components=["bokeh-api"])

    # "BOKEH_DOCS_CDN=test:newthing" is used for building and deploying test docs to
    # a one-off location "en/newthing" on the docs site
    elif docs_cdn.startswith("test:"):
        resources = Resources(
            mode="server", root_url="/en/%s/" % docs_cdn.split(":")[1],
            extra_js_components=["bokeh-api"])

    # Otherwise assume it is a dev/rc/full release version and use CDN for it
    else:
        resources = Resources(mode="cdn", version=docs_cdn,
                              extra_js_components=["bokeh-api"])

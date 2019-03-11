#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Display code blocks in collapsible sections when outputting to HTML.

This directive takes a heading to use for the collapsible code block:

.. code-block:: rest

    .. collapsible-code-block:: python
        :heading: Some Code

        from __future__ import print_function

        print("Hello, Bokeh!")

This directive is identical to the standard ``code-block`` directive
that Sphinx supplies, with the addition of one new option:

heading : string
    A heading to put for the collapsible block. Clicking the heading
    expands or collapses the block

Examples
--------

The inline example code above produces the following output:

.. collapsible-code-block:: python
    :heading: Some Code

    from __future__ import print_function

    print("Hello, Bokeh!")

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

from .templates import BJS_PROLOGUE, BJS_EPILOGUE

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'bokehjs_block',
    'BokehJSBlock',
    'html_depart_bokehjs_block',
    'html_visit_bokehjs_block',
    'setup',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class bokehjs_block(nodes.General, nodes.Element):
    pass


class BokehJSBlock(CodeBlock):

    option_spec = CodeBlock.option_spec
    option_spec.update(heading=unchanged)

    def run(self):
        env = self.state.document.settings.env

        rst_source = self.state_machine.node.document['source']
        rst_filename = basename(rst_source)

        target_id = "%s.ccb-%d" % (rst_filename, env.new_serialno('ccb'))
        target_id = target_id.replace(".", "-")
        target_node = nodes.target('', '', ids=[target_id])

        node = bokehjs_block()
        node['target_id'] = target_id
        node['heading'] = self.options.get('heading', "Code")

        cb = CodeBlock.run(self)
        node.setup_child(cb[0])
        node.children.append(cb[0])

        return [target_node, node]

def html_visit_bokehjs_block(self, node):
    self.body.append(
        BJS_PROLOGUE.render(
            id=node['target_id'],
            heading=node['heading']
        )
    )

def html_depart_bokehjs_block(self, node):
    self.body.append(BJS_EPILOGUE.render(
        heading=node['heading']))

def setup(app):
    ''' Required Sphinx extension setup function. '''
    app.add_node(
        bokehjs_block,
        html=(
            html_visit_bokehjs_block,
            html_depart_bokehjs_block
        )
    )
    app.add_directive('bokehjs-block', BokehJSBlock)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

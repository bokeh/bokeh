# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Display code blocks in collapsible sections when outputting to HTML.

This directive takes a heading to use for the collapsible code block:

.. code-block:: rest

    .. collapsible-code-block:: python
        :heading: Some Code

                print("Hello, Bokeh!")

This directive is identical to the standard ``code-block`` directive
that Sphinx supplies, with the addition of one new option:

heading (string):
    A heading to put for the collapsible block. Clicking the heading
    expands or collapses the block.



Examples
--------

The inline example code above produces the following output:

.. collapsible-code-block:: python
    :heading: Some Code

        print("Hello, Bokeh!")

"""

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
from __future__ import annotations

import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
from os.path import basename

# External imports
from docutils import nodes
from docutils.parsers.rst.directives import unchanged
from sphinx.directives.code import CodeBlock

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "collapsible_code_block",
    "CollapsibleCodeBlock",
    "setup",
)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


class collapsible_code_block(nodes.General, nodes.Element):
    @staticmethod
    def visit_html(visitor, node):
        heading = node["heading"]
        visitor.body.append(f"<details><summary>{heading}</summary>")

    @staticmethod
    def depart_html(visitor, _node):
        visitor.body.append("</details>")

    html = visit_html.__func__, depart_html.__func__


class CollapsibleCodeBlock(CodeBlock):

    option_spec = CodeBlock.option_spec
    option_spec.update(heading=unchanged)

    def run(self):
        env = self.state.document.settings.env

        rst_source = self.state_machine.node.document["source"]
        rst_filename = basename(rst_source)

        serial_no = env.new_serialno("ccb")
        target_id = f"{rst_filename}.ccb-{serial_no}"
        target_id = target_id.replace(".", "-")
        target_node = nodes.target("", "", ids=[target_id])

        node = collapsible_code_block()
        node["target_id"] = target_id
        node["heading"] = self.options.get("heading", "Code")

        cb = CodeBlock.run(self)
        node.setup_child(cb[0])
        node.children.append(cb[0])

        return [target_node, node]


def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_node(collapsible_code_block, html=collapsible_code_block.html)
    app.add_directive("collapsible-code-block", CollapsibleCodeBlock)


# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------

""" Display code blocks in collapsible sections when outputting
to HTML.

This directive takes a heading to use for the collapsible code block::

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

"""
from __future__ import absolute_import

from docutils import nodes
from docutils.parsers.rst.directives import unchanged
from os.path import basename

import jinja2

from sphinx.directives.code import CodeBlock


PROLOGUE_TEMPLATE = jinja2.Template(u"""
<div class="expander">
  <a href="javascript:void(0)" class="expander-trigger expander-hidden">{{ heading }}</a>
  <div class="expander-content">
""")

EPILOGUE_TEMPLATE = jinja2.Template(u"""
  </div>
</div>
""")


class collapsible_code_block(nodes.General, nodes.Element):
    pass


class CollapsibleCodeBlock(CodeBlock):

    option_spec = CodeBlock.option_spec
    option_spec.update(heading=unchanged)

    def run(self):
        env = self.state.document.settings.env

        rst_source = self.state_machine.node.document['source']
        rst_filename = basename(rst_source)

        target_id = "%s.ccb-%d" % (rst_filename, env.new_serialno('bokeh-plot'))
        target_id = target_id.replace(".", "-")
        target_node = nodes.target('', '', ids=[target_id])

        node = collapsible_code_block()
        node['target_id'] = target_id
        node['heading'] = self.options.get('heading', "Code")

        cb = CodeBlock.run(self)
        node.setup_child(cb[0])
        node.children.append(cb[0])

        return [target_node, node]

def html_visit_collapsible_code_block(self, node):
    self.body.append(
        PROLOGUE_TEMPLATE.render(
            id=node['target_id'],
            heading=node['heading']
        )
    )

def html_depart_collapsible_code_block(self, node):
    self.body.append(EPILOGUE_TEMPLATE.render())

def setup(app):
    app.add_node(
        collapsible_code_block,
        html=(
            html_visit_collapsible_code_block,
            html_depart_collapsible_code_block
        )
    )
    app.add_directive('collapsible-code-block', CollapsibleCodeBlock)

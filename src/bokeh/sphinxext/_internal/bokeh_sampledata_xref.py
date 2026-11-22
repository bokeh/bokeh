# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Link from sample data documentation to standalone examples.

The ``bokeh-sampledata-xref`` directive can be used by supplying:

    .. bokeh-sampledata-xref:: iris

This can be used to add links to all existing standalone examples in the
documentation.

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------
from os.path import basename
from pathlib import Path
from typing import Any

from docutils import nodes
from sphinx.locale import _

from . import PARALLEL_SAFE, SphinxParallelSpec
from .bokeh_directive import BokehDirective
from .bokeh_gallery import EXAMPLE_INVENTORY, read_example_inventory

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "BokehSampledataXrefDirective",
    "setup",
)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------

class sampledata_list(nodes.General, nodes.Element):

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        self.sampledata_key = kwargs.pop("sampledata_key")
        super().__init__(*args, **kwargs)

class BokehSampledataXrefDirective(BokehDirective):

    has_content = False
    required_arguments = 1

    def run(self) -> list[Any]:
        self.env.note_dependency(Path(self.env.doctreedir) / EXAMPLE_INVENTORY)
        return [sampledata_list('', sampledata_key=self.arguments[0])]


def setup(app: Any) -> SphinxParallelSpec:
    """ Required Sphinx extension setup function. """
    app.setup_extension("bokeh.sphinxext._internal.bokeh_gallery")
    app.add_node(sampledata_list)
    app.add_directive("bokeh-sampledata-xref", BokehSampledataXrefDirective)
    app.connect('doctree-resolved', process_sampledata_xrefs)
    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

def process_sampledata_xrefs(app: Any, doctree: Any, fromdocname: str) -> None:
    placeholders = list(doctree.findall(sampledata_list))
    if not placeholders:
        return

    inventory = Path(app.doctreedir) / EXAMPLE_INVENTORY
    backlinks = read_example_inventory(inventory)["sampledata"]
    for node in placeholders:
        docnames = backlinks.get(node.sampledata_key, [])
        if not docnames:
            node.replace_self([])
            continue

        list_ref_names = []
        para = nodes.paragraph()
        para += nodes.rubric('Examples', 'Examples')
        for docname in sorted(docnames, key=basename):
            ref_name = basename(docname)
            if ref_name in list_ref_names:
                ref_name += f" ({docname.split('/')[-2]})"
            list_ref_names.append(ref_name)
            para += add_bullet_point(app, fromdocname, docname, ref_name)
        node.replace_self([para])

def add_bullet_point(app: Any, fromdocname: str, docname: str, ref_name: str) -> Any:
    # Create references
    line = nodes.line()
    line += nodes.Text('  • ')
    newnode = nodes.reference('', '')
    innernode = nodes.emphasis(_(ref_name), _(ref_name))
    newnode['refdocname'] = docname
    newnode['refuri'] = app.builder.get_relative_uri(fromdocname, docname)
    newnode.append(innernode)
    line += newnode
    return line
# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------

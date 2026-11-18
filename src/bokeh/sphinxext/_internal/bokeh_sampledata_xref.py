# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Link from sample data documentation to standalone examples.

The ``bokeh-sampledata-xref`` directive can be used by supplying:

    .. bokeh-sampledata-xref:: sampledata_iris

This can be used to add links to all existing standalone examples in the
documentation.

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# use the wrapped sphinx logger
from sphinx.util import logging  # isort:skip
log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

from os.path import basename
from typing import Any

from docutils import nodes
from sphinx.locale import _

from . import PARALLEL_SAFE, SphinxParallelSpec
from .bokeh_directive import BokehDirective

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

Ref = dict[str, str]


class sampledata_list(nodes.General, nodes.Element):

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        self.sampledata_key = kwargs.pop("sampledata_key")
        super().__init__(*args, **kwargs)

class BokehSampledataXrefDirective(BokehDirective):

    has_content = False
    required_arguments = 1

    def run(self) -> list[Any]:
        return [sampledata_list('', sampledata_key=self.arguments[0])]


def setup(app: Any) -> SphinxParallelSpec:
    """ Required Sphinx extension setup function. """
    app.add_node(sampledata_list)
    app.add_directive("bokeh-sampledata-xref", BokehSampledataXrefDirective)
    app.connect('doctree-resolved', process_sampledata_xrefs)
    app.connect('env-purge-doc', purge_xrefs)
    app.connect('env-merge-info', merge_xrefs)
    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

def purge_xrefs(app: Any, env: Any, docname: str) -> None:
    if not hasattr(env, 'all_sampledata_xrefs'):
        return

    env.all_sampledata_xrefs = [
        xref for xref in env.all_sampledata_xrefs if xref['docname'] != docname
    ]

def merge_xrefs(app: Any, env: Any, docnames: list[str], other: Any) -> None:
    if not hasattr(env, 'all_sampledata_xrefs'):
        env.all_sampledata_xrefs = []

    if hasattr(other, 'all_sampledata_xrefs'):
        docnames_set = set(docnames)
        env.all_sampledata_xrefs.extend(ref for ref in other.all_sampledata_xrefs if ref['docname'] in docnames_set)

def process_sampledata_xrefs(app: Any, doctree: Any, fromdocname: str) -> None:

    env = app.builder.env

    if not hasattr(env, 'all_sampledata_xrefs'):
        env.all_sampledata_xrefs = []

    for node in doctree.findall(sampledata_list):

        refs: list[Ref] = []
        for s in env.all_sampledata_xrefs:
            if s["keyword"] == node.sampledata_key and s not in refs:
                refs.append(s)
        content: list[Any] = []
        if refs:
            list_ref_names = []
            para = nodes.paragraph()
            para += nodes.rubric('Examples', 'Examples')
            docnames = (ref["docname"] for ref in refs)
            for docname in sorted(docnames, key=basename):
                ref_name = basename(docname)
                if ref_name in list_ref_names:
                    ref_name += f" ({docname.split('/')[-2]})"
                list_ref_names.append(ref_name)
                para += add_bullet_point(app, fromdocname, docname, ref_name)
            content.append(para)
        node.replace_self(content)

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

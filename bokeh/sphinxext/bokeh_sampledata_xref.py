# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Include link from sampledata to gallery.

The ``bokeh-sampledata-xref`` directive can be used by supplying:

    .. bokeh-sampledata-xref:: sampledata_iris

This can be used to add links to all existing standalone examples in the documentation.

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

# Standard library imports
from os.path import basename

# External imports
from docutils import nodes
from sphinx.locale import _

# Bokeh imports
from . import PARALLEL_SAFE
from .bokeh_directive import BokehDirective
from .util import get_sphinx_resources

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "BokehSampledataXrefDirective",
    "setup",
)

RESOURCES = get_sphinx_resources()

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------

class sampledata_list(nodes.General, nodes.Element):
    def __init__(self, *args, **kwargs):
        self.sampledata_key = kwargs.pop("sampledata_key")
        super().__init__(*args, **kwargs)

class BokehSampledataXrefDirective(BokehDirective):

    has_content = False
    required_arguments = 1

    def run(self):
        return [sampledata_list('', sampledata_key=self.arguments[0])]


def setup(app):
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

def purge_xrefs(app, env, docname):
    if not hasattr(env, 'all_sampledata_xrefs'):
        return

    env.all_sampledata_xrefs = [
        xref for xref in env.all_sampledata_xrefs if xref['docname'] != docname
    ]

def merge_xrefs(app, env, docnames, other):
    if not hasattr(env, 'all_sampledata_xrefs'):
        env.all_sampledata_xrefs = []

    if hasattr(other, 'all_sampledata_xrefs'):
        env.all_sampledata_xrefs.extend(other.all_sampledata_xrefs)

def process_sampledata_xrefs(app, doctree, fromdocname):

    env = app.builder.env

    if not hasattr(env, 'all_sampledata_xrefs'):
        env.all_sampledata_xrefs = []

    for node in doctree.traverse(sampledata_list):

        content = []

        # TODO add missing tags for references in user_guide
        # only add links to the gallery at the moment
        sampledata_refs = []
        refuris = []
        for s in env.all_sampledata_xrefs:
            refuri = app.builder.get_relative_uri(
                fromdocname, s['docname']
            )
            if s["keyword"] == node.sampledata_key and "gallery" in refuri:
                sampledata_refs.append(s)
                refuris.append(refuri)

        _len = len(sampledata_refs)
        para = nodes.paragraph()
        if _len:
            s = '' if _len==1 else 's'
            description = (
                _(f'See the following example{s} that use this sample data set: ')
            )
        else:
            description = (_('There are no references for this sample data set'))
        para += nodes.Text(description, description)
        for i, (sample_info, refuri) in enumerate(zip(sampledata_refs, refuris)):
            # Create references
            newnode = nodes.reference('', '')
            ref_name = basename(sample_info['docname'])
            innernode = nodes.emphasis(_(ref_name), _(ref_name))
            newnode['refdocname'] = sample_info['docname']
            newnode['refuri'] = refuri
            newnode.append(innernode)
            para += newnode
            if 1<_len:
                _l =  _len-2
                if i == _l:
                    para += nodes.Text(' and ', ' and ')
                elif i < _l:
                    para += nodes.Text(', ', ', ')

        para += nodes.Text('.', '.')
        content.append(para)
        node.replace_self(content)

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------

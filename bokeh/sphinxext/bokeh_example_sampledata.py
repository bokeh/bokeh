# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Include link from sampledata to gallery.

The ``bokeh-example-sampledata`` directive can be used by supplying:

    .. bokeh-example-sampledata:: sampledata_iris

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
    "BokehExampleSampledataDirective",
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

class BokehExampleSampledataDirective(BokehDirective):
    has_content = False
    required_arguments = 1

    def run(self):
        return [sampledata_list('', sampledata_key=self.arguments[0])]


def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_node(sampledata_list)
    app.add_directive("bokeh-example-sampledata", BokehExampleSampledataDirective)
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

    env.all_sampledata_xrefs = [xref for xref in env.all_sampledata_xrefs if xref['docname'] != docname]

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
        sampladata_key = node.sampledata_key
        content = []

        this_sampladata_refs = []
        for sample_info in env.all_sampledata_xrefs:
            if sample_info['keyword'] == sampladata_key:
                this_sampladata_refs.append(sample_info)

        _len = len(this_sampladata_refs)
        para = nodes.paragraph()
        if _len:
            s = '' if _len==1 else 's'
            description = (
            _(f'Check out the demonstration{s} for the ``{sampladata_key}`` sampledata. See the example{s} '))
        else:
            description = (
            _(f'Well, there is no documented standalone example with the ``{sampladata_key}`` sampledata'))
        para += nodes.Text(description, description)
        for i, sample_info in enumerate(this_sampladata_refs):
            # Create all references
            newnode = nodes.reference('', '')
            ref_name = basename(sample_info['docname'])
            innernode = nodes.emphasis(_(ref_name), _(ref_name))
            newnode['refdocname'] = sample_info['docname']
            newnode['refuri'] = app.builder.get_relative_uri(
                fromdocname, sample_info['docname'])
            # TODO missing tags for references in user_guide
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

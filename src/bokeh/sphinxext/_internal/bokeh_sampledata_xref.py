# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Include link from sampledata to gallery.

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

class gallery_xrefs(nodes.General, nodes.Element):

    def __init__(self, *args, **kwargs):
        self.subfolder = kwargs.pop("subfolder", None)
        super().__init__(*args, **kwargs)

class BokehGalleryOverviewDirective(BokehDirective):

    has_content = False
    required_arguments = 1

    def run(self):
        return [gallery_xrefs('', subfolder=self.arguments[0])]

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
    app.add_directive("bokeh-example-index", BokehGalleryOverviewDirective)
    app.add_directive("bokeh-sampledata-xref", BokehSampledataXrefDirective)
    app.connect('doctree-resolved', process_sampledata_xrefs)
    app.connect('env-purge-doc', purge_xrefs)
    app.connect('env-merge-info', merge_xrefs)
    app.connect('doctree-resolved', process_gallery_overview)
    app.connect('env-purge-doc', purge_gallery_xrefs)
    app.connect('env-merge-info', merge_gallery_xrefs)
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

        refs = []
        for s in env.all_sampledata_xrefs:
            if s["keyword"] == node.sampledata_key and s not in refs:
                refs.append(s)
        content = []
        if refs:
            list_ref_names = []
            para = nodes.paragraph()
            para += nodes.rubric('Examples', 'Examples')
            for ref in sort_by_basename(refs):
                ref_name = ref['basename']
                if ref_name in list_ref_names:
                    ref_name += f" ({ref['docname'].split('/')[-2]})"
                list_ref_names.append(ref_name)
                para += add_bullet_point(app, fromdocname, ref['docname'], ref_name)
            content.append(para)
        node.replace_self(content)

def purge_gallery_xrefs(app, env, docname):
    if not hasattr(env, 'all_gallery_overview'):
        return

    env.all_gallery_overview = [
        xref for xref in env.all_gallery_overview if xref['docname'] != docname
    ]

def merge_gallery_xrefs(app, env, docnames, other):
    if not hasattr(env, 'all_gallery_overview'):
        env.all_gallery_overview = []

    if hasattr(other, 'all_gallery_overview'):
        env.all_gallery_overview.extend(other.all_gallery_overview)

def process_gallery_overview(app, doctree, fromdocname):

    env = app.builder.env

    if not hasattr(env, 'all_gallery_overview'):
        env.all_gallery_overview = []

    for node in doctree.traverse(gallery_xrefs):

        ref_dict = {}
        for s in env.all_gallery_overview:
            sp = s['docname'].split('/')
            if node.subfolder == 'all' or sp[-2] == node.subfolder:
                letter = sp[-1][0].upper()
                if letter in ref_dict and s not in ref_dict[letter]:
                    ref_dict[letter].append(s)
                else:
                    ref_dict[letter] = [s]

        content = []
        for letter, refs in sorted(ref_dict.items()):
            para = nodes.paragraph()
            para += nodes.rubric((_(letter)), (_(letter)))
            for ref in sort_by_basename(refs):
                docname = ref['docname']
                ref_name = basename(docname)
                if node.subfolder == 'all':
                    ref_name += f" ({docname.split('/')[-2]})"
                para += add_bullet_point(app, fromdocname, docname, ref_name)
            content.append(para)
        node.replace_self(content)

def sort_by_basename(refs):
    refs = [{'basename':basename(ref['docname']), 'docname': ref['docname']} for ref in refs]
    sorted_refs = []
    for key in sorted([basename(ref['basename']) for ref in refs]):
        for i, value in enumerate(refs):
            if key == value['basename']:
                sorted_refs.append(refs.pop(i))
    return sorted_refs

def add_bullet_point(app, fromdocname, docname, ref_name):
    # Create references
    line = nodes.line()
    line += nodes.Text('  • ','  • ')
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

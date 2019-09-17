#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Generate a ``sitemap.txt`` to aid with search indexing.

``sitemap.txt`` is a plain text list of all the pages in the docs site.
Each URL is listed on a line in the text file. It is machine readable
and used by search engines to know what pages are available for indexing.

All that is required to generate the sitemap is to list this module
``bokeh.sphinxext.sitemap`` in the list of extensions in the Sphinx
configuration file ``conf.py``.

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
from os.path import join

# External imports
from sphinx.errors import SphinxError
from sphinx.util import status_iterator

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'build_finished',
    'html_page_context',
    'setup',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def html_page_context(app, pagename, templatename, context, doctree):
    ''' Collect page names for the sitemap as HTML pages are built.

    '''
    site = context['SITEMAP_BASE_URL']
    version = context['version']
    app.sitemap_links.add(site + version + '/' + pagename + ".html")

def build_finished(app, exception):
    ''' Generate a ``sitemap.txt`` from the collected HTML page links.

    '''
    filename = join(app.outdir, "sitemap.txt")

    links_iter = status_iterator(sorted(app.sitemap_links),
                                 'adding links to sitemap... ',
                                 'brown',
                                 len(app.sitemap_links),
                                 app.verbosity)

    try:
        with open(filename, 'w') as f:
            for link in links_iter:
                f.write("%s\n" % link)
    except OSError as e:
        raise SphinxError('cannot write sitemap.txt, reason: %s' % e)

def setup(app):
    ''' Required Sphinx extension setup function. '''
    app.connect('html-page-context', html_page_context)
    app.connect('build-finished',    build_finished)
    app.sitemap_links = set()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

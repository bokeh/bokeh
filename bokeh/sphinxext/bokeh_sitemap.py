""" Generate a ``sitemap.txt`` to aid with search indexing.

``sitemap.txt`` is a plain text list of all the pages in the docs site.
Each URL is listed on a line in the text file. It is machine readable
and used by search engines to know what pages are available for indexing.

All that is required to generate the sitemap is to list this module
``bokeh.sphinxext.sitemap`` in the list of extensions in the Sphinx
configuration file ``conf.py``.

"""
from __future__ import absolute_import

from os.path import join

from sphinx.errors import SphinxError
from sphinx.util import status_iterator

def html_page_context(app, pagename, templatename, context, doctree):
    """ Collect page names for the sitemap as HTML pages are built.

    """
    site = context['SITEMAP_BASE_URL']
    version = context['version']
    app.sitemap_links.add(site + version + '/' + pagename + ".html")

def build_finished(app, exception):
    """ Generate a ``sitemap.txt`` from the collected HTML page links.

    """
    filename = join(app.outdir, "sitemap.txt")

    links_iter = status_iterator(sorted(app.sitemap_links),
                                 'adding links to sitemap... ',
                                 'brown',
                                 len(app.sitemap_links))

    try:
        with open(filename, 'w') as f:
            for link in links_iter:
                f.write("%s\n" % link)
    except OSError as e:
        raise SphinxError('cannot write sitemap.txt, reason: %s' % e)

def setup(app):
    app.connect('html-page-context', html_page_context)
    app.connect('build-finished',    build_finished)
    app.sitemap_links = set()

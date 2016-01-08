""" Generate a sitemap.txt to aid with search indexing.

"""
def setup(app):
    app.connect('html-page-context', add_html_link)
    app.connect('build-finished', create_sitemap)
    app.sitemap_links = []


def add_html_link(app, pagename, templatename, context, doctree):
    """As each page is built, collect page names for the sitemap"""
    site = context['SITEMAP_BASE_URL']
    version = context['version']
    app.sitemap_links.append(site + version + '/' + pagename + ".html")


def create_sitemap(app, exception):
    """Generates the sitemap.xml from the collected HTML page links"""

    filename = app.outdir + "/sitemap.txt"
    print("Generating sitemap.txt in %s" % filename)

    with open(filename, 'w') as f:
        for link in app.sitemap_links:
            f.write(link)
            f.write('\n')

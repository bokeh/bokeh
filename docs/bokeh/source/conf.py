# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
import os
import re
from datetime import date

from sphinx.util import logging

# Bokeh imports
from bokeh import __version__
from bokeh.settings import settings

# -- Project configuration -----------------------------------------------------

author = "Bokeh Contributors"
year = date.today().year

copyright = f"©{year} {author}."

project = "Bokeh"

release = version = settings.docs_version() or __version__

# -- Sphinx configuration -----------------------------------------------------

add_module_names = False

exclude_patterns = ["docs/includes/*", "docs/releases/*"]

extensions = [
    "sphinxext.opengraph",
    "sphinx_copybutton",
    "sphinx_design",
    "sphinx_favicon",
    "sphinx.ext.autodoc",
    "sphinx.ext.autosummary",
    "sphinx.ext.ifconfig",
    "sphinx.ext.napoleon",
    "sphinx.ext.intersphinx",
    "sphinx.ext.viewcode",
    "bokeh.sphinxext.bokeh_autodoc",
    "bokeh.sphinxext.bokeh_dataframe",
    "bokeh.sphinxext.bokeh_color",
    "bokeh.sphinxext.bokeh_enum",
    "bokeh.sphinxext.bokeh_example_metadata",
    "bokeh.sphinxext.bokeh_gallery",
    "bokeh.sphinxext.bokeh_jinja",
    "bokeh.sphinxext.bokeh_model",
    "bokeh.sphinxext.bokeh_options",
    "bokeh.sphinxext.bokeh_palette",
    "bokeh.sphinxext.bokeh_palette_group",
    "bokeh.sphinxext.bokeh_plot",
    "bokeh.sphinxext.bokeh_prop",
    "bokeh.sphinxext.bokeh_releases",
    "bokeh.sphinxext.bokeh_roles",
    "bokeh.sphinxext.bokeh_sampledata_xref",
    "bokeh.sphinxext.bokeh_settings",
    "bokeh.sphinxext.bokeh_sitemap",
    "bokeh.sphinxext.bokehjs_content",
]

needs_sphinx = "4.3.2"

rst_epilog = open("rst_epilog.txt").read()

# -- Extensions configuration --------------------------------------------------

autodoc_member_order = "groupwise"

autodoc_type_aliases = {
    "ArrayLike": "ArrayLike",  # This avoids complicated Unions in generated docs
}

bokeh_example_subdirs = [
    "advanced/extensions",
    "basic/annotations",
    "basic/areas",
    "basic/axes",
    "basic/bars",
    "basic/data",
    "basic/layouts",
    "basic/lines",
    "basic/scatters",
    "styling/visuals",
    "styling/plots",
    "styling/mathtext",
    "styling/themes",
    "interaction/js_callbacks",
    "interaction/legends",
    "interaction/linking",
    "interaction/tools",
    "interaction/tooltips",
    "interaction/widgets",
    "models",
    "plotting",
    "output/webgl",
    "topics/categorical",
    "topics/hierarchical",
    "topics/contour",
    "topics/geo",
    "topics/graph",
    "topics/hex",
    "topics/images",
    "topics/pie",
    "topics/stats",
    "topics/timeseries",
]

bokeh_missing_google_api_key_ok = False

if not bokeh_missing_google_api_key_ok:
    if "GOOGLE_API_KEY" not in os.environ:
        raise RuntimeError("\n\nThe GOOGLE_API_KEY environment variable is not set. Set GOOGLE_API_KEY to a valid API key, "
                           "or set bokeh_missing_google_api_key_ok=True in conf.py to build anyway (with broken GMaps)")

bokeh_plot_pyfile_include_dirs = ["docs"]

bokeh_sampledata_xref_skiplist = [
    "examples/basic/data/ajax_source.py",
    "examples/basic/data/server_sent_events_source.py",
    "examples/basic/layouts/custom_layout.py",
    "examples/styling/dom/css_classes.py",
    "examples/models/widgets.py",
]

copybutton_prompt_text = ">>> "

intersphinx_mapping = {
    "numpy"       : ("https://numpy.org/doc/stable/", None),
    "pandas"      : ("https://pandas.pydata.org/pandas-docs/stable/", None),
    "python"      : ("https://docs.python.org/3/", None),
    "sphinx"      : ("https://www.sphinx-doc.org/en/master/", None),
    "xyzservices" : ("https://xyzservices.readthedocs.io/en/stable/", None),
}

napoleon_include_init_with_doc = True

ogp_site_url = "https://docs.bokeh.org/en/latest/"
ogp_image = "http://static.bokeh.org/og/logotype-on-hex.png"
ogp_custom_meta_tags = [
    '<meta name="image" property="og:image" content="http://static.bokeh.org/og/logotype-on-hex.png">',
]

pygments_style = "sphinx"

# suppress some useless and annoying messages from sphinx.ext.viewcode
logging.getLogger("sphinx.ext.viewcode").logger.addFilter(lambda rec: not rec.msg.startswith("Didn't find"))

# -- Options for HTML output ---------------------------------------------------

html_context = {
    "default_mode": "light",
    "AUTHOR": author,
    "DESCRIPTION": "Bokeh visualization library, documentation site.",
    "SITEMAP_BASE_URL": "https://docs.bokeh.org/en/", # Trailing slash is needed
    "VERSION": version,
}

html_css_files = ["custom.css"]

html_static_path = ["_static"]

html_theme ="pydata_sphinx_theme"

html_title = f"{project} {version} Documentation"

# avoid CORS error on local docs build for the switcher.json file
if "BOKEH_DOCS_VERSION" in os.environ:
    json_url = "https://docs.bokeh.org/switcher.json"
else:
    json_url = "../switcher.json"
if "dev" in version or "rc" in version:
    version_match = "dev-" + re.match(r"\d\.\d+", version).group()
else:
    version_match = version

# html_logo configured in navbar-logo.html

html_theme_options = {
    "analytics": {
        "plausible_analytics_domain": "docs.bokeh.org",
        "plausible_analytics_url": "https://plausible.io/js/script.js",
    },
    "external_links": [
        {"name": "Tutorial",  "url": "https://mybinder.org/v2/gh/bokeh/tutorial/main?filepath=notebooks%2F01_introduction.ipynb"},
        {"name": "Community", "url": "https://discourse.bokeh.org"},
    ],
    "github_url": "https://github.com/bokeh/bokeh",
    "navbar_align": "left",
    "navbar_end": ["navbar-icon-links"],
    "navbar_start": ["navbar-logo", "version-switcher"],
    "pygment_light_style": "xcode",
    "secondary_sidebar_items": ["page-toc", "edit-this-page"],
    "show_nav_level": 2,
    "show_toc_level": 1,
    "switcher": {
        "json_url": json_url,
        "version_match": version_match,
    },
    "use_edit_page_button": False,
    "show_version_warning_banner": True,
    "header_links_before_dropdown": 8,
}

html_sidebars = {
    "docs/examples/**": [],
    "docs/gallery": [],
    "index": [],
    "*.rst": ["search-field.html", "sidebar-nav-bs.html"],
    "dev_guide/**": ["search-field.html", "sidebar-nav-bs.html"],
    "first_steps/**": ["search-field.html", "sidebar-nav-bs.html"],
    "reference/**": ["search-field.html", "sidebar-nav-bs.html"],
    "releases/**": ["search-field.html", "sidebar-nav-bs.html"],
    "user_guide/**": ["search-field.html", "sidebar-nav-bs.html"],
}

favicons = [
    {
        "rel": "icon",
        "sizes": "16x16",
        "href": "https://static.bokeh.org/favicon/favicon-16x16.png",
    },
    {
        "rel": "icon",
        "sizes": "32x32",
        "href": "https://static.bokeh.org/favicon/favicon-32x32.png",
    },
    {
        "rel": "apple-touch-icon",
        "sizes": "180x180",
        "href": "https://static.bokeh.org/favicon/apple-touch-icon.png",
    },
]

templates_path = ["_templates"]

def setup(app):
    app.add_object_type("confval", "confval", objname="configuration value", indextemplate="pair: %s; configuration value")
    app.add_js_file(None, body=f"const BOKEH_CURRENT_VERSION = {version!r};", priority=100)
    app.add_js_file("custom.js")

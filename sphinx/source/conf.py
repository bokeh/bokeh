# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
import os
from datetime import date

# Bokeh imports
from bokeh import __version__
from bokeh.settings import settings

# -- Project configuration -----------------------------------------------------

author = "Bokeh Contributors"
year = date.today().year

copyright = f"©{year} {author}."

project = 'Bokeh'

version = settings.docs_version() or __version__

# -- Sphinx configuration -----------------------------------------------------

add_module_names = False

exclude_patterns = ['docs/releases/*']

extensions = [
    'autoclasstoc',
    'sphinxext.opengraph',
    'sphinx_copybutton',
    'sphinx_panels',
#    'sphinx_reredirects',
    'sphinx_tabs.tabs',
    'sphinx.ext.autodoc',
    'sphinx.ext.autosummary',
    'sphinx.ext.ifconfig',
    'sphinx.ext.napoleon',
    'sphinx.ext.intersphinx',
    'sphinx.ext.viewcode',
    'bokeh.sphinxext.bokeh_autodoc',
    'bokeh.sphinxext.bokeh_dataframe',
    'bokeh.sphinxext.bokeh_color',
    'bokeh.sphinxext.bokeh_enum',
    'bokeh.sphinxext.bokeh_example_metadata',
    'bokeh.sphinxext.bokeh_gallery',
    'bokeh.sphinxext.bokeh_jinja',
    'bokeh.sphinxext.bokeh_model',
    'bokeh.sphinxext.bokeh_options',
    'bokeh.sphinxext.bokeh_palette',
    'bokeh.sphinxext.bokeh_palette_group',
    'bokeh.sphinxext.bokeh_plot',
    'bokeh.sphinxext.bokeh_prop',
    'bokeh.sphinxext.bokeh_releases',
    'bokeh.sphinxext.bokeh_roles',
    'bokeh.sphinxext.bokeh_settings',
    'bokeh.sphinxext.bokeh_sitemap',
    'bokeh.sphinxext.bokehjs_content',
    'bokeh.sphinxext.collapsible_code_block',
]

needs_sphinx = '4.3.2'

rst_epilog = open("rst_epilog.txt").read()

# -- Extensions configuration --------------------------------------------------

autoclasstoc_sections = [
        'public-attrs',
        'public-methods',
]

autodoc_member_order = 'groupwise'

copybutton_prompt_text = ">>> "

bokeh_missing_google_api_key_ok = False

if not bokeh_missing_google_api_key_ok:
    if "GOOGLE_API_KEY" not in os.environ:
        raise RuntimeError("\n\nThe GOOGLE_API_KEY environment variable is not set. Set GOOGLE_API_KEY to a valid API key, "
                           "or set bokeh_missing_google_api_key_ok=True in conf.py to build anyway (with broken GMaps)")

bokeh_plot_pyfile_include_dirs = ['docs']

intersphinx_mapping = {
    'numpy'       : ('https://numpy.org/doc/stable/', None),
    'pandas'      : ('https://pandas.pydata.org/pandas-docs/stable/', None),
    'python'      : ('https://docs.python.org/3/', None),
    'sphinx'      : ('https://www.sphinx-doc.org/en/master/', None),
    'xyzservices' : ('https://xyzservices.readthedocs.io/en/stable/', None),
}

napoleon_include_init_with_doc = True

ogp_site_url = 'https://docs.bokeh.org/en/latest/'
ogp_image = 'http://static.bokeh.org/og/logotype-on-hex.png'
ogp_custom_meta_tags = [
    '<meta name="twitter:card" content="summary_large_image" />',
    '<meta property="twitter:site" content="@bokeh" />',
    '<meta name="image" property="og:image" content="http://static.bokeh.org/og/logotype-on-hex.png">',
]

panels_add_bootstrap_css = False

sphinx_tabs_disable_tab_closing = True

pygments_style = 'sphinx'

redirects = {
    "docs/installation": "first_steps/installation.html",
    "docs/user_guide/quickstart": "../first_steps.html",
}

# -- Options for HTML output ---------------------------------------------------

html_context = {
    'AUTHOR': author,
    'DESCRIPTION': 'Bokeh visualization library, documentation site.',
    'SITEMAP_BASE_URL': 'https://docs.bokeh.org/en/', # Trailing slash is needed
    'VERSION': version,
}

html_css_files = [f"custom.css?v={version}"]

html_static_path = ['_static']

html_theme ='pydata_sphinx_theme'

html_theme_options = {
    'external_links': [
        {'name': 'Tutorial',  'url': 'https://mybinder.org/v2/gh/bokeh/bokeh-notebooks/master?filepath=tutorial%2F00%20-%20Introduction%20and%20Setup.ipynb'},
        {'name': 'Community', 'url': 'https://discourse.bokeh.org'}
    ],
    'github_url': 'https://github.com/bokeh/bokeh',
    'google_analytics_id': 'UA-27761864-7',
    "navbar_align": "left",
    'show_toc_level': 2,
    'twitter_url': 'https://twitter.com/bokeh',
}

html_sidebars = {
  "docs/gallery": [],
  "docs/gallery/**": [],
  "index": [],
}

html_title = f"{project} {version} Documentation"

templates_path = ['_templates']

def setup(app):
    app.add_object_type('confval', 'confval', objname='configuration value', indextemplate='pair: %s; configuration value')
    app.add_js_file(None, body=f"const BOKEH_CURRENT_VERSION = {version!r};", priority=100)
    app.add_js_file("custom.js")

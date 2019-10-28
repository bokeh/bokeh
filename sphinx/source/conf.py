# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from bokeh import __version__

# -- General configuration -----------------------------------------------------

# If your documentation needs a minimal Sphinx version, state it here.
needs_sphinx = '1.8'

# Add any Sphinx extension module names here, as strings. They can be extensions
# coming with Sphinx (named 'sphinx.ext.*') or your custom ones.
extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.autosummary',
    'sphinx.ext.ifconfig',
    'sphinx.ext.napoleon',
    'sphinx.ext.intersphinx',
    'sphinx.ext.viewcode',
    'bokeh.sphinxext.bokeh_autodoc',
    'bokeh.sphinxext.bokeh_color',
    'bokeh.sphinxext.bokeh_enum',
    'bokeh.sphinxext.bokeh_gallery',
    'bokeh.sphinxext.bokeh_github',
    'bokeh.sphinxext.bokeh_jinja',
    'bokeh.sphinxext.bokeh_model',
    'bokeh.sphinxext.bokeh_options',
    'bokeh.sphinxext.bokeh_palette',
    'bokeh.sphinxext.bokeh_palette_group',
    'bokeh.sphinxext.bokeh_plot',
    'bokeh.sphinxext.bokeh_prop',
    'bokeh.sphinxext.bokeh_releases',
    'bokeh.sphinxext.bokeh_settings',
    'bokeh.sphinxext.bokeh_sitemap',
    'bokeh.sphinxext.bokehjs_content',
    'bokeh.sphinxext.collapsible_code_block',
    'bokeh.sphinxext.theme',
]

napoleon_include_init_with_doc = True

# Add any paths that contain templates here, relative to this directory.
templates_path = ['_templates']

# The suffix of source filenames.
source_suffix = '.rst'

# The master toctree document.
master_doc = 'index'

# General information about the project.
project = 'Bokeh'

# The short X.Y version.
version = __version__

# The full version, including alpha/beta/rc tags.
release = __version__

# Check for version override (e.g. when re-deploying a previously released
# docs, or when pushing test docs that do not have a corresponding BokehJS
# available on CDN)
from bokeh.settings import settings
if settings.docs_version():
    version = release = settings.docs_version()

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
#
# NOTE: in these docs all .py script are assumed to be bokeh plot scripts!
# with bokeh_plot_pyfile_include_dirs set desired folder to look for .py files
bokeh_plot_pyfile_include_dirs = ['docs']

# Whether to allow builds to succeed if a Google API key is not defined and plots
# containing "GOOGLE_API_KEY" are processed
bokeh_missing_google_api_key_ok = False

# If true, the current module name will be prepended to all description
# unit titles (such as .. function::).
add_module_names = False

# The name of the Pygments (syntax highlighting) style to use.
pygments_style = 'sphinx'

# Sort members by type
autodoc_member_order = 'groupwise'

# patterns to exclude
exclude_patterns = ['docs/releases/*']

# This would more properly be done with rst_epilog but something about
# the combination of this with the bokeh-gallery directive breaks the build
rst_prolog = """
.. |Color|              replace:: :py:class:`~bokeh.core.properties.Color`
.. |DataSpec|           replace:: :py:class:`~bokeh.core.properties.DataSpec`
.. |Document|           replace:: :py:class:`~bokeh.document.Document`
.. |HasProps|           replace:: :py:class:`~bokeh.core.has_props.HasProps`
.. |Model|              replace:: :py:class:`~bokeh.model.Model`
.. |Property|           replace:: :py:class:`~bokeh.core.property.bases.Property`
.. |PropertyDescriptor| replace:: :py:class:`~bokeh.core.property.descriptor.PropertyDescriptor`
.. |PropertyContainer|  replace:: :py:class:`~bokeh.core.property.wrappers.PropertyContainer`
.. |UnitsSpec|          replace:: :py:class:`~bokeh.core.properties.UnitsSpec`
.. |field|              replace:: :py:func:`~bokeh.core.properties.field`
.. |value|              replace:: :py:func:`~bokeh.core.properties.value`
"""

# -- Options for HTML output ---------------------------------------------------

html_theme = 'bokeh'
html_theme_path = ['.']

html_context = {
    'VERSION': version,
    'SITEMAP_BASE_URL': 'https://docs.bokeh.org/en/', # Trailing slash is needed
    'DESCRIPTION': 'Bokeh visualization library, documentation site.',
    'AUTHOR': 'Bokeh contributors',
}

intersphinx_mapping = {
    'python' : ('https://docs.python.org/3/', None),
    'pandas' : ('http://pandas.pydata.org/pandas-docs/stable/', None),
    'numpy'  : ('https://docs.scipy.org/doc/numpy/', None)
}

from bokeh import __version__
from bokeh.settings import settings

# -- Project configuration -----------------------------------------------------

author = "Bokeh Contributors"

copyright = f"©2019 {author}."

project = 'Bokeh'

version = settings.docs_version() or __version__

# -- Sphinx configuration -----------------------------------------------------

add_module_names = False

exclude_patterns = ['docs/releases/*']

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

needs_sphinx = '1.8'

rst_epilog = """
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

# -- Extensions configuration --------------------------------------------------

autodoc_member_order = 'groupwise'

bokeh_missing_google_api_key_ok = False

bokeh_plot_pyfile_include_dirs = ['docs']

intersphinx_mapping = {
    'python' : ('https://docs.python.org/3/', None),
    'pandas' : ('https://pandas.pydata.org/pandas-docs/stable/', None),
    'numpy'  : ('https://docs.scipy.org/doc/numpy/', None)
}

napoleon_include_init_with_doc = True

pygments_style = 'sphinx'

# -- Options for HTML output ---------------------------------------------------

html_context = {
    'AUTHOR': author,
    'DESCRIPTION': 'Bokeh visualization library, documentation site.',
    'SITEMAP_BASE_URL': 'https://docs.bokeh.org/en/', # Trailing slash is needed
    'VERSION': version,
}

html_theme = 'bokeh'

html_theme_path = ['.']

html_title = f"{project} {version} Documentation"

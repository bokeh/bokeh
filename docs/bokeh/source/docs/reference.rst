.. _refguide:

Reference
#########

.. toctree::
    :maxdepth: 2
    :hidden:
    :glob:

    reference/bokeh
    reference/*

This section provides the complete public API reference for Bokeh,
auto-generated from the docstrings in the project source code.

The full list of sections for all the modules in Bokeh is accessible from
the sidebar to the left. Listed below are a few selected sections that may
be especially useful.

:ref:`bokeh.models`
    Everything that comprises a Bokeh plot or application---tools, controls,
    glyphs, data sources---is a :ref:`Bokeh Model <bokeh.model>`. Bokeh
    models are configured by setting values their various properties.
    This large section has a reference for every Bokeh model, including
    information about every property of each model.

:ref:`bokeh.plotting`
    The |bokeh.plotting| API is centered around the |figure| command and the
    associated glyph functions such as
    :func:`~bokeh.plotting.figure.circle`,
    :func:`~bokeh.plotting.figure.wedge`, etc.
    This section has detailed information on these elements.

:ref:`bokeh.layouts`
    The simplest way to combine multiple Bokeh plots and controls in a
    single document is to use the layout functions such as
    :func:`~bokeh.layouts.row`, :func:`~bokeh.layouts.column`, etc.
    from the ``bokeh.layouts`` module.

:ref:`bokeh.io`
    Functions for controlling where and how Bokeh documents are saved
    or shown, such as |output_file| and |output_notebook|, are in this module.

:ref:`bokeh.palettes`
    This section provides visual representations of all the palettes
    built into Bokeh.

:ref:`bokeh.settings`
    All Bokeh-related environment variables, which can be used to control
    things like resources, minification, and log levels, are documented here.

Linking to the Bokeh documentation
----------------------------------

Developers of other packages that make use of Bokeh might want to use
`intersphinx <https://www.sphinx-doc.org/en/master/usage/extensions/intersphinx.html>`_
to link to specific classes or functions in the Bokeh docs from their Sphinx
documentation. The file needed for that is located at
``https://docs.bokeh.org/en/<version>/``
where ``<version>`` can be the number of a released version, or "latest". For example
the entry in the ``conf.py`` file for Sphinx might look like this:

.. code-block:: python

    intersphinx_mapping = {'bokeh': ('https://docs.bokeh.org/en/latest/', None)}

.. _installation:

Installation details
====================

This section provides more detailed information about installing Bokeh. This
includes details about Bokeh's prerequisites as well as Bokeh's required and
optional dependencies.

Supported platforms
-------------------

Bokeh is officially supported (and continuously tested) on CPython versions
3.7+ only. It's possible that Bokeh does work on other versions of Python, but
no guarantees or support are provided.

Installing with ``conda`` or ``pip``
------------------------------------

The easiest way to install Bokeh is to use ``conda``. Conda is part of the
`Anaconda Python Distribution`_, which is designed with scientific and data
analysis applications like Bokeh in mind.

If you use Anaconda on your system, installing with ``conda`` is the recommended
method. Otherwise, use ``pip``.


.. panels::

    Installing with ``conda``
    ^^^^^^^^^^^^^^^^^^^^^^^^^

    Make sure you have either `Anaconda`_ or `Miniconda`_ installed. Use
    this command to install Bokeh:

    .. code-block:: sh

        conda install bokeh

    ---

    Installing with ``pip``
    ^^^^^^^^^^^^^^^^^^^^^^^

    Use this command to install Bokeh:

    .. code-block:: sh

        pip install bokeh

    .. note::
        On some systems, pip displays an error message about the wheel package
        when installing tornado. This is a `known issue`_, you can usually
        ignore the error.

Checking your installation
--------------------------

To verify whether the installation was successful, use this command:

.. code-block:: sh

    bokeh info

You should see, among other things, a line with information on the installed
version of Bokeh.

If you receive an error instead, try searching for more information by using
the `"bokeh" tag on Stack Overflow`_ or asking a question in the
`Bokeh Discourse`_ community.

.. tip::
    Once you have Bokeh installed, build your first visualization by following
    the :ref:`first steps guides <first_steps_overview>`.

    Check the :ref:`user guide <userguide>` for a comprehensive overview of all
    the things you can do with Bokeh.

Installing for development
--------------------------

If you want to install a development version of Bokeh to contribute to the project,
please see the :ref:`devguide_setup` instructions in the :ref:`devguide`.

.. _install_required:

Installing required dependencies
--------------------------------

For basic usage, Bokeh requires the following libraries:

.. code::

    PyYAML>=3.10
    python-dateutil>=2.1
    Jinja2>=2.7
    numpy>=1.11.3
    pillow>=7.1.0
    packaging>=16.8
    tornado>=5.1
    typing_extensions >=3.7.4

All those packages are automatically installed if you use ``conda`` or
``pip``.

.. _install_optional:

Installing optional dependencies
--------------------------------

In addition to the required dependencies, some additional packages are
necessary for certain optional features:

Jupyter
    Bokeh can display content in classic Jupyter notebooks as well as in
    JupyterLab. Depending on your setup, there may be additional packages or
    Jupyter extensions to install. See :ref:`userguide_jupyter` for full
    details.

NodeJS
    Necessary for :ref:`userguide_extensions` or for defining
    ``CustomJS`` implementations in TypeScript.

NetworkX
    Necessary to use the :func:`~bokeh.plotting.graph.from_networkx` function
    to generate Bokeh graph renderers directly from NetworkX data.

pandas
    Necessary for the :func:`~bokeh.plotting.Figure.hexbin` function.
    Additionally, having pandas installed makes some aspects of Bokeh simpler
    to use. For example, glyph functions are able to automatically convert
    pandas DataFrames to Bokeh data sources.

psutil
    Necessary to enable detailed memory logging in the Bokeh server.

Selenium, GeckoDriver, Firefox
    Necessary for :ref:`userguide_export` to PNG and SVG images.

Sphinx
    Necessary to make use of the ``bokeh.sphinxext`` Sphinx extension for
    including Bokeh plots in Sphinx documentation.

.. _install_sampledata:

Installing sample data
----------------------

Optionally, Bokeh can download and install a collection of sample data. This
includes a variety of freely available data tables and databases that you can
use with Bokeh. Because this sample data is rather large, it is not included in
Bokeh's installation packages.

In `Bokeh's GitHub repository`_, you can find a number of examples. Those
examples also use this sample data.

After installing Bokeh, you can automatically download and install the
sample data with this command:

.. code-block:: sh

    bokeh sampledata

Alternatively, you can download and install the sample data from within your
Python code:

.. code-block:: python

    import bokeh.sampledata
    bokeh.sampledata.download()

If you want to change the location where Bokeh stores the sample data, check
the |bokeh.sampledata| reference for details.

.. _install_bokehjs:

Installing standalone BokehJS
-----------------------------

BokehJS is Bokeh's client-side runtime library. You can also use BokehJS as a
standalone JavaScript library. To do so, download the code from Bokeh's content
delivery network (CDN) at ``cdn.bokeh.org``. The CDN uses the following naming
scheme::

    # Javascript files
    https://cdn.bokeh.org/bokeh/release/bokeh-x.y.z.min.js
    https://cdn.bokeh.org/bokeh/release/bokeh-widgets-x.y.z.min.js
    https://cdn.bokeh.org/bokeh/release/bokeh-tables-x.y.z.min.js
    https://cdn.bokeh.org/bokeh/release/bokeh-api-x.y.z.min.js

There are additional components to BokehJS that are necessary only for specific
use cases:

* The ``"-widgets"`` files are only necessary if you are using any of the
  widgets built into Bokeh in ``bokeh.models.widgets``.
* The ``"-tables"`` files are only necessary if you are using Bokeh data
  tables.
* The ``"bokeh-api"`` files are required to use the BokehJS API and must be
  loaded *after* the core BokehJS library.

For example, the links for version ``2.0.1`` are:

* https://cdn.bokeh.org/bokeh/release/bokeh-2.0.1.min.js
* https://cdn.bokeh.org/bokeh/release/bokeh-widgets-2.0.1.min.js
* https://cdn.bokeh.org/bokeh/release/bokeh-tables-2.0.1.min.js
* https://cdn.bokeh.org/bokeh/release/bokeh-api-2.0.1.min.js

.. note::
    You should always set ``crossorigin="anonymous"`` on script tags that load
    BokehJS from CDN.

.. _Anaconda Python Distribution: http://anaconda.com/anaconda
.. _Anaconda: https://www.anaconda.com/products/individual#Downloads
.. _Miniconda: https://docs.conda.io/en/latest/miniconda.html
.. _known issue: https://github.com/tornadoweb/tornado/issues/1602#issuecomment-163472168
.. _`"bokeh" tag on Stack Overflow`: https://stackoverflow.com/questions/tagged/bokeh
.. _Bokeh Discourse: https://discourse.bokeh.org
.. _`Bokeh's GitHub repository`: https://github.com/bokeh/bokeh

.. |bokeh.sampledata| replace:: :ref:`bokeh.sampledata <bokeh.sampledata>`

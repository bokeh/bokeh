.. _getting_started_installation:

Installation
############

Bokeh is officially supported and tested on Python 3.6 and above (CPython).

You can install Bokeh with either ``conda`` or ``pip``:

.. panels::
    :container: container-fluid pb-3
    :column: col-lg-6 col-md-6 col-sm-12 col-xs-12 p-2

    :header: bg-bokeh-one

    Installing with ``conda``
    ^^^^^^^^^^^^^^^^^^^^^^^^^

    Make sure you have either `Anaconda`_ or `Miniconda`_ installed and use
    this command to install Bokeh:

    .. code-block:: sh

        conda install bokeh

    This installs all dependencies required to use Bokeh.
    Conda also installs the examples into the ``examples/`` subdirectory of
    your Anaconda or Miniconda installation directory.

    ---
    :header: bg-bokeh-two

    Installing with ``pip``
    ^^^^^^^^^^^^^^^^^^^^^^^

    Use this command to install Bokeh:

    .. code-block:: sh

        pip install bokeh

    .. note::
        Using ``pip`` does not install the examples. Read the
        :ref:`install_sampledata` section to learn more about this.

To check if the installation was successful, use this command:

.. code-block:: sh

    bokeh info

You should see, among other things, a line with information on the installed
version of Bokeh. If you receive an error instead, try searching for more
information `"bokeh" tag on Stack Overflow`_ or asking a question in the
`Bokeh Discourse`_ community.

Once you have Bokeh installed, build your first visualization by following
the tutorials. Check the :ref:`userguide` for a comprehensive overview of all the
things you can do with Bokeh.

If you want to install a development version of Bokeh to contribute to the project,
please see the :ref:`devguide_setup` instructions in the :ref:`devguide`.

Advanced installing information
===============================

This section provides complete details about Bokeh's prerequisites as well as
Bokeh's required and optional dependencies.

Supported platforms
^^^^^^^^^^^^^^^^^^^

Bokeh is officially supported (and continuously tested) on CPython versions
3.6+ only. It's possible that Bokeh does work on other version of Python, but
no guarantees or support are provided.

.. _install_required:

Required dependencies
^^^^^^^^^^^^^^^^^^^^^

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

Optional dependencies
^^^^^^^^^^^^^^^^^^^^^

In addition to the required dependencies above, some additional packages are
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
    Necessary to use the ``from_networkx`` function to generate Bokeh graph
    renderers directly from NetworkX data.

Pandas
    Necessary for the ``hexbin`` function. Additionally, using Pandas makes
    some aspects of Bokeh simpler to use. For example, glyph functions are able
    to automatically convert Pandas DataFrames to Bokeh data sources.

psutil
    Necessary to enable detailed memory logging in the Bokeh server.

Selenium, GeckoDriver, Firefox
    Necessary for :ref:`userguide_export` to PNG and SVG images.

Sphinx
    Necessary to make use of the ``bokeh.sphinxext`` Sphinx extension for
    including Bokeh plots in Sphinx documentation.

.. _install_sampledata:

Sample data
^^^^^^^^^^^

Some of the Bokeh examples rely on sample data that is not included in the
Bokeh GitHub repository or released packages, due to their size.

First install Bokeh. Then install the sample data with this command:

.. code-block:: sh

    bokeh sampledata

Alternatively, you can use the following statements to download and install
the sample data directly in a Python interpreter:

.. code-block:: python

    >>> import bokeh.sampledata
    >>> bokeh.sampledata.download()

You can also configure the location where Bokeh stores the sample data. See the
|bokeh.sampledata| reference for details.


.. _install_bokehjs:

Standalone BokehJS
^^^^^^^^^^^^^^^^^^

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
    You should always set `crossorigin="anonymous"` on script tags that load
    BokehJS from CDN.

    [What is crossorigin? an environemnt variable??]

.. _Anaconda Python Distribution: http://anaconda.com/anaconda
.. _Anaconda: https://www.anaconda.com/products/individual#Downloads
.. _Miniconda: https://docs.conda.io/en/latest/miniconda.html
.. _`"bokeh" tag on Stack Overflow`: https://stackoverflow.com/questions/tagged/bokeh
.. _Bokeh Discourse: https://discourse.bokeh.org

.. |bokeh.sampledata| replace:: :ref:`bokeh.sampledata <bokeh.sampledata>`

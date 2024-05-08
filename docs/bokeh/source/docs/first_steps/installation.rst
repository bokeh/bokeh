.. _installation:

Installation details
====================

This section provides more detailed information about installing Bokeh. This
includes details about Bokeh's prerequisites as well as Bokeh's required and
optional dependencies.

Supported platforms
-------------------

Bokeh is officially supported (and continuously tested) on CPython versions
:bokeh-minpy:`cpython` and later. It's possible that Bokeh does work on other
versions of Python, but no guarantees or support are provided.

Installing with ``conda`` or ``pip``
------------------------------------

Bokeh can be installed using either the Python package installer ``pip``, or
``conda``, the package manager for the  `Anaconda Python Distribution`_.

.. grid:: 1 1 2 2

    .. grid-item-card::

        Installing with ``pip``
        ^^^

        Use this command to install Bokeh:

        .. code-block:: sh

            pip install bokeh

    .. grid-item-card::

        Installing with ``conda``
        ^^^

        Make sure you have either `Anaconda`_ or `Miniconda`_ installed. Use
        this command to install Bokeh from the default channel:

        .. code-block:: sh

            conda install bokeh

        Alternatively, if you want to make sure you always have the most recent
        version of Bokeh after each new release, install from the
        `Bokeh channel <https://anaconda.org/bokeh/bokeh>`_ directly:

        .. code-block:: sh

            conda install -c bokeh bokeh

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

    Check the |user guide| for a comprehensive overview of all the things you
    can do with Bokeh.

Installing for development
--------------------------

If you want to install a development version of Bokeh to contribute to the
project, please see the :ref:`contributor_guide_setup` instructions in the
|contributor guide|.

.. _install_required:

Installing required dependencies
--------------------------------

For basic usage, Bokeh requires the following libraries:

:bokeh-requires:`cpython`

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
    Jupyter extensions to install. See :ref:`ug_output_jupyter` for full
    details.

NodeJS
    Necessary for :ref:`ug_advanced_extensions` or for defining
    ``CustomJS`` implementations in TypeScript.

NetworkX
    Necessary to use the :func:`~bokeh.plotting.graph.from_networkx` function
    to generate Bokeh graph renderers directly from NetworkX data.

psutil
    Necessary to enable detailed memory logging in the Bokeh server.

Selenium, GeckoDriver, Firefox
    Necessary for :ref:`ug_output_export` to PNG and SVG images.

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
examples also use this sample data. See :ref:`bokeh.sampledata` for more
information on the data sets included in Bokeh's sample data.

After installing Bokeh, you can automatically download and install the
sample data with this command:

.. code-block:: sh

    pip install bokeh_sampledata

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
    https://cdn.bokeh.org/bokeh/release/bokeh-gl-x.y.z.min.js
    https://cdn.bokeh.org/bokeh/release/bokeh-mathjax-x.y.z.min.js

Only the Bokeh core library ``bokeh-x.y.z.min.js`` is always required. The
other scripts are optional and only need to be included if you want to use
corresponding features:

* The ``"bokeh-widgets"`` files are only necessary if you are using any of the
  :ref:`Bokeh widgets <ug_interaction_widgets>`.
* The ``"bokeh-tables"`` files are only necessary if you are using Bokeh's
  :ref:`data tables <ug_interaction_widgets_examples_datatable>`.
* The ``"bokeh-api"`` files are required to use the
  :ref:`BokehJS API <ug_advanced_bokehjs>` and must be loaded *after* the
  core BokehJS library.
* The ``"bokeh-gl"`` files are required to enable
  :ref:`WebGL support <ug_output_webgl>`.
* the ``"bokeh-mathjax"`` files are required to enable
  :ref:`MathJax support <ug_styling_mathtext>`.

Replace ``x.y.z`` with the Bokeh version you want to use. For example, the links
for version ``3.0.0`` are:

* https://cdn.bokeh.org/bokeh/release/bokeh-3.0.0.min.js
* https://cdn.bokeh.org/bokeh/release/bokeh-widgets-3.0.0.min.js
* https://cdn.bokeh.org/bokeh/release/bokeh-tables-3.0.0.min.js
* https://cdn.bokeh.org/bokeh/release/bokeh-api-3.0.0.min.js
* https://cdn.bokeh.org/bokeh/release/bokeh-gl-3.0.0.min.js
* https://cdn.bokeh.org/bokeh/release/bokeh-mathjax-3.0.0.min.js

.. note::
    You should always set ``crossorigin="anonymous"`` on script tags that load
    BokehJS from CDN.

.. _Anaconda Python Distribution: http://anaconda.com/anaconda
.. _Anaconda: https://www.anaconda.com/products/individual#Downloads
.. _Miniconda: https://docs.conda.io/en/latest/miniconda.html
.. _`"bokeh" tag on Stack Overflow`: https://stackoverflow.com/questions/tagged/bokeh
.. _Bokeh Discourse: https://discourse.bokeh.org
.. _`Bokeh's GitHub repository`: https://github.com/bokeh/bokeh

.. _quickstart_installation:

Installation
############

You can install Bokeh with either ``conda`` or ``pip``:

.. panels::
    :container: container-fluid pb-3
    :column: col-lg-6 col-md-6 col-sm-12 col-xs-12 p-2

    :header: bg-bokeh-one

    Installing with ``conda``
    ^^^^^^^^^^^^^^^^^^^^^^^^^

    The easiest way to install Bokeh is to use the
    `Anaconda Python distribution`_. Once you have either `Anaconda`_ or
    `Miniconda`_ installed, use this command to install Bokeh:

    .. code-block:: sh

        conda install bokeh

    This installs all dependencies required to use Bokeh.
    Conda also installs the examples into the ``examples/`` subdirectory of
    your Anaconda or Miniconda installation directory.

    ---
    :header: bg-bokeh-two

    Installing with ``pip``
    ^^^^^^^^^^^^^^^^^^^^^^^

    Another way to install Bokeh is to use ``pip``. Use this command to install
    Bokeh:

    .. code-block:: sh

        pip install bokeh

    .. note::
        Using ``pip`` does not install the examples. The `_install_sampledata`
        section contains instructions on how to install the required data for
        using the examples.

To check if the installation was sucessful, use this command:

.. code-block:: sh

    bokeh info

-> Now tutorials!!


The easiest way to install Bokeh is to use the `Anaconda Python distribution`_.
Once you have Anaconda or Miniconda installed, use this command to install
Bokeh:

.. code-block:: sh

    conda install bokeh

This installs all the dependencies that Bokeh needs. Anaconda minimizes
installation effort on all platforms and configurations, including Windows,
and also installs the examples into the ``examples/`` subdirectory of your
Anaconda or Miniconda installation directory.


Another way to install Bokeh is to use ``pip``. Use this command to install
Bokeh:

[seems like I first needed to pip install wheel, otherwise I'd get an error message?]


.. code-block:: sh

    pip install bokeh

.. note::
    Using ``pip`` does not install the examples. The `_install_sampledata`
    section contains instructions on how to install the required data for
    using the examples.

[Why would I want the examples???]

In most cases you should have working setup. proceed to tutorial 1 to create
your first visualization.

If you want to install a development version of Bokeh to contribute to the project,
please see the 'setting up' instructions in the Devlopers guide. 

here is more details about 

This section provides complete details about Bokeh's required and
optional dependencies as well as information about how to install
Bokeh in different situations. To get up and running as fast as possible,
see the [userguide_quickstart_install] section of the
[userguide_quickstart].

.. _install_supported:

Supported Platforms
===================

Bokeh is officially supported (and continuously tested) on CPython versions
3.6+ only. Other Python versions or implementations may function, possibly
limited capacity, but no guarantees or support is provided.

.. _install_required:

Required Dependencies
=====================

For basic usage, the following libraries are required:

.. code::

    PyYAML>=3.10
    python-dateutil>=2.1
    Jinja2>=2.7
    numpy>=1.11.3
    pillow>=4.0
    packaging>=16.8
    tornado>=5
    typing_extensions >=3.7.4

All those packages are automatically installed if you use ``conda`` or
``pip``.

.. _install_optional:

Optional Dependencies
=====================

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
    Necessary for the ``hexbin`` function. Additionally, some usage is
    simplified by using Pandas e.g. Pandas DataFrames will be converted
    automatically to Bokeh data sources by glyph functions.

psutil
    Necessary to enable detailed memory logging in the Bokeh server.

Selenium, GeckoDriver, Firefox
    Necessary for :ref:`userguide_export` to PNG and SVG images.

Sphinx
    Necessary to make use of the ``bokeh.sphinxext`` Sphinx extension for
    including Bokeh plots in Sphinx documentation.

.. _install_packages:

Standard Releases
=================

These Bokeh dependencies are best obtained via the
`Anaconda Python Distribution`_, which was designed to include robust
versions of popular libraries for the Python scientific and data analysis
stacks.

If you are already an Anaconda user, you can simply run the command:

.. code-block:: sh

    conda install bokeh

This will install the most recent published Bokeh release from the
[Anaconda, Inc. package repository LINK TBD], along with all dependencies.

Alternatively, it is possible to install from PyPI using ``pip``:

.. code-block:: sh

    pip install bokeh

.. _install_sampledata:

Sample Data
===========

Some of the Bokeh examples rely on sample data that is not included in the
Bokeh GitHub repository or released packages, due to their size. Once Bokeh
is installed, the sample data can be obtained by executing the following
command at a Bash or Windows prompt:

.. code-block:: sh

    bokeh sampledata

Alternatively, the following statements can be executed in a Python
interpreter:

.. code-block:: python

    >>> import bokeh.sampledata
    >>> bokeh.sampledata.download()

Finally, the location that the sample data is stored can be configured.
See the |bokeh.sampledata| reference for details.



=========> put the following into Dev Guide???

Advanced Cases
==============

In addition to the standard installation methods above, Bokeh can also
be installed in some specialized ways for advanced usage or development.

.. _install_source:

Source Code
-----------

Installing Bokeh from source requires rebuilding the BokehJS library
from its TypeScript sources. Some additional toolchain support is required.
Please consult the :ref:`devguide_setup` section of the :ref:`devguide` for
detailed instructions.

.. _install_bokehjs:

BokehJS
-------

If you would like to use BokehJS as a standalone JavaScript library, released
versions of BokehJS are available for download from CDN at ``cdn.bokeh.org``,
under the following naming scheme::

    # Javascript files
    https://cdn.bokeh.org/bokeh/release/bokeh-x.y.z.min.js
    https://cdn.bokeh.org/bokeh/release/bokeh-widgets-x.y.z.min.js
    https://cdn.bokeh.org/bokeh/release/bokeh-tables-x.y.z.min.js
    https://cdn.bokeh.org/bokeh/release/bokeh-api-x.y.z.min.js

The ``"-widgets"`` files are only necessary if you are using any of the widgets
built into Bokeh in ``bokeh.models.widgets`` in your documents. Similarly, the
``"-tables"`` files are only necessary if you are using Bokeh data tables in
your document. The ``"bokeh-api"`` files are required to use the BokehJS API,
and must be loaded *after* the core BokehJS library.

As a concrete example, the links for version ``2.0.1`` are:

* https://cdn.bokeh.org/bokeh/release/bokeh-2.0.1.min.js
* https://cdn.bokeh.org/bokeh/release/bokeh-widgets-2.0.1.min.js
* https://cdn.bokeh.org/bokeh/release/bokeh-tables-2.0.1.min.js
* https://cdn.bokeh.org/bokeh/release/bokeh-api-2.0.1.min.js

.. note::
    You should always set `crossorigin="anonymous"` on script tags that load
    BokehJS from CDN.

.. _Anaconda Python Distribution: http://anaconda.com/anaconda
.. _Anaconda: https://www.anaconda.com/products/individual#Downloads
.. _Miniconda: https://docs.conda.io/en/latest/miniconda.html

.. |bokeh.sampledata| replace:: :ref:`bokeh.sampledata <bokeh.sampledata>`

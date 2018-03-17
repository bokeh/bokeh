.. _installation:

Installation
############

This section provides complete details about Bokeh's required and
optional dependencies as well as information about how to install
Bokeh in different situations. To get up and running as fast as possible,
see the :ref:`userguide_quickstart_install` section of the
:ref:`userguide_quickstart`.

.. _install_supported:

Supported Platforms
===================

Bokeh is officially supported (and continuously tested) on CPython versions 2.7
and 3.5+ only. Other Python versions or implementations may function, possiblly
limited capacity, but no guarantees or support is provided.

.. _install_required:

Required Dependencies
=====================

For basic usage, have the following libraries installed:

.. code::

    Jinja2 >=2.7
    python-dateutil >=2.1
    PyYAML >=3.10
    numpy >=1.7.1
    packaging >=16.8
    six >=1.5.2
    tornado >=4.3

To use the Bokeh server with Python 2.7, you also must install the Futures
package.

.. _install_optional:

Optional Dependencies
=====================

In addition to the required dependencies above, some additional packages are
necessary for certain optional features:

NodeJS
    Necessary for :ref:`userguide_extensions` or for defining
    ``CustomJS`` implementations in CoffeeScript or TypeScript.

Pandas
    Not strictly necessary for any particular feature, but some usage is
    simpler when using Pandas e.g. Pandas DataFrames will be converted
    automatically to Bokeh data sources by glyph functions.

psutil
    Necessary to enable detailed memory logging in the Bokeh server.

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
`Anaconda, Inc.`_ package repository, along with all dependencies.

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
By default, data is downloaded and stored to a directory ``$HOME/.bokeh/data``.
(The directory is created if it does not already exist.) Bokeh looks for
a YAML configuration file at ``$HOME/.bokeh/config``. The YAML key
``sampledata_dir`` can be set to the absolute path of a directory where
the data should be stored. For instance adding the following line to the
config file:

.. code-block:: sh

    sampledata_dir: /tmp/bokeh_data

will cause the sample data to be stored in ``/tmp/bokeh_data``.

Verifying installation
======================

The first check you can make is to make sure you can ``import bokeh`` and
verify ``bokeh.__version__`` from a running python interpreter. If you
execute both of those lines in a python interpreter, the result should
look something like this:

.. image:: /_images/bokeh_import.png
    :scale: 50 %
    :align: center

The next check you can make is to produce a very simple plot. Execute the
following few lines of python code, either by copying them into a script and
executing the script, or by running the lines by hand in a python interpreter:

.. code-block:: python

    from bokeh.plotting import figure, output_file, show
    output_file("test.html")
    p = figure()
    p.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], line_width=2)
    show(p)

This should save a ``test.html`` file locally, and open a browser tab to
view the file. The result should look like this:

.. image:: /_images/bokeh_simple_test.png
    :scale: 30 %
    :align: center

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

.. _install_devbuild:

Developer Builds
----------------

And easier way to obtain the most recent Bokeh updates without having to worry
about building Bokeh yourself is to install a developer build. Dev builds are not
published on any particular schedule but often come out a few times a month or
more.

These builds are being made available on `anaconda.org`_. If you are using
Anaconda, you can install with conda by issuing the command from a Bash or Windows
command prompt:

.. code-block:: sh

    conda install -c bokeh/channel/dev bokeh

Alternatively you can install with pip from a Bash or Windows command prompt:

.. code-block:: sh

    pip install --pre -i https://pypi.anaconda.org/bokeh/channel/dev/simple bokeh --extra-index-url https://pypi.python.org/simple/

We attempt to make sure the developer builds are relatively stable, however please
be aware they they are not tested as rigorously as standard releases. Any problems
or issues reported on the GitHub issue tracker are appreciated.

.. _install_bokehjs:

BokehJS
-------

If you would like to use BokehJS as a standalone JavaScript library, released
versions of BokehJS are available for download from CDN at pydata.org, under
the following naming scheme::

    http://cdn.pydata.org/bokeh/release/bokeh-x.y.z.min.css
    http://cdn.pydata.org/bokeh/release/bokeh-widgets-x.y.z.min.css
    http://cdn.pydata.org/bokeh/release/bokeh-tables-x.y.z.min.css

for the BokehJS CSS files, and::

    http://cdn.pydata.org/bokeh/release/bokeh-x.y.z.min.js
    http://cdn.pydata.org/bokeh/release/bokeh-widgets-x.y.z.min.js
    http://cdn.pydata.org/bokeh/release/bokeh-tables-x.y.z.min.js
    http://cdn.pydata.org/bokeh/release/bokeh-api-x.y.z.min.js

for the BokehJS Javascript files.

.. note::
    The CSS must be loaded *before* the JavaScript library.

The ``"-widgets"`` files are only necessary if you are using any of the widgets
built into Bokeh in ``bokeh.models.widgets`` in your documents. Similarly, the
``"-tables"`` files are only necessary if you are using Bokeh data tables in
your document. The ``"bokeh-api"`` files are required to use the BokehJS API,
and must be loaded *after* the core BokehJS library.

As a concrete example, the links for version ``0.12.15`` are:

* http://cdn.pydata.org/bokeh/release/bokeh-0.12.15.min.css
* http://cdn.pydata.org/bokeh/release/bokeh-widgets-0.12.15.min.css
* http://cdn.pydata.org/bokeh/release/bokeh-tables-0.12.15.min.css

and

* http://cdn.pydata.org/bokeh/release/bokeh-0.12.15.min.js
* http://cdn.pydata.org/bokeh/release/bokeh-widgets-0.12.15.min.js
* http://cdn.pydata.org/bokeh/release/bokeh-tables-0.12.15.min.js
* http://cdn.pydata.org/bokeh/release/bokeh-api-0.12.15.min.js

.. _Anaconda Python Distribution: http://anaconda.com/anaconda
.. _anaconda.org: http://anaconda.org
.. _Anaconda, Inc.: http://anaconda.com
.. _npmjs.org: https://www.npmjs.org/package/bokehjs

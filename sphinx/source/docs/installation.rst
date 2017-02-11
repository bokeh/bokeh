.. _installation:

Installation
############

This section gives more details about the installation process of Bokeh,
for those who were unable to complete the process detailed in the
:ref:`userguide_quickstart`, or who want more information about the process.

.. _install_dependencies:

Dependencies
============

Bokeh is officially supported (and continuously tested) on CPython versions 2.7
and 3.4+ only. Other Python versions may function, possibly in limited capacity.
In particular, converting NumPy arrays to lists may be useful with other versions.
However, this guidance is only provided as-is, in case it happens to be useful,
and does not imply any level of official support for other Python versions. All
issues opened related to unsupported Python versions will be closed as invalid.

For basic usage, have the following libraries installed:

.. hlist::
    :columns: 2

    * NumPy
    * Jinja2
    * Six
    * Requests
    * Tornado >= 4.0
    * PyYaml
    * DateUtil

To use the Bokeh server with python 2.7, you also need to install Futures
package.

Because the Bokeh client library is mostly concerned with providing a nice
Python interface for generating JSON objects which are then consumed by the
BokehJS library running in the browser, there shouldn't be a *hard* dependency
on any of the standard NumPy/SciPy stack.  It is entirely possible to use
Bokeh with plain Python lists of values. However, the Bokeh plot server does
make direct use of NumPy, and it is required to be installed for Bokeh apps
to function.

Additionally the ``bokeh.charts`` interface and various examples
depend on the Pandas library; it is recommended to install Pandas version 0.16.1
or later.

.. _install_packages:

Package Installs
================

These Bokeh dependencies are best obtained via the
`Anaconda Python Distribution`_, which was designed to include robust
versions of popular libraries for the Python scientific and data analysis
stacks.

If you are already an Anaconda user, you can simply run the command:

.. code-block:: sh

    conda install bokeh

This will install the most recent published Bokeh release from the
`Continuum Analytics`_ Anaconda repository, along with all dependencies.

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

.. _install_source:

Installing from Source
======================

Installing Bokeh from source requires rebuilding the BokehJS library
from its CoffeeScript sources. Some additional toolchain support is required.
Please consult the :ref:`devguide_setup` section of the :ref:`devguide` for
detailed instructions.

.. _install_devbuild:

Developer Builds
================

And easier way to obtain the most recent Bokeh updates without having to worry
about building Bokeh yourself is to install a developer build. We typically try
to make a new developer build available at least once a week, and sometimes more
often.

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

BokehJS Standalone
==================

If you would like to use BokehJS as a standalone JavaScript library, there are
two easy ways to get any published release.

First, released versions of BokehJS is available for download from CDN at
pydata.org, under the following naming scheme::

    http://cdn.pydata.org/bokeh/release/bokeh-x.y.z.min.js
    http://cdn.pydata.org/bokeh/release/bokeh-widgets-x.y.z.min.js

for the BokehJS JavaScript files, and::

    http://cdn.pydata.org/bokeh/release/bokeh-x.y.z.min.css
    http://cdn.pydata.org/bokeh/release/bokeh-widgets-x.y.z.min.css

for the BokehJS CSS files.

The ``"-widgets"`` files are only necessary if you are using any of the widgets
built into Bokeh in ``bokeh.models.widgets`` in your documents.

As a concrete example, the links for version ``0.12`` are:

* http://cdn.pydata.org/bokeh/release/bokeh-0.12.0.min.js
* http://cdn.pydata.org/bokeh/release/bokeh-widgets-0.12.0.min.js

and

* http://cdn.pydata.org/bokeh/release/bokeh-0.12.0.min.css
* http://cdn.pydata.org/bokeh/release/bokeh-widgets-0.12.0.min.css

.. note::
    For releases ``0.12.2`` and after, the BokehJS API has been branched to a separate file.
    It is also available for download from CDN at pydata.org under the name bokeh-api using
    the above naming scheme.

.. _Anaconda Python Distribution: http://continuum.io/anaconda
.. _anaconda.org: http://anaconda.org
.. _Continuum Analytics: http://continuum.io
.. _npmjs.org: https://www.npmjs.org/package/bokehjs

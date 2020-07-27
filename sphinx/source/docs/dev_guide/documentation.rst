.. _devguide_documentation:

Documentation
=============

Contributions to Bokeh will only be accepted if they contain sufficient and
appropriate documentation support. This section outlines how to build and
edit documentation locally, as well as describes conventions that the project
adheres to.

Helping with documentation is one of the most valuable ways to contribute to a
project. It's also a good way to get started and introduce yourself as a new
contributor. The most likely way for typos or other small documentation errors
to be resolved is for the person who notices the problem to immediately submit
a Pull Request to with a correction. *This is always appreciated!* In
addition to quick fixes, there is also a list of `Open Docs Issues`_ on GitHub
that anyone can look at for tasks that need help.

Working on Documentation
------------------------

Sphinx_ is used to generate HTML documentation. Due to the innate dependency
of Bokeh on JavaScript, no other output formats are supported by the official
build configuration. This section describes how to use Sphinx to build the
Bokeh documentation from source.

Install Requirements
~~~~~~~~~~~~~~~~~~~~

In order to build the docs from source, it is recommended that you first
follow the instructions in :ref:`devguide_setup`.

Some of the Bokeh examples in the documentation rely on sample data that is
not included in the Bokeh GitHub repository or released packages, due to
their size.

Once Bokeh is installed, the sample data can be obtained by executing the
following command at a Bash or Windows prompt:

.. code-block:: sh

    bokeh sampledata

See :ref:`install_sampledata` for alternative instructions on how to
download the sample data.

Build the Documentation
~~~~~~~~~~~~~~~~~~~~~~~

To generate the full documentation, first navigate to the  ``sphinx``
subdirectory of the Bokeh source tree.

.. code-block:: sh

    cd sphinx

Sphinx uses the ``make`` tool to control the build process. The most common
targets of the Bokeh makefile are:

``clean``
    Remove all previously built documentation output. All outputs will
    be generated from scratch on the next build.

``html``
    Build any HTML output that is not built, or needs re-building (e.g.
    because the input source file has changed since the last build).

``serve``
    Start a server to serve the docs and open a web browser to display them.
    Note that due to the JavaScript files involved, starting a real server is
    necessary to view many portions of the docs fully.

For example, to clean the docs build directory, run the following command at
the command line:

.. code-block:: sh

    make clean

Multiple targets may be combined in a single `make` invocation. For instance,
executing the following command will clean the docs build, generate all HTML
docs from scratch, and then open a browser to display the results:

.. code-block:: sh

    make clean html serve

By default, built docs will load the most recent BokehJS from CDN. If you are
making local changes to the BokehJS and wish to have the docs use your locally
built BokehJS instead, you can set the environment variable ``BOKEH_DOCS_CDN``
before calling ``make``:

.. code-block:: sh

    BOKEH_DOCS_CDN=local make clean html serve

Building the docs also requires setting up the ``GOOGLE_API_KEY`` environment variable that ``gmap`` plots use.
You can `create a new API Key <https://developers.google.com/maps/documentation/javascript/get-api-key>`_.
Or if you don't care whether ``gmap`` plots work, you can set the variable with a fake value before calling ``make``:

.. code-block:: sh

    GOOGLE_API_KEY=foo make clean html serve

Source Code Documentation
-------------------------

Docstrings and Model help are available from a Python interpreter, but are also
processed by the Sphinx build to automatically generate a complete
:ref:`refguide`.

Bokeh uses some common conventions to create a consistent documentation style.

Docstrings
~~~~~~~~~~

We use `Sphinx Napoleon`_ to process docstrings for our reference
documentation.

All docstrings are `Google Style Docstrings`_. Docstrings should generally
begin with a verb stating what the function or method does in a short
statement. For example, the "verb first" style is preferred:

.. code-block:: python

    """ Create and return a new Foo. (GOOD)

    """

over the more verbose sentence below:

.. code-block:: python

    """ This function creates and returns a new Foo. (BAD)

    """

Docstrings for functions and methods should generally include the following
sections:

* ``Args``  (unless the function takes no arguments)
* ``Returns`` (even if the function just returns ``None``)

Short descriptions for parameters should be written in such a way that
inserting an implicit "IS" makes a complete sentence. For example:

.. code-block:: python

    title_font (str, optional) :
        A font used for the plot title (default: Sans)

can be reasonably read as "title_font IS a font used for the plot title".

A complete example might look like:

.. code-block:: python

    def somefunc(name, level):
        ''' Create and return a new Foo.

        Args:
            name (str) :
                A name for the Foo

            level (int) :
                A level for the Foo to be configured for

        Returns:
            Foo

        '''

Models and Properties
~~~~~~~~~~~~~~~~~~~~~

Bokeh's Model system supports its own system for providing detailed
documentation for individual properties. These are given as a ``help``
argument to the property type, which is interpreted as standard Sphinx
ReST when the reference documentation is built. For example:

.. code-block:: python

    class DataRange(Range):
        ''' A base class for all data range types.

        '''

        names = List(String, help="""
        A list of names to query for. If set, only renderers that
        have a matching value for their ``name`` attribute will be used
        for autoranging.
        """)

        renderers = List(Instance(Renderer), help="""
        An explicit list of renderers to autorange against. If unset,
        defaults to all renderers on a plot.
        """)


Narrative Documentation
-----------------------

The narrative documentation consists of all the documentation that is not
automatically generated from docstrings and Bokeh property helpstrings. This
includes User's Guide, Quickstart, etc. The source code for these docs are
standard Sphinx Restructure Text (ReST) files that are located under the
``sphinx/source/docs`` subdirectory of the source tree.

Section Headings
~~~~~~~~~~~~~~~~

In narrative documentation, headings help the users follow the
key points and sections. The following outlines the headings hierarchy:

.. code-block:: python

    Top level
    =========

    This will add a "Top Level" entry in the navigation sidebar.

    Second level
    ------------

    This may add a sub-entry in the sidebar, depending on configuration.

    Third level
    ~~~~~~~~~~~

    Fourth level
    ''''''''''''

Note that the length of the underline *must* match that of the heading text,
or else the Sphinx build will fail.

Release Notes
~~~~~~~~~~~~~

Each release should add a new file under ``sphinx/source/docs/releases`` that
briefly describes the changes in the release, including any migration notes.
The filename should be ``<version>.rst``, for example
:bokeh-tree:`sphinx/source/docs/releases/0.12.7.rst`. The
Sphinx build will automatically add this content to the list of all releases.

.. _Google Style Docstrings: http://sphinxcontrib-napoleon.readthedocs.org/en/latest/example_google.html#example-google
.. _Open Docs Issues: https://github.com/bokeh/bokeh/issues?q=is%3Aopen+is%3Aissue+label%3A%22tag%3A+component%3A+docs%22
.. _Sphinx: http://sphinx-doc.org
.. _Sphinx Napoleon: http://sphinxcontrib-napoleon.readthedocs.org/en/latest/index.html

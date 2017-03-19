.. _devguide_documentation:

Documentation
=============

We use Sphinx_ to generate our HTML documentation.

Working on Documentation
------------------------

Install requirements
~~~~~~~~~~~~~~~~~~~~

The following requirements are necessary for building Bokeh documentation:

* sphinx
* seaborn
* pyyaml

Install these requirements::

    conda install -c bokeh sphinx seaborn pyyaml

We recommend using ``conda`` to install these requirements. Alternatively, you
may use ``pip`` or install from the packages' source.

Supported Output Formats
~~~~~~~~~~~~~~~~~~~~~~~~

The innate dependency of Bokeh on JavaScript means that attempting other formats
besides HTML cannot not produce good or usable results. Only HTML output is
supported.

Install the sample data
~~~~~~~~~~~~~~~~~~~~~~~

Some of the Bokeh examples in the documentation rely on sample data that is
not included in the Bokeh GitHub repository or released packages, due to
their size.

First, make sure that the Bokeh package is installed. Install the latest
development version of Bokeh, if needed::

    conda install -c bokeh/channel/dev bokeh


Once Bokeh is installed, the sample data can be obtained by executing the
following command at a Bash or Windows prompt::

    bokeh sampledata

See :ref:`install_sampledata` for alternative instructions on how to
download the sample data.

Build the Documentation
~~~~~~~~~~~~~~~~~~~~~~~

To generate the full documentation, execute the following command from the
``sphinx`` subdirectory of the Bokeh source's root directory:

.. code-block:: sh

    cd sphinx
    make clean all

Serve and Review the Documentation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Next to start a server and automatically open the documentation in a
browser, enter::

    make serve

Documentation Style Conventions
-------------------------------

Bokeh uses some common conventions to create a consistent documentation style.

Docstrings
~~~~~~~~~~

We use `Sphinx Napoleon`_ to process docstrings for our reference
documentation.

All docstrings are `Google Style Docstrings`_. Docstrings should generally
begin with a verb stating what the function or method does in a short
statement. For example, the "verb first" style is preferred::

    """ Create and return a new Foo."""

over the more verbose sentence below::

    """ This function creates and returns a new Foo. """

Docstrings for functions and methods should include:

* ``Args:`` section (if any arguments are accepted)
* ``Returns:`` section (even if the function just returns ``None``)

Short descriptions for parameters should be written in such a way that
inserting an implicit "IS" makes a complete sentence. For example::

    title_font (str, optional) : a font used for the plot title (default: Sans)

can be reasonably read as "title_font IS a font used for the plot title".

Document headings
~~~~~~~~~~~~~~~~~

In narrative documentation, headings help the users follow the
key points and sections. The following outlines the headings hierarchy:

.. code-block:: python

    Top level (makes a top-level entry in the side-bar)
    ===================================================

    Second level
    ------------

    Third level
    ~~~~~~~~~~~

    Fourth level
    ''''''''''''

Note that the length of the underline should match that of the heading text.


.. _Google Style Docstrings: http://sphinxcontrib-napoleon.readthedocs.org/en/latest/example_google.html#example-google
.. _Sphinx: http://sphinx-doc.org
.. _Sphinx Napoleon: http://sphinxcontrib-napoleon.readthedocs.org/en/latest/index.html

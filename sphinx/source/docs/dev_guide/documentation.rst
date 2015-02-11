.. _devguide_documentation:

Documentation
=============

.. contents::
    :local:
    :depth: 2

Requirements
------------

We use Sphinx_ to generate our HTML documentation. You will need the following
packages installed in order to build Bokeh documentation:

* docutils
* sphinx
* sphinxcontrib-napoleon
* sphinxcontrib-httpdomain
* sphinx-bootstrap-theme
* seaborn
* pygments
* yaml
* pyyaml
* ggplot
* seaborn

These can be installed using ``conda`` or ``pip`` or from source. In
addition to the package requirements, you will also need to have the sample
data downloaded. See :ref:`install_sampledata` instructions on how to
download it.

Building
--------

To generate the full HTML documentation, navigate to the ``sphinx``
subdirectoryof the Bokeh source checkout, and execute the corresponding
command::

    make all

or::

    make html

To start a server and automatically open the built documentation in a
browser, execute the command::

    make serve

Conventions
-----------

We use `Sphinx Napoleon`_ to process docstrings for our reference
documentation. All docstrings are `Google Style Docstrings`_.

Docstrings should generally begin with a verb stating what the function
or method does in a short statement. For example::

    """ Create and return a new Foo."""

is to be preferred over::

    """ This function creates and returns a new Foo. """

All docstrings for functions and methods should have an **Args:** section
(if any arguments are accepted) and also a **Returns:** section (even if
the function just returns ``None``).

Short descriptions for parameters should be written in such a way that
inserting an implicit "IS" makes a complete sentence. For example::

    title_font (str, optional) : a font used for the plot title (default: Sans)

can be reasonably read as "title_font IS a font used for the plot title".

.. _Google Style Docstrings: http://sphinxcontrib-napoleon.readthedocs.org/en/latest/example_google.html#example-google
.. _Sphinx: http://sphinx-doc.org
.. _Sphinx Napoleon: http://sphinxcontrib-napoleon.readthedocs.org/en/latest/index.html


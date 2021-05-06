.. _devguide_documentation:

Documentation
=============

The Bokeh documentation is an important resource for the entire Bokeh
community. It helps guide new users, and it is the definitive reference for
seasoned users and developers. That is why all contributions to Bokeh must
contain adequate documentation. It is also why we have set standards to ensure
that Bokeh's documentation remains easily accessible and up to date.

Just like Bokeh itself, the documentation is a community effort. And just like
Bokeh, the documentation is being adapted and improved all the time. In fact,
helping with the documentation is one of the most valuable ways to contribute
to Bokeh. It's also a good way to get started and introduce yourself as a new
contributor.

An easy way to get started is to submit pull requests for any typos or other
small errors you might find in Bokeh's documentation. *This is always
appreciated!* In addition to quick fixes, check the list of `Open Docs
Issues`_ on GitHub. This list contains several projects as a starting
point.

This section describes Bokeh's
:ref:`documentation style guidelines <devguide_documentation_style_guidelines>`
for contributing to the documentation. This section also includes details on how
to :ref:`build <devguide_documentation_build>` and
:ref:`edit <devguide_documentation_edit>` the documentation in your local
development environment.

.. _`devguide_documentation_style_guidelines`:

Documentation style guidelines
------------------------------

Bokeh's documentation uses the `Google developer documentation style guide`_.

If your contribution includes substantial edits or additions, please
familiarize yourself with Google's style guide. A simple way to get started
is using Google's free `technical writing courses`_.

.. note::
  You will find that many parts of Bokeh's documentation do not yet follow
  these style guidelines. We are currently working on implementing these
  changes. However, we request that all documentation contributions follow
  the standards described in this document.

Principles of good style
~~~~~~~~~~~~~~~~~~~~~~~~

Follow these basic guidelines in all your writing for Bokeh:

* Be aware of **sentence length**. Try to avoid sentences that require more
  than two commas. Consider breaking up longer sentences. You could also use
  bulleted or numbered lists instead.
* Avoid jargon or uncommon words and phrases. Keep in mind that many users of
  Bokeh don't use English as their primary language.
* Use **active voice** instead of passive voice whenever possible.
* Address the reader in the **second person ('you')**. Avoid using the first
  person ('we') or the third person ('the user').
* Use **American English** spelling and grammar (refer to `Merriam-Webster`_ for
  consistent spelling).
* Use **sentence case for headlines** (capitalize words like in a regular
  sentence, but do not use any punctuation at the end).
* Use **serial commas**, also known as Oxford Commas.
* Write in a way that is inclusive_ and accessible_.
* Activate the **spell checker** in your development environment.

Refer to the `Google developer documentation style guide`_ for more detailed
information.

Commonly used terms
~~~~~~~~~~~~~~~~~~~

These are some commonly used terms and phrases and their spellings used
throughout the narrative documentation:

.. csv-table::
   :header: "Term", "Details"
   :widths: 25, 75

   "Bokeh, BokehJS", "Always capitalize Bokeh and BokehJS"
   "JavaScript", "Capitalize both 'J' and 'S'"
   "Jupyter notebook", "Capitalize Jupyter, but not notebook"
   "pandas", "Don't capitalize `pandas`_"
   "Python", "Always capitalize Python (the language)"

For definitions and concepts used throughout Bokeh's documentation, see the
:ref:`userguide_glossary` in :ref:`userguide_concepts`.

In general, see the `word list of the Google developer documentation style
guide`_ for reference.

.. _`devguide_documentation_build`:

Setting up and building Bokeh's documentation
---------------------------------------------

Bokeh uses Sphinx_ to generate the HTML files displayed at docs.bokeh.org_. The
documentation is written in reStructuredText_ (ReST).

HTML is the only output format supported by Bokeh's documentation. Many pages
use dynamic content and rely heavily on JavaScript.

Preparing your environment
~~~~~~~~~~~~~~~~~~~~~~~~~~

To build the documentation, follow the instructions in :ref:`devguide_setup`
and make sure you have activated the ``bkdev`` environment:

.. code-block:: sh

    conda activate bkdev

Some of the examples in the documentation require additional sample
data. Use this command on a console to automatically download and install the
necessary data:

.. code-block:: sh

    bokeh sampledata

See :ref:`install_sampledata` for alternative instructions on how to
download the sample data.

In order to build the documentation, you must set the environment variable
``GOOGLE_API_KEY``. The documentation includes some plots with maps, and a valid
Google API key is required to build those plots correctly. You have two
options:

* Follow the instructions on the `Google developers website`_ to generate a new
  API key.

* Use a placeholder value like ``some_value`` instead of a valid API key. If
  you use a placeholder, some map plots in Bokeh's documentation might not be
  rendered correctly, but the documentation should otherwise be built correctly.
  This will only affect your local environment and should have no effect on any
  changes you might commit to the Bokeh repository.

After activating your conda environment, use the following command to set the
environment variable:

.. code-block:: sh

    conda env config vars set GOOGLE_API_KEY=some_value

Next, you have to reactivate your environment:

.. code-block:: sh

    conda deactivate
    conda activate bkdev

Using ``conda env config vars set`` makes this environment variable part of your
``bkdev`` environment. When you activate your ``bkdev`` environment, conda will from
now on set this environment variable for you.

Building Bokeh's documentation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You can find all source files for Bokeh's documentation in the ``sphinx``
directory of the Bokeh source tree.

.. code-block:: sh

    cd sphinx

Sphinx uses the standard Unix ``make`` command to control the build process. For
Windows users, the ``sphinx`` directory includes the file ``make.bat``. Use this
Windows batch file instead of ``make``, which is usually only available on
Unix-based systems.

When building Bokeh's documentation, the most common options for ``make`` are:

* ``clean``: remove all previously built documentation output. All output files
  are generated from scratch on the next build.
* ``html``: build any HTML output that hasn't been built yet or needs to be
  rebuilt to include changes to the documentation source files.
* ``serve``: start a minimal web server and open a web browser to display the
  docs. Starting a server is necessary because large portions of the
  documentation require JavaScript files in the background.

For example, to clean the docs build directory, run the following command:

.. code-block:: sh

    make clean

You can combine multiple targets in one command (not supported by make.bat).
For example:

.. code-block:: sh

    make clean html serve

Documents that you build yourself in your local environment load the most
recent version of BokehJS from Bokeh's Content Delivery Network (CDN) by
default. If you would like to use your local version of BokehJS instead, set
the environment variable ``BOKEH_DOCS_CDN`` to ``local`` before calling ``make``:

.. code-block:: sh

    BOKEH_DOCS_CDN=local

.. _`devguide_documentation_edit`:

Writing Bokeh's documentation
-----------------------------
The documentation available at docs.bokeh.org_ mainly consists of those two
elements:

* **Docstrings and Model help text within the Python source code of Bokeh**:
  detailed explanations of all Bokeh modules and their properties. These texts
  are available from the Python interpreter and within most Python development
  environments. Sphinx also uses those texts to generate the `API Reference`_
  within Bokeh's documentation.

* **Narrative documentation**: tutorial-like descriptions and instructions for
  Bokeh. This includes sections like the `User guide`_, `Developer guide`_ or
  Gallery_.

Contributing to Bokeh's source code documentation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All functions and methods in Bokeh use docstrings_. In addition, Bokeh uses its
own system to provide `detailed information on individual properties`_.

.. _docstrings:

Writing docstrings
''''''''''''''''''

To automatically process all docstrings, Bokeh uses an extension for Sphinx
called `Napoleon`_ with `Napoleon's Google style`_. For Napoleon to work
correctly, all docstrings you write should follow the rules in the `Google
Python Style Guide`_.

Docstrings for functions and methods generally include these three elements:

* A short description of what the function or method does, starting with a
  verb. For example: "Creates and returns a new Foo."
* Args: list all parameters, if any.
* Returns: describe the return values of the function or method, even if the
  function returns ``None``.

For example:

.. code-block:: python

    def foo_function(name, level):
        ''' Creates and returns a new Foo.

        Args:
            name (str) :
                A name for the Foo

            level (int) :
                A level for the Foo to be configured for

        Returns:
            Foo
        '''

.. _`detailed information on individual properties`:

Writing models and properties help
''''''''''''''''''''''''''''''''''

Bokeh's model includes a system to provide documentation about individual
properties within the source code. You can add text to any property type by
passing a ``help`` argument.

Any string passed as a ``help`` argument can be formatted using
reStructuredText_ (ReST).

For example:

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

Writing for Bokeh's narrative documentation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Bokeh's narrative documentation consists of these for elements:

* :ref:`first_steps`: first steps guides and installation instructions
* `User guide`_: descriptions and instructions for using Bokeh
* Gallery_: interactive examples with source code
* `Developer guide`_: instructions for contributing to Bokeh

Sphinx generates each of those elements from reStructuredText (.rst) files. To
edit any of those elements, open the corresponding ReST source file in the
``sphinx/source/docs`` folder of the Bokeh source tree.

For information on how to format text using reStructuredText, see the
`reStructuredText primer on the Sphinx website`_ or the `official
reStructuredText website`_.

For information on writing style, see Bokeh's
:ref:`documentation style guidelines <devguide_documentation_style_guidelines>`
and the `Google developer documentation style guide`_.

`Release Notes`_ are generally handled by the Bokeh core team as part of
Bokeh's `release management`_. Each release should add a new file under
``sphinx/source/docs/releases`` that briefly describes the changes in the
release, including any migration notes. The filename should be
``<version>.rst``, for example ``sphinx/source/docs/releases/0.12.7.rst``.The
Sphinx build will automatically add this content to the list of all releases.


.. _Open Docs Issues: https://github.com/bokeh/bokeh/issues?q=is%3Aopen+is%3Aissue+label%3A%22tag%3A+component%3A+docs%22
.. _Google developer documentation style guide: https://developers.google.com/style
.. _technical writing courses: https://developers.google.com/tech-writing
.. _pandas: https://pandas.pydata.org/about/citing.html
.. _Merriam-Webster: https://www.merriam-webster.com/
.. _inclusive: https://developers.google.com/style/inclusive-documentation
.. _accessible: https://developers.google.com/style/accessibility
.. _`word list of the Google developer documentation style guide`: https://developers.google.com/style/word-list
.. _Sphinx: http://sphinx-doc.org
.. _reStructuredText: https://www.sphinx-doc.org/en/master/usage/restructuredtext/index.html
.. _docs.bokeh.org: https://docs.bokeh.org/en/latest/
.. _Google developers website: https://developers.google.com/maps/documentation/javascript/get-api-key
.. _`API Reference`: https://docs.bokeh.org/en/latest/docs/reference.html
.. _`User guide`: https://docs.bokeh.org/en/latest/docs/user_guide.html
.. _`Developer guide`: https://docs.bokeh.org/en/latest/docs/dev_guide.html
.. _Gallery: https://docs.bokeh.org/en/latest/docs/gallery.html
.. _Napoleon: http://sphinxcontrib-napoleon.readthedocs.org/en/latest/index.html
.. _`Napoleon's Google style`: https://sphinxcontrib-napoleon.readthedocs.io/en/latest/example_google.html#example-google
.. _`Google Python Style Guide`: https://google.github.io/styleguide/pyguide.html#383-functions-and-methods
.. _`reStructuredText primer on the Sphinx website`: https://www.sphinx-doc.org/en/master/usage/restructuredtext/basics.html
.. _`official reStructuredText website`: https://docutils.sourceforge.io/rst.html
.. _`Release Notes`: https://docs.bokeh.org/en/latest/docs/releases.html
.. _`release management`: https://github.com/bokeh/bokeh/wiki/BEP-2:-Release-Management

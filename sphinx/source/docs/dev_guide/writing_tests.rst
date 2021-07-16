.. _devguide_writing_tests:

Writing tests
=============

In order to help keep Bokeh maintainable, all Pull Requests that touch code
should normally be accompanied by relevant tests. While exceptions may be
made for specific circumstances, the default assumption should be that a
Pull Request without tests may not be merged.

Python Unit Tests
-----------------

Python unit tests maintain the basic functionality of the Python portion of
the Bokeh library. A few general guidelines will help you write Python unit
tests:

absolute imports
    In order to ensure that Bokeh's unit tests as relocatable and unambiguous
    as possible, always prefer absolute imports in test files. When convenient,
    import and use the entire module under test:

    * **GOOD**: ``import bokeh.models.transforms as bmt``
    * **GOOD**: ``from bokeh.embed import components``
    * **BAD**: ``from ..document import Document``

pytest
    All new tests should use and assume `pytest`_ for test running, fixtures,
    parameterized testing, etc. New tests should *not* use the ``unittest``
    module of the Python standard library.

Integration Tests
-----------------

To add a new screenshot integration test, first make sure you can run
existing screenshot tests, for example
:bokeh-tree:`tests/integration/annotations/test_whisker.py`. New screenshot
tests should follow these general guidelines:

* Be as simple as possible (only include things under test and nothing extra)

* Prefer the |bokeh.models| API

Once a new test is written, a base image for comparison is needed. To create
a new base image, add ``--set-new-base-screenshot`` to your standard
``pytest`` command to run the test. This will generate an image with the name
``base__<name_of_your_test>.png`` in the appropriate directory. Use ``git``
to check this image into the repository. All future screenshot tests will then
be compared against this base image.

JavaScript Tests (BokehJS)
--------------------------

To maintain the functionality of all :term:`BokehJS` components, Bokeh includes
various tests written in TypeScript. The BokehJS tests are located in
:bokeh-tree:`bokehjs/test`.

.. seealso::
    For more information on tests related to BokehJS, see
    :ref:`devguide_bokehjs_development_testing` in the
    :ref:`BokehJS section <devguide_bokehjs>` of this guide.

    .. _devguide_testing_ci:

Continuous Integration
----------------------

Every push to the ``main`` branch or any Pull Request branch on GitHub
automatically triggers a full test build on the `GithubCI`_ continuous
integration service.

You can see the list of all current and previous builds at this URL:
https://github.com/bokeh/bokeh/actions

Configuration
~~~~~~~~~~~~~

There are a number of files that affect the build configuration:

* :bokeh-tree:`conda.recipe/meta.yaml`
    Instructions for building a conda noarch package for Bokeh. This
    file is the single source of truth for build and test (but not
    runtime) dependencies.

* :bokeh-tree:`setup.py`
    Used to build sdist packages and "dev" installs. This file is also
    the single source of truth for runtime dependencies.

* :bokeh-tree:`setup.cfg`
    Contains some global configuration for build and test tools such as
    ``versioneer`` and ``pytest``.

Etiquette
~~~~~~~~~

CI services provide finite free build workers to Open Source projects. Grouping commits into meaningful
chunks of work before pushing into GitHub (i.e. not pushing on every commit)
will help you be considerate of others needing these limited resources.

.. _GithubCI: https://github.com/bokeh/bokeh/actions
.. _pytest: https://docs.pytest.org

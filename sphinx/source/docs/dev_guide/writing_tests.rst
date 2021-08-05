.. _devguide_writing_tests:

Writing tests
=============

In order to help keep Bokeh maintainable, all
:ref:`Pull Requests <devguide_pull_requests>` that add or update code should
include added or updated tests. While exceptions are possible, a Pull Request
without adequate tests will generally not be considered ready to merge.

Before writing any tests, you should make sure to go through the relevant
passages in :ref:`devguide_testing`. This chapter on writing tests assumes you
know how to run and analyze the tests you are working on.

Writing Python Tests
--------------------

If all or parts of your changes affect Bokeh's Python code, you should add or
update the relevant unit or integration tests.

See :ref:`devguide_testing_local_python` for information on how to run these
tests.

Unit tests
~~~~~~~~~~
Python unit tests help maintain the basic functionality of the Python portion of
the Bokeh library. They are located in :bokeh-tree:`tests/unit/bokeh` the folder
structure resembles the structure of :ref:`Bokeh's Python models <refguide>`.
The name of each test file begins with ``test_``, followed by the module's name.

Follow these general guidelines when writing Python unit tests:

Use absolute imports
    Bokeh's unit tests should be as relocatable and unambiguous as possible.
    Therefore, you should use absolute imports in test files whenever possible.
    You should also try to import and use the entire module in your tests:

    * **GOOD**: ``import bokeh.models.transforms as bmt``
    * **GOOD**: ``from bokeh.embed import components``
    * **BAD**: ``from ..document import Document``

Use ``pytest`` (not ``unittest``)
    All new tests should use and assume `pytest`_ for all testing-related
    aspects, such as test running, fixtures, or parameterized testing. Please
    do *not* use the ``unittest`` module of the Python standard library.

Integration tests
~~~~~~~~~~~~~~~~~

Bokeh's Python-focused integration tests help make sure that Bokeh's Python code
works as intended with the TypeScript code of :term:BokehJS. These integration
tests create screenshots of their output and compare those screenshots to
pre-defined baseline images. They are located in
:bokeh-tree:`tests/integration`, the folder structure resembles the structure
of Bokeh's Python models.

To add or update screenshot integration tests, first make sure that the
:ref:`existing Python integration tests <devguide_testing_local_python_integration>`
pass.

Follow these guidelines when adding or updating Python integration tests:

Keep your code as simple as possible
    Try to only include things that are essential to your test. Focus your test
    on one specific functionality. If possible, write several small tests
    instead of one complex one.

Use the |bokeh.models| API whenever possible
    Try to use Bokeh's
    :ref:`low-level bokeh.models interface <userguide_interfaces_models>` instead of
    the more high-level
    :ref:`bokeh.plotting interface <userguide_interfaces_plotting>`.

After adding or updating an integration test, you need to create a new baseline
image. To create a new base image, add ``--set-new-base-screenshot`` to the
standard ``pytest`` command you use to run the test. For each test, this will
generate an image with the name ``base__<name_of_your_test>.png`` in the
appropriate directory. Use ``git`` to check this image into the repository. All
future screenshot tests will then be compared against this base image.
[Is this really how this works? I just get  ``pytest: error: unrecognized arguments: --set-new-base-screenshot``]


JavaScript Tests (BokehJS)
--------------------------

To maintain the functionality of all :term:`BokehJS` components, Bokeh includes
various tests written in TypeScript. The BokehJS tests are located in
:bokeh-tree:`bokehjs/test`.

.. seealso::
    For more information on tests related to BokehJS, see
    :ref:`devguide_bokehjs_development_testing` in the
    :ref:`BokehJS section <devguide_bokehjs>` of this guide.

.. _GithubCI: https://github.com/bokeh/bokeh/actions
.. _pytest: https://docs.pytest.org

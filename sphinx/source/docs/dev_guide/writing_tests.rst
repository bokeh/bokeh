.. _devguide_writing_tests:

Writing tests
=============

To help keep Bokeh maintainable, all
:ref:`Pull Requests <devguide_pull_requests>` that add or update code should
include new or updated tests. While exceptions are possible, a Pull Request
without adequate tests will generally not be considered ready to merge.

Before writing any tests, you should make sure to go through the relevant
passages in :ref:`devguide_testing`. This chapter on writing tests assumes you
know how to run and analyze the tests you are working on.

.. _devguide_writing_tests_python:

Writing Python tests
--------------------

If all or parts of your changes affect Bokeh's Python code, you should add or
update the relevant unit or integration tests.

These tests are located in :bokeh-tree:`bokehjs/test`. See
:ref:`devguide_testing_local_python` for information on how to run them.

Information on contributing to Bokeh's Python code and models is available in
:ref:`devguide_models`.

Python unit tests
~~~~~~~~~~~~~~~~~
Python unit tests help maintain the basic functionality of the Python portion of
the Bokeh library. They are located in :bokeh-tree:`tests/unit/bokeh`. The
folder structure resembles the structure of
:ref:`Bokeh's Python models <refguide>`. The name of each test file begins with
``test_``, followed by the module's name.

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

Python integration tests
~~~~~~~~~~~~~~~~~~~~~~~~

Bokeh's Python-focused integration tests help make sure that Bokeh's Python code
works as intended with the TypeScript code of :term:`BokehJS`. These integration
tests create screenshots of their output and compare those screenshots to
pre-defined baseline images. They are located in
:bokeh-tree:`tests/integration`. The folder structure resembles the structure
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

[TBD: Is this really how this works? I just get  ``pytest: error: unrecognized arguments: --set-new-base-screenshot``]

.. _devguide_writing_tests_bokehjs:

Writing JavaScript tests (BokehJS)
----------------------------------

To maintain the functionality of all :term:`BokehJS` components, Bokeh includes
various tests written in TypeScript. These tests use a custom testing framework
that **requires Google Chrome or Chromium**. You need a recent version of one of
these browsers available on your system to work with these tests.

Like several other testing frameworks such as `Mocha`_ or `Jasmine`_, the
BokehJS testing framework uses ``describe()`` and ``it()`` functions to set up
tests.

The BokehJS tests are located in :bokeh-tree:`bokehjs/test`. See
:ref:`devguide_testing_local_typescript` for information on how to run them.

Information on contributing to BokehJS is available in
:ref:`devguide_bokehjs`.

.. _devguide_writing_tests_bokehjs_unit:

BokehJS unit tests
~~~~~~~~~~~~~~~~~~

The :term:`BokehJS` unit tests help make sure that the individual sections of
BokehJS function as expected. The unit tests for BokehJS are located in the
:bokeh-tree:`bokehjs/test/unit/` folder and sub-folders.

Use `Chai "expect" assertion style <Chai>`_ when writing unit tests for the
BokehJS testing framework. See the `API documentation of the Chai Assertion
Library <Chai documentation>`_ for more details on this style.

Use ``expect()`` together with the following elements to create assertions for
the BokehJS testing framework:

* ``to`` and ``be``: tokens to improve readability of assertions and connect
  elements
* ``not``: negates the following assertions
* ``throw``: asserts that an error is thrown. Accepts the following optional
  parameters: ``error_type`` (filter by ``Error``) and ``pattern`` (filter by
  regular expression or string).
* ``equal``: asserts strict equality (``===``). Expects an operand to compare
  to.
* ``similar``: asserts similarity within a defined tolerance. Expects an operand
  to compare to as well as an optional ``number`` as ``tolerance``.
* ``identical``: asserts same-value equality. Expects an operand to compare
  to.
* ``instanceof``: asserts that the tested element is an instance of the given
  constructor. Expects a ``Constructor`` to test against.
* ``undefined``: asserts strict equality (``===``) to ``undefined``
* ``null``: asserts strict equality (``===``) to ``null``
* ``true``: asserts strict equality (``===``) to ``true``
* ``false``: asserts strict equality (``===``) to ``false``
* ``NaN``: asserts that the tested element is ``NaN``
* ``empty``: asserts a length of ``0`` (for example, an empty string or an
  iterable that does not contain any retrievable values)
* ``below``: asserts that the tested element is below (``<``) a value. Expects a
  ``number`` to compare to.
* ``above``: asserts that the tested element is below (``>``) a value. Expects a
  ``number`` to compare to.

Some examples:

.. code-block:: TypeScript

    expect(m.name).to.be.null
    expect(grid0).to.be.instanceof(Column)
    expect(h.msgid).to.not.be.equal(h2.msgid)

In addition to ``expect()``, the BokehJS testing framework also uses an
``expect_element()`` function. You can use this function in combination with
``have`` and ``equal_attributes`` to test whether an element has certain
attributes. ``equal_attributes`` accepts an array of strings as an optional
``ignored_attributes`` parameter.

For example:

.. code-block:: TypeScript

    expect_element(svg).to.have.equal_attributes(string_to_html(`<p>test</p>`))

If you add new test files, you should add an entry in the directory index file.

[TBD: What is the index file, and what does "an appropriate entry" mean? What
needs to be added to it - and when is it OK not to add to it?]

.. _devguide_writing_tests_bokehjs_visual:

BokehJS visual tests
~~~~~~~~~~~~~~~~~~~~

:term:`BokehJS` uses visual regression tests as integration tests. These
baseline comparison tests help make sure that Bokeh's visual output is
consistent with the output expected by design. Any BokehJS-related pull requests
that result in changes to the visual output generated by BokehJS should include
visual baseline comparison tests.

In the background, BokehJS' testing framework runs a headless browser and takes
screenshots of the browser's output. The testing framework then compares the
visual output to each test's individual baseline files.

Each test in ``test:integration`` consists of two types of baseline comparisons:

Textual baseline comparison
    For each test, the testing framework compares the pixel location of certain
    elements in the visual output to pixel locations in the baseline data. This
    baseline data is stored as plain text in each test's respective ``.blf``
    file.

Visual baseline comparison
    For each test, the testing framework does a pixel-by-pixel comparison of a
    screenshot and a baseline image. These baseline images are stored as
    ``.png`` files. In contrast to textual baseline comparisons, visual baseline
    comparisons are platform-dependent. Even minor differences in font
    rendering, for example, will make the pixel-by-pixel comparison fail.

The visual baseline comparison tests are located in the
:bokeh-tree:`bokehjs/test/integration/` folder and sub-folders.
:ref:`Bokeh's CI <devguide_testing_ci>` runs these tests on Linux, macOS, and
Windows environments. The baseline files for each environment are located in the
:bokeh-tree:`bokehjs/test/baselines/` folder.

Follow these steps to write new visual tests or update existing tests:

1. Create or update visual testing scripts:
    To write a visual test for BokehJS' testing framework, start by importing
    the ``display()`` and ``fig()`` functions from the testing framework's
    ``_util`` module (located in :bokeh-tree:`bokehjs/test/integration/`):

    .. code-block:: TypeScript

        import {display, fig} from "./_util"

    When writing tests, replace BokehJS' standard ``show()`` function with the
    ``display()`` function in ``_util``. The ``display()`` function accepts the
    same arguments as ``show()`` but also captures the visual output for
    comparison.

    Similarly, replace BokehJS' standard ``figure()`` with the ``fig()``
    function in ``_util``. The ``fig()`` function expects an array of
    ``[width, height]`` as the first argument, followed by the same arguments as
    ``figure()``. However, to keep visual tests as efficient as possible, you should only
    use ``width`` and ``height`` if possible.

    Keep the width and height of your testing plot as small as possible while
    still being able to see the details you want to test with the naked eye. Try
    to keep the number of elements on your plot to a minimum.

    Follow this general pattern for visual tests:

    .. code-block:: TypeScript

        describe("Your Object", () => {
        it("should show certain behavior", async () => {
            const p = fig([width, height], {figure_attrs})

            ...

            await display(p)
        })
        })

    To change the sensitivity of a visual test, you have the option to set a
    threshold value. The threshold value represents the amounts of pixels by
    which a test image can differ from the baseline image before a test fails.
    To set a threshold value, use ``it.allowing(threshold)``. For example:

    .. code-block:: TypeScript

        describe("Your Object", () => {
        it.allowing(16)("should show certain behavior", async () => {

    Always run ``node make lint`` before committing TypeScript files.

2. Run tests locally:
    Run ``node make tests`` to test your changes on your system. To only run
    integration tests, use ``node make test:integration``.

    If you want to run a specific test only, use the ``-k`` argument and supply
    a search string. The search string is case-sensitive. The BokehJS testing
    framework tries to match your search string to the strings defined in the
    code's ``describe()`` and ``it()`` functions. For example:

    .. code-block:: sh

        $ node make test:integration -k 'Legend annotation'

    The first time you run a new or updated visual test, the BokehJS testing
    framework will notify you that baseline files are missing or outdated. At
    this point, it will also generate all missing or outdated baseline files for
    your operating system. The baseline files will be in a subfolder of
    :bokeh-tree:`bokehjs/test/baselines/`.

    Use the BokehJS :ref:`devtools server <devguide_testing_local_typescript_devtools>`
    to review your local test results. Optionally, you can use any PNG viewer to
    inspect the generated PNG files. Adjust your testing code until the test's
    visual output matches your expectations.

3. Generate CI baselines and commit test:
    As a final step before pushing your visual tests to Bokeh's GitHub
    repository, you need to generate and commit the baseline files using
    :ref:`Bokeh's CI <devguide_testing_ci>`.

    The baseline files are platform-dependent. This is why the CI will only work
    reliably if you upload baseline files that were created by the CI, not
    locally created files.

    Follow these steps to generate the necessary baseline files and upload them
    to Bokeh's CI:

    1. Push your changes to GitHub and wait for CI to finish.
    2. The CI will expectedly fail because baseline images are either missing
       (in case you created new tests) or outdated (in case you updated existing
       tests).
    3. After the CI has finished running, go to BokehJS's GitHubCI_ page. Find
       the most recent test run for your PR and download the associated
       ``bokehjs-report`` artifact.
    4. Unzip the downloaded artifact file into the root folder of your local
       Bokeh repository.
    5. Use the :ref:`devtools server <devguide_testing_local_typescript_devtools>`
       to review the baseline files the CI has created for each platform: first,
       go to ``/integration/report?platform=linux``, then to
       ``/integration/report?platform=macos``, and finally to
       ``/integration/report?platform=windows``.
    6. If you did not detect any unintentional differences, commit all new or
       modified ``*.blf`` and ``*.png`` files from the folders
       :bokeh-tree:`bokehjs/test/baselines/linux`,
       :bokeh-tree:`bokehjs/test/baselines/macos`, and
       :bokeh-tree:`bokehjs/test/baselines/windows`.
    7. Push your changes to GitHub again and verify that the tests pass this
       time.

.. note::
    Make sure to only push baseline files to the CI that the CI created for
    your specific pull request. Do not include any locally created baseline
    files in your pull request.

    After downloading and unpacking the baseline files from the CI, check your
    local :bokeh-tree:`bokehjs/test/baselines` directory for any modified files
    that are not part of your changes. Make sure only to commit baseline files
    that are necessary for your pull request. Reset the ``baselines`` directory
    after every failed test run with ``git clean`` or ``git clean -f``.

.. _`Mocha`: https://mochajs.org/
.. _`Jasmine`: https://jasmine.github.io/
.. _Chai: https://www.chaijs.com/guide/styles/#expect
.. _Chai documentation: https://www.chaijs.com/api/bdd/
.. _GithubCI: https://github.com/bokeh/bokeh/actions
.. _pytest: https://docs.pytest.org

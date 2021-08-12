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

.. _devguide_writing_tests_python:

Writing Python Tests
--------------------

If all or parts of your changes affect Bokeh's Python code, you should add or
update the relevant unit or integration tests.

These tests are located in :bokeh-tree:`bokehjs/test`. See
:ref:`devguide_testing_local_python` for information on how to run them.

Information on contributing to Bokeh's Python code and models is available in
:ref:`devguide_models`.

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

.. _devguide_writing_tests_bokehjs:

Writing JavaScript Tests (BokehJS)
----------------------------------

To maintain the functionality of all :term:`BokehJS` components, Bokeh includes
various tests written in TypeScript. These tests use a custom-made testing
framework which **requires Google Chrome or Chromium**. You need a recent
version of one of these browsers available on your system to work with these
tests.

[TBD:]

* is Chrome only required for visual tests or also for unit tests? And not for codebase/defaults?
* "Most tests for BokehJS use describe() and it() functions." This seems to be true for unit and integration tests?
* "They are written using Chai “expect” style" Is this a good ressource to link to: https://www.chaijs.com/guide/styles/)?
  also: is this only true for unit tests? `layouts.ts` seems to be the only integration test to use `expect()`. If yes, what is a good resource to link to
  for integration test writing?
* "If new test files are added, an appropriate entry in the directory index file
  should be added" What is the index file, and what needs to be added to it - and
  when is it OK not to add to it?.

The BokehJS tests are located in :bokeh-tree:`bokehjs/test`. See
:ref:`devguide_testing_local_typescript` for information on how to run them.

Information on contributing to BokehJS is available in
:ref:`devguide_bokehjs`.

.. _devguide_writing_tests_bokehjs_unit:

Unit tests
~~~~~~~~~~

[TBD: Do we need info on how to write JS unit tests?]

.. _devguide_writing_tests_bokehjs_visual:

Visual tests
~~~~~~~~~~~~

:term:`BokehJS` uses a series of visual baseline comparison tests. These tests
help make sure that Bokeh's visual output is consistent with the output expected
by design. Any BokehJS-related pull requests that result in changes to the
visual output generated by BokehJS should include visual baseline comparison
tests.

In the background, BokehJS' testing framework runs a headless browser and takes
screenshots of the browser's output. The testing framework then compares the
visual output to each test's dedicated baseline files.

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
    ``display()`` function in ``_util``. ``display()`` accepts the same
    arguments as ``show()`` but also captures the visual output for comparison.

    Similarly, replace BokehJS' standard ``figure()`` with the ``fig()``
    function in ``_util``. ``fig()`` expects an array of ``[width, height]`` as
    the first argument, followed by the same arguments as ``figure()``. To keep
    visual tests as efficient as possible, you should only use ``width`` and
    ``height``.

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

    If you want to only run a specific test, use the ``-k`` argument and supply
    a search string. The search string is case-sensitive. The BokehJS testing
    framework tries to match your search string to the strings defined in the
    code's ``describe()`` and ``it()`` functions. For example:

    .. code-block:: sh

        $ node make test:integration -k 'Legend annotation'

    The first time you run a new or updated visual test, the BokehJS testing
    framework will notify you that baseline files are missing our outdated. At
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
    Make sure to only push baseline files to the CI that were created by the CI
    for your specific pull request. Do not include any locally created baseline
    files in your pull request.

    After downloading and unpacking the baseline files from the CI, check your
    local :bokeh-tree:`bokehjs/test/baselines` directory for any modified files
    that are not part of your changes. Make sure only to commit baseline files
    that are necessary for your pull request. Reset the ``baselines`` directory
    after every failed test run (``git checkout`` and/or ``git clean``).

.. _GithubCI: https://github.com/bokeh/bokeh/actions
.. _pytest: https://docs.pytest.org

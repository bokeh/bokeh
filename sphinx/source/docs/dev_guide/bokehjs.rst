.. _devguide_bokehjs:

BokehJS
=======

BokehJS is the in-browser client-side runtime library that users of Bokeh
ultimately interact with. This library is written primarily in TypeScript
and is one of the unique things about the Bokeh plotting system.

.. _devguide_bokehjs_motivations:

BokehJS Motivations
-------------------

When researching the wide field of JavaScript plotting libraries, we found
that they were all architected and designed to integrate with other JavaScript.
If they provided any server-side wrappers, those were always "second class"
and primarily designed to generate a simple configuration for the front-end JS.
Of the few JS plotting libraries that offered any level of interactivity, the
interaction was not really configurable or customizable from outside the JS
itself. Very few JS plotting libraries took large and streaming server-side
data into account, and providing seamless access to those facilities from
another language like Python was not a consideration.

This, in turn, has caused the developers of Python plotting libraries to
only treat the browser as a "backend target" environment, for which they
will generate static images or a bunch of JavaScript.

.. _devguide_bokehjs_goals:

Goals
-----

BokehJS is intended to be a standalone, first-class JavaScript plotting
library and *interaction runtime* for dynamic, highly-customizable
information visualization.

.. _devguide_bokehjs_interface:

Interface
---------

BokehJS is a standalone JavaScript library for dynamic and interactive
visualization in the browser. It is built on top of HTML5 canvas, and designed
for high-performance rendering of larger data sets. Its interface is declarative,
in the style of Protovis_, but its implementation consists of a reactive scene
graph (similar to Chaco_).

More information is available at :ref:`userguide_bokehjs`.

CSS Class Names
---------------

The CSS for controlling Bokeh presentation are located in a ``bokeh.css`` file
that is compiled from several separate ``.less`` files in the BokehJS source
tree. All CSS classes specifically for Bokeh DOM elements are prefixed with
the string ``bk-``. For instance some examples are: ``.bk-plot``, ``.bk-toolbar-button``, etc.

.. _devguide_bokehjs_development:

Development
-----------

BokehJS's source code is located in the :bokeh-tree:`bokehjs` directory in Bokeh's
monorepo repository. All further instructions and shell commands assume that
``bokehjs/`` is the current directory.

Some guidelines to adhere to when working on BokehJS:

* Do not use ``for-in`` loops, especially unguarded by ``hasOwnProperty()`` Use
  ``for-of`` loop in combination with ``keys()``, ``values()`` and/or
  ``entries()`` from the ``core/util/object`` module instead.

Requirements
~~~~~~~~~~~~

* node 14.*
* npm 7.4+ (most recent version)
* chrome/chromium browser 90+ or equivalent

You can install nodejs with conda:

.. code-block:: sh

    $ conda install -c conda-forge nodejs

or follow the official installation `instructions <https://nodejs.org/en/download/>`_.

Upgrade your npm after installing or updating nodejs, or whenever asked by npm:

.. code-block:: sh

    $ npm install -g npm@7

Officially supported platforms are as follows:

* Linux Ubuntu 20.04+ or equivalent
* Windows 10 (or Server 2019)
* MacOS 10.15

BokehJS can be developed on different platforms and versions of aforementioned
software, but results may vary, especially when it comes to testing (visual
testing in particular).

Building
~~~~~~~~

BokehJS's build is maintained by using an in-house tool that visually resembles
gulp. All commands start with ``node make`` (don't confuse this with GNU make).

Most common commands:

* ``node make build``
* ``node make test``
* ``node make lint``

Use ``node make help`` to list all available commands.

``node make`` automatically runs ``npm install`` whenever ``package.json`` changes.

You can use ``tsc`` directly for error checking (e.g. in an IDE). However, don't use
it for code emit, because we rely on AST transforms to produce viable library code.

.. _devguide_bokehjs_development_testing:

Testing
~~~~~~~

BokehJS comes with its own suites of tests. All tests for BokehJS use ``describe()`` and
``it()`` functions. Unit tests are written using Chai "expect" style. Visual integration
tests use ``await()`` instead of ``expect()``.

To launch BokehJS tests, run ``node make test`` from within the
:bokeh-tree:`bokehjs/test` directory.

Instead of running all available BokehJS tests, you can also run individual test
suites with ``node make test:suite_name``. Available tests suites are:

* ``node make test:codebase``: Codebase tests checking file size limits
* ``node make test:defaults``: Tests checking synchronicity of defaults between Bokeh's
  Python and TypeScript models
* ``node make test:unit``: Unit tests for BokehJS
* ``node make test:integration``:
  :ref:`Visual integration tests <devguide_bokehjs_development_visual_testing>`
  comparing generated plots against a set of baseline files

You can combine the last two test suites by running ``node make test:lib``. Unit and
integration tests are run in a web browser (see requirements). The test suite
automatically starts the webbrowser with the right settings to ensure consistent test
results.

[TBD move this section to the visual testing section?]To review the visual tests' output, start BokehJS's devtools server:

.. code-block:: sh

    $ node test/devtools server
    listening on 127.0.0.1:5777

Open the server URL in a webbrowser and navigate to ``/integration/report``.
You can also use the devtools server to manually inspect and debug tests. For that, the
following endpoints are available:

* ``/unit``
* ``/defaults``
* ``/integration``

Those load BokehJS and the tests, but don't do anything. You have to issue ``Tests.run_all()``
in a JavaScript console. This allows you to set breakpoints before running code. You
can filter out tests by providing a string keyword or a regular expression. Alternatively,
you can run tests immediately with these endpoints:

* ``/unit/run``
* ``/defaults/run``
* ``/integration/run``

You can use ``?k=some%20text`` to filter tests by a keyword.

.. _devguide_bokehjs_development_visual_testing:

CI and Visual Testing
~~~~~~~~~~~~~~~~~~~~~

BokehJS uses a series of visual baseline comparison tests. These tests help make sure
that Bokeh's visual output is consistent with the output expected by design.

In the background, BokehJS' testing suite runs a headless browser and takes screenshots
of the browser's output. The testing suite then compares the visual output to each
test's dedicated baseline files.

Each test in ``test:integration`` consists of two types of baseline comparison:

Textual baseline comparison
  For each test, the testing suite compares the pixel location of certain elements in
  the visual output to pixel locations in a baseline file. The pixel locations are a set
  of bounding boxes. They are stored as plain text in each test's ``.blf`` files.

Visual baseline comparison
  For each test, the testing suite does a pixel-by-pixel comparison of a screenshot
  and a baseline image. These baseline images are stored as ``.png`` files. In contrast
  to textual baseline comparisons, visual baseline comparisons are platform-dependent.
  Even minor differences in font rendering, for example, will make the pixel-by-pixel
  comparison fail.

:ref:`Bokeh's CI <devguide_testing_ci>` runs these tests on Linux, MacOS, and Windows
environments. The visual baseline comparison tests are located in the
:bokeh-tree:`bokehjs/test/integration/` folder and its sub-folders. The baseline files
for each environment are located in the :bokeh-tree:`bokehjs/test/baselines/` folder.

Follow these steps to write new visual tests or update existing tests:

1. Write or update code:
    To write a test for BokehJS' testing suite, start by importing the ``display()`` and
    ``fig()`` functions from the ``_util`` module:

    .. code-block:: TypeScript

        import {display, fig} from "../_util"

    The ``display()`` function in ``_util`` is similar to BokehJS' standard ``show()``
    function: ``display()`` accepts the same arguments as ``show()`` but also captures
    the visual output for comparison.

    The ``fig()`` function in ``_util`` TBD

2. Run tests locally:
    [TBD]
    Use ``node make tests`` to incrementally test your changes on your system.
    TBD: optional: use BokehJS' devtools server to inspect results

3. Generate baselines and commit test:
    [TBD]

    Push your changes to GitHub and wait for CI to finish.
    If you added new tests, CI will expectedly fail with "missing baseline
    images" error message.
    If tests passed then you are done.
    If tests failed, go to BokehJS's GitHub_Actions_ page. Find the most recent
    test run for your PR and download the associated ``bokehjs-report`` artifact.
    Unzip the artifact archive at the root of the repository.
    Assuming devtools server is running in the background, go to ``/integration/report?platform=name``
    where ``name`` is either ``linux``, ``macos`` or ``windows`` and review the test output
    for each platform. If there are no unintentional differences, then commit all
    new or modified ``*.blf`` and ``*.png`` files under ``test/baselines/{linux,macos,windows}``.
    Push your changes to GitHub again and verify that tests pass this time.

    Textual baseline
    comparisons are generally cross-platform compatible. Therefore, you can generate the
    ``.blf`` files either locally (on supported platforms) or in
    :ref:`Bokeh's CI <devguide_testing_ci>`.

    Visual:  Therefore, you can run visual baseline comparisons locally
    locally, but given that baseline
    images for all three supported platforms have to be updated, the **preferred approach
    is to generate images and compare them in CI**.

.. note::

    Make sure to monitor the state of the ``test/baselines`` directory, so that you
    don't commit unnecessary files. If you do so, subsequent tests will fail. Reset
    this directory after every failed test run (``git checkout`` and/or ``git clean``).

Debugging in Headless Chrome
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Although testing in headless chrome and running tests manually in chrome should agree
with each other most of the time, there are rare cases where headless and GUI chrome
diverge. In this situation one has to debug bokehjs' code directly in the headless
browser.

Start bokehjs' devtools server in one console and run ``node make test:run:headless``
in another. This starts chrome in headless mode preconfigured for bokehjs' testing
setup. Then open chrome (or any other web browser), navigate to http://localhost:9222 and
click ``about:blank`` link. This opens remote devtools console. Use its navigation bar
and navigate to e.g. http://localhost:5777/integration/run (or other URL mentioned in
an earlier paragraph). You are now set up for debugging in headless chrome.

Minimal Model/View Module
~~~~~~~~~~~~~~~~~~~~~~~~~

Models (and views) come in many forms and sizes. At minimum, a model is implemented.
A view may follow if a "visual" model is being implemented. A minimal model/view
module looks like this:

.. code-block:: typescript

    import {BaseModel, BaseModelView} from "models/..."

    export class SomeModelView extends BaseModelView {
      model: SomeModel

      initialize(): void {
        super.initialize()
        // perform view initialization (remove if not needed)
      }

      async lazy_initialize(): Promise<void> {
        await super.lazy_initialize()
        // perform view lazy initialization (remove if not needed)
      }
    }

    export namespace SomeModel {
      export type Attrs = p.AttrsOf<Props>

      export type Props = BaseModel.Props & {
        some_property: p.Property<number>
        // add more property declarations
      }
    }

    export interface SomeModel extends SomeModel.Attrs {}

    export class SomeModel extends BaseModel {
      properties: SomeModel.Props
      __view_type__: SomeModelView

      // do not remove this constructor, or you won't be
      // able to use `new SomeModel({some_property: 1})`
      constructor(attrs?: Partial<SomeModel.Attrs>) {
        super(attrs)
      }

      static init_SomeModel(): void {
        this.prototype.default_view = SomeModelView

        this.define<SomeModel.Props>(({Number}) => ({
          some_property: [ Number, 0 ],
          // add more property definitions
        }))
      }
    }

For trivial modules like this, most of the code is just boilerplate to make
BokehJS's code statically type-check and generate useful type declarations
for further consumption (in tests or by users).

Code Style Guide
~~~~~~~~~~~~~~~~

BokehJS doesn't have an explicit style guide. Make your changes consistent in
formatting. Use ``node make lint``. Follow patterns observed in the surrounding
code and apply common sense.

.. _Chaco: https://github.com/enthought/chaco
.. _JSFiddle: http://jsfiddle.net/
.. _Protovis: http://mbostock.github.io/protovis/
.. _GitHub_Actions: https://github.com/bokeh/bokeh/actions?query=workflow%3ABokehJS-CI

.. _contributor_guide_bokehjs:

Contributing to BokehJS
=======================

:term:`BokehJS` is the in-browser client-side runtime library that users of Bokeh
ultimately interact with. This library is written primarily in TypeScript
and is one of the unique things about the Bokeh plotting system.

The central building blocks of all Bokeh visualizations are objects based on
Bokeh's :term:`models <Model>`. These models are representations of
:term:`plot <Plot>` elements, such as axes, :term:`glyphs <Glyph>`, or
:term:`widgets <Widget>`.

On the Python side, Bokeh serializes the attributes of each plot element object
into JSON data. On the browser side, BokehJS deserializes this JSON data and
creates JavaScript objects based on this information. BokehJS then uses these
JavaScript objects to render the visualization.

.. image:: /_images/bokeh_bokehjs.svg
    :class: image-border
    :alt: Flowchart describing the flow of data from Python objects through JSON
          to the browser-side. There, the JSON data is converted into JavaScript
          objects which then get rendered as output. Output can be HTML Canvas,
          WebGL, or SVG.
    :align: center
    :width: 100%

This combination of Python and JavaScript allows you to define a visualization
in Python while taking advantage of all the interactivity offered by JavaScript
running in a browser. Additionally, this combination enables you to do almost
all data handling with Python and use large and streaming server-side data with
an interactive JavaScript visualization.

Source code location
--------------------

The Bokeh repository contains Bokeh's Python code as well as the JavaScript code
of BokehJS. The BokehJS source code is located in the :bokeh-tree:`bokehjs`
directory in this monorepo repository.

**All further instructions and shell commands assume that** ``bokehjs/`` **is
your current directory.**

.. tip::
  Set the working folder of your IDE to the ``bokehjs`` directory. This way,
  some of the tools within your IDE might work better with the BokehJS source
  code.

.. _contributor_guide_bokehjs_interface:

BokehJS interface
-----------------

BokehJS is a standalone JavaScript library for dynamic and interactive
visualization in the browser. It is built on top of HTML5 canvas and designed
for high-performance rendering of larger data sets. While BokehJS accepts
visualizations defined in a JSON file, you can also :ref:`create visualizations
with BokehJS directly <userguide_bokehjs>`.

The interface of BokehJS is declarative in the style of D3.js_. Its
implementation consists of a reactive scene graph similar to Chaco_.

More information about creating visualizations directly in BokehJS is available
at :ref:`userguide_bokehjs`.

CSS class names
---------------

The CSS for controlling Bokeh visualizations is located in a ``bokeh.css`` file.
This file is compiled from several separate ``.less`` files in the
:bokeh-tree:`bokehjs/src/less/` directory. All CSS classes for Bokeh DOM
elements are prefixed with ``bk-``. For example: ``.bk-plot`` or
``.bk-toolbar-button``.

.. _contributor_guide_bokehjs_development:
.. _contributor_guide_bokehjs_style_guide:

Code Style Guide
-----------------

BokehJS doesn't have an explicit style guide. Make sure to run ``node make
lint`` or ``node make lint --fix`` before committing to the Bokeh repository.
Also, review the surrounding code and try to be consistent with the existing
code.

Some guidelines and tips to keep in mind when working on BokehJS:

* Do not use ``for-in`` loops, especially unguarded by ``hasOwnProperty()`` Use
  ``for-of`` loop in combination with ``keys()``, ``values()`` and/or
  ``entries()`` from the ``core/util/object`` module instead.
* Use double quotes (``"string"``) for strings by default. Use single
  quotes in cases where they help you avoid escaping quotation marks
  (``case '"': return "&quot;"``).
* Use template strings (template literals) for multiline, tagged, and
  interpolated strings ( ```Bokeh ${Bokeh.version}``` )


Development requirements
------------------------

To build and test BokehJS locally, follow the instructions in
:ref:`contributor_guide_setup`. This way, all required packages
should be installed and configured on your system.

BokehJS requires the following minimum versions:

* node 14+
* npm 7.4+ (most recent version)
* chrome/chromium browser 94+ or equivalent

Bokeh officially supports the following platforms for development and testing:

* Linux Ubuntu 20.04+ or equivalent
* Windows 10 (or Server 2019)
* MacOS 10.15

It is possible to work on BokehJS on different platforms and versions. However,
things might not work as intended, and some tests will not work.

Building BokehJS
----------------

For building, BokehJS relies on a custom tool similar to gulp_. All
commands start with ``node make`` (don't confuse this with GNU make).

Use ``node make help`` to list all available commands for the BokehJS build
system. These are the most common commands:

* ``node make build``: Builds the entire library, including legacy scripts.
* ``node make dev``: Builds the library without legacy scripts. This is faster
  than ``node make build`` but not suitable for production code or packaging.
* ``node make test``: Runs all BokehJS tests. To only run specific tests, see
  :ref:`contributor_guide_testing_local_javascript_selecting`.
* ``node make lint`` lint BokehJS with ESLint_. Run ``node make lint --fix`` to
  have ESLint fix some problems automatically.

``node make`` automatically runs ``npm install`` whenever ``package.json``
changes.

You can use ``tsc`` directly for error checking, for example inside an IDE.
However, don't use it for code emit, because BokehJS requires AST transforms to
produce usable library code.

Testing
-------

The Bokeh repository contains several :ref:`test suites
<contributor_guide_testing>`. These tests help to make sure that BokehJS
functions consistently as its own library as well as in combination with all
other components of Bokeh.

To learn more about running tests for BokehJS locally, see
:ref:`contributor_guide_testing_local_javascript`.

To learn more about adding and updating tests for BokehJS, see
:ref:`contributor_guide_writing_tests_bokehjs`.

Debugging in headless Chrome
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Some of :ref:`Bokeh's JavaScript tests <contributor_guide_testing_local_javascript>`
include running fully automated tests with a headless version of Chrome. For
local testing and especially for running and updating specific tests, :ref:`run
these tests manually with Chrome's GUI
<contributor_guide_testing_local_javascript_devtools>`.

In most cases, the results of running tests locally with Chrome's GUI are the
same as running them in the CI with headless Chrome. However, there are rare
cases where headless and GUI Chrome generate different results. In this
situation, you can't use the GUI - instead, you need to debug BokehJS' code
directly in the headless browser.

.. note::
    The following instructions only apply to the rare cases where you actually
    need to debug specifically in the headless version of Chrome. In most cases,
    you should be able to debug BokehJS with the GUI version of Chrome. See
    :ref:`contributor_guide_testing_local_javascript_devtools` for instructions
    on debugging BokehJS with the GUI version of Chrome.

Follow these steps in case you need to debug directly in the headless version of
Chrome:

1. Use ``node test/devtools server`` to start a BokehJS devtools server.
2. Open another console and run ``node make test:run:headless``. This starts
   Chrome in headless mode preconfigured for the BokehJS testing setup.
3. Open a Chrome or Chromium web browser and enter the URL
   ``http://localhost:9222``
4. Click the ``about:blank`` link at the bottom of the page. You can ignore the
   rest of that page.
5. Clicking this link opens a remote devtools console. Use the navigation bar
   inside this console to use the :ref:`endpoints
   <contributor_guide_testing_local_javascript_devtools_endpoints>` you would
   usually use with Bokeh's devtools server in the GUI version of the browser.

.. image:: /_images/chrome_headless_debugging.png
    :class: image-border
    :alt: Screenshot of a Chromium web browser displaying controls for Bokeh's
          preconfigured version of headless Chrome.
    :align: center
    :width: 100%

See :ref:`contributor_guide_testing_local_javascript_devtools` for more
information on Bokeh's devtools server.

Models and views in BokehJS
---------------------------

The fundamental building blocks of BokehJS are models and views.

Models
  BokehJS' models and their properties match the :ref:`models and respective
  properties in Bokeh's Python code <contributor_guide_python_models>`. Bokeh
  uses :ref:`defaults tests <contributor_guide_testing_local_javascript_selecting>`
  to make sure that models stay compatible between Python and BokehJS.

Views
  Any model that influences how things look in the browser requires a
  corresponding view.

For each model, the model definition and the corresponding view should be in the
same file in the :bokeh-tree:`bokehjs/models` directory.

When updating or adding new models and views, look at how similar models and
views are currently implemented.

Base classes for models and views
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

BokehJS models usually extend a base class. For example: the ``Axis`` model
extends ``GuideRenderer``, the ``Circle`` model extends ``XYGlyph``.

The model's corresponding view extends a corresponding base view class. For
example: ``AxisView`` extends ``GuideRendererView``, ``CircleView``
extends ``XYGlyphView``.

The base models and view are located in ``models``. A hypothetical example:

.. code-block:: typescript

  import {BaseModel, BaseModelView} from "models/..."

Models
~~~~~~

BokehJS models require a ``namespace`` and ``interface``. At a minimum, this
includes ``Attrs`` and ``Props``. There are also more properties you can use,
like ``Mixins`` or ``Visuals``.

If you want to update a model, the most relevant property in most cases is
``Props``. The properties defined there need to match the properties and types
of the respective Python model. The BokehJS properties are defined in
``core.properties`` and are usually imported with ``import * as p from
"core/properties"``.

.. code-block:: typescript

  export namespace SomeModel {
    export type Attrs = p.AttrsOf<Props>

    export type Props = BaseModel.Props & {
      some_property: p.Property<number>
      some_other_property: p.Property<string>
    }
  }

  export interface SomeModel extends SomeModel.Attrs {}

The model itself extends the respective ``BaseModel`` base class. If your model
includes a view, add the ``__view_type__`` property:

.. code-block:: typescript

  export class SomeModel extends BaseModel {
    properties: SomeModel.Props
    // only when view is required:
    __view_type__: SomeModelView

    // do not remove this constructor, or you won't be
    // able to use `new SomeModel({some_property: 1})`
    // this constructor
    constructor(attrs?: Partial<SomeModel.Attrs>) {
      super(attrs)
    }

    static {
      this.prototype.default_view = SomeModelView

      this.define<SomeModel.Props>(({Number, String}) => ({
        some_property: [ Number, 0 ],
        some_other_property: [ String, "Default String" ],
        // add more property definitions and defaults
        // use properties from lib/core/property and primitives from lib/core/kinds
        // does have to match Python, both type and default value (and nullability)
      }))
    }
  }

Views
~~~~~

If your model requires display-related logic, you need to define a view. A view
generally handles how a model is displayed in the browser.

Views extend the respective ``BaseView`` base class.

.. code-block:: typescript

    export class SomeModelView extends BaseView {
      override model: SomeModel

      initialize(): void {
        super.initialize()
        // perform view initialization (remove if not needed)
      }

      async lazy_initialize(): Promise<void> {
        await super.lazy_initialize()
        // perform view lazy initialization (remove if not needed)
      }
    }

.. _D3.js: https://d3js.org/
.. _Chaco: https://github.com/enthought/chaco
.. _gulp: https://gulpjs.com/
.. _ESLint: https://eslint.org/
.. _JSFiddle: http://jsfiddle.net/
.. _GitHub_Actions: https://github.com/bokeh/bokeh/actions?query=workflow%3ABokehJS-CI

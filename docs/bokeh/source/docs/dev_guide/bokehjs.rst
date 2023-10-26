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

In addition to using BokehJS to create visualizations based on JSON data, you
can also use BokehJS as a standalone JavaScript library. See
:ref:`ug_advanced_bokehjs` for more information on creating visualizations
directly with BokehJS.

.. _contributor_guide_bokehjs_source_location:

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

.. _contributor_guide_bokehjs_css:

CSS for BokehJS
---------------

The CSS definitions for BokehJS are contained in several ``.less`` files in the
:bokeh-tree:`bokehjs/src/less/` directory. All CSS classes for Bokeh DOM
elements are prefixed with ``bk-``. For example: ``.bk-plot`` or
``.bk-tool-button``.

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
* Use `template literals (template strings)`_ for multiline, tagged, and
  interpolated strings ( ```Bokeh ${Bokeh.version}``` ).

Always lint your BokehJS code with ESLint_: From the :bokeh-tree:`bokehjs`
directory, run ``node make lint`` to check your code. Run
``node make lint --fix`` to have ESLint fix some problems automatically. For
more details, see the rules defined in :bokeh-tree:`bokehjs/eslint.js`.

.. tip::
  If you use VSCode, you can use the following configuration for your workspace
  to use ESLint directly in the editor:

  .. code-block:: json

        "eslint.format.enable": true,
        "eslint.lintTask.enable": true,
        "eslint.debug": false,
        "eslint.quiet": false,
        "eslint.options": {
          "cache": true,
          "extensions": [".ts"],
          "overrideConfigFile": "./eslint.js"
        },
        "eslint.workingDirectories": [
          "./bokehjs"
        ]

  This requires the `ESLint extension for VSCode`_ and ESLint version 8 or above
  to be installed.

.. _contributor_guide_bokehjs_requirements:

Development requirements
------------------------

To build and test BokehJS locally, follow the instructions in
:ref:`contributor_guide_setup`. This way, all required packages
should be installed and configured on your system.

Developing BokehJS requires the following minimum versions:

* Node.js 18+
* npm 8+
* Chrome/Chromium browser 118+ or equivalent

Bokeh officially supports the following platforms for development and testing:

* Linux Ubuntu 22.04+ or equivalent
* Windows 10 (or Server 2019)
* MacOS 10.15

It is possible to work on BokehJS using different platforms and versions.
However, things might not work as intended, and some tests will not work.

.. _contributor_guide_bokehjs_building:

Building BokehJS
----------------

For building, BokehJS relies on a custom tool similar to gulp_. All
commands start with ``node make``.

Use ``node make help`` to list all available commands for the BokehJS build
system. These are the most common commands:

* ``node make build``: Builds the entire library, including the extensions
  compiler.
* ``node make dev``: Builds the library without the extensions compiler. This is
  faster than ``node make build`` but not suitable for production code or
  packaging.
* ``node make test``: Runs all BokehJS tests. To only run specific tests, see
  :ref:`contributor_guide_testing_local_javascript_selecting`.
* ``node make lint`` lint BokehJS with ESLint_. Run ``node make lint --fix`` to
  have ESLint fix some problems automatically.

``node make`` automatically runs ``npm install`` whenever ``package.json``
changes.

.. _contributor_guide_bokehjs_testing:

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

.. _contributor_guide_bokehjs_models_views:

Models and views in BokehJS
---------------------------

The fundamental building blocks of visualizations in BokehJS are models and
views:

Models
  A model is a data structure that may or may not have a visual representation.
  BokehJS' models and their properties match the :ref:`models and respective
  properties in Bokeh's Python code <contributor_guide_python_models>`. Bokeh
  uses :ref:`defaults tests <contributor_guide_testing_local_javascript_selecting>`
  to make sure that models stay compatible between Python and BokehJS.

Views
  A view defines the visual representation of a model. Any model that influences
  how things look in the browser requires a corresponding view.

For each model, the model definition and the corresponding view should be in the
same file in the :bokeh-tree:`bokehjs/models` directory.

.. tip::
  When updating or adding new models and views, look at how similar models and
  views are currently implemented.

Base classes for models and views
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

BokehJS models usually extend a base class. For example: the ``Axis`` model
extends ``GuideRenderer``, the ``Circle`` model extends ``XYGlyph``.

The model's corresponding view extends a corresponding base view class. For
example: ``AxisView`` extends ``GuideRendererView``, ``CircleView``
extends ``XYGlyphView``.

Suppose you want to define a new type of :ref:`action button tool for the Bokeh
tool bar <ug_interaction_tools_actions>`, called ``NewActionTool``. The model for
your new button would inherit from ``ActionTool``, and its corresponding view
would inherit from ``ActionToolView``:

.. code-block:: typescript

  import {ActionTool, ActionToolView} from "./action_tool"

Models
~~~~~~

BokehJS models require a ``namespace`` and ``interface``. At a minimum, this
includes ``Attrs`` and ``Props``. There are also more properties you can use,
like ``Mixins`` or ``Visuals``.

.. code-block:: typescript

  export namespace NewActionTool {
    export type Attrs = p.AttrsOf<Props>

    export type Props = ActionTool.Props & {
      some_property: p.Property<number>
      some_other_property: p.Property<string>
    }
  }

  export interface NewActionTool extends NewActionTool.Attrs {}

If you want to update a model, the most relevant property in most cases is
``Props``. The properties you define there need to match the properties and
types of the respective Python model. The BokehJS properties are defined in
``core.properties`` and are usually imported with
``import * as p from "core/properties"``.

Next, define the actual model itself. The model extends the respective
``BaseModel`` base class. If your model includes a view, this is also where you
link model and view.

.. code-block:: typescript

  export class NewActionTool extends ActionTool {
    properties: NewActionTool.Props
    // only when a view is required:
    __view_type__: NewActionToolView

    // do not remove this constructor, or you won't be
    // able to use `new NewActionTool({some_property: 1})`
    // this constructor
    constructor(attrs?: Partial<NewActionTool.Attrs>) {
      super(attrs)
    }

    static {
      this.prototype.default_view = NewActionToolView

      this.define<NewActionTool.Props>(({Number, String}) => ({
        some_property: [ Number, 0 ],
        some_other_property: [ String, "Default String" ],
        ...
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

    export class NewActionToolView extends ActionToolView {
      declare model: NewActionToolView

      initialize(): void {
        super.initialize()
        // perform view initialization (remove if not needed)
      }

      async lazy_initialize(): Promise<void> {
        await super.lazy_initialize()
        // perform view lazy initialization (remove if not needed)
      }

      ...
    }

.. _gulp: https://gulpjs.com/
.. _ESLint: https://eslint.org/
.. _JSFiddle: http://jsfiddle.net/
.. _GitHub_Actions: https://github.com/bokeh/bokeh/actions?query=workflow%3ABokehJS-CI
.. _ESLint extension for VSCode: https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint
.. _template literals (template strings): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals

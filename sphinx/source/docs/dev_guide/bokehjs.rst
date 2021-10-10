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
running in a browser. Additionally, this combination allows you to do almost all
data handling with Python and use large and streaming server-side data with an
interactive JavaScript visualization.

.. _contributor_guide_bokehjs_interface:

BokehJS interface
-----------------

BokehJS is a standalone JavaScript library for dynamic and interactive
visualization in the browser. It is built on top of HTML5 canvas, and designed
for high-performance rendering of larger data sets. While BokehJS accepts
visualizations defined in a JSON file, you can also create visualizations with
BokehJS directly.

Its interface is declarative, in the style of D3.js_, but its implementation
consists of a reactive scene graph (similar to Chaco_).

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

Development
-----------

BokehJS's source code is located in the :bokeh-tree:`bokehjs` directory in
Bokeh's monorepo repository. All further instructions and shell commands assume
that ``bokehjs/`` is your current directory.

Some guidelines to adhere to when working on BokehJS:

* Do not use ``for-in`` loops, especially unguarded by ``hasOwnProperty()`` Use
  ``for-of`` loop in combination with ``keys()``, ``values()`` and/or
  ``entries()`` from the ``core/util/object`` module instead.

Requirements
~~~~~~~~~~~~

To prepare your system for building and testing BokehJS locally, follow the
instructions in :ref:`contributor_guide_setup`. This way, all required packages
should be installed and configured on your system.

Specifically, BokehJS requires the following minimum versions:

* node 14+
* npm 7.4+ (most recent version)
* chrome/chromium browser 94+ or equivalent

Bokeh officially supports the following platforms for development and testing:

* Linux Ubuntu 20.04+ or equivalent
* Windows 10 (or Server 2019)
* MacOS 10.15

It is possible to work on BokehJS on different platforms and versions. However,
things might not work as intended and some tests will not work.

Building
~~~~~~~~

For building, BokehJS relies on a custom tool similar to gulp_. All
commands start with ``node make`` (don't confuse this with GNU make).

Use ``node make help`` to list all available commands for the BokehJS build
system. These are the most common commands:

* ``node make build``
* ``node make test``
* ``node make lint``

``node make`` automatically runs ``npm install`` whenever ``package.json``
changes.

You can use ``tsc`` directly for error checking (e.g. in an IDE). However, don't
use it for code emit, because BokehJS requires AST transforms to produce viable
library code.

Testing
~~~~~~~

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
include running fully automated tests with a headless version of Chrome. You can
also :ref:`run these tests manually with Chrome's GUI
<contributor_guide_testing_local_javascript_devtools>`.

The results of these automated tests should be the same as running the tests
manually. However, there are rare cases where headless and GUI Chrome generate
different results. In this situation, you can't use the GUI - instead, you need
to debug BokehJS' code directly in the headless browser.

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

Minimal Model/View module
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

      static {
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

.. _D3.js: https://d3js.org/
.. _Chaco: https://github.com/enthought/chaco
.. _gulp: https://gulpjs.com/
.. _JSFiddle: http://jsfiddle.net/
.. _GitHub_Actions: https://github.com/bokeh/bokeh/actions?query=workflow%3ABokehJS-CI

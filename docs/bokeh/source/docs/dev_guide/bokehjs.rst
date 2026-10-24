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

Always lint your BokehJS code with Oxlint_: From the :bokeh-tree:`bokehjs`
directory, run ``node make lint`` to check your code. Run
``node make lint --fix`` to have Oxlint fix some problems automatically. For
more details, see the rules defined in :bokeh-tree:`bokehjs/.oxlintrc.json`.
Type-aware rules use TypeScript 7 through ``oxlint-tsgolint``. The existing
stylistic checks run through Oxlint's JavaScript plugin support.

.. tip::
  You can lint the code in your IDE. For example, if you use VSCode, then
  you need the `Oxc extension for VSCode`_ to be installed. This doesn't
  require any additional configuration.

.. _contributor_guide_bokehjs_requirements:

Development requirements
------------------------

To build and test BokehJS locally, follow the instructions in
:ref:`contributor_guide_setup`. This way, all required packages
should be installed and configured on your system.

Developing BokehJS requires the following minimum versions:

* Node.js 24+
* npm 11+
* Chrome/Chromium browser 141+ or equivalent

Bokeh officially supports the following platforms for development and testing:

* Linux Ubuntu 24.04+ or equivalent
* Windows 10 (or Server 2019)
* macOS 13.5+

The macOS minimum follows the `Node.js 24 platform requirements
<https://github.com/nodejs/node/blob/v24.x/BUILDING.md#platform-list>`_.
These requirements apply to the source development environment. Installed
Bokeh users need :ref:`external Node.js <install_compiler_runtime>` only for
source compilation.

It is possible to work on BokehJS using different platforms and versions.
However, things might not work as intended, and some tests will not work.

.. _contributor_guide_bokehjs_building:

Building BokehJS
----------------

The ``node make`` commands coordinate asset generation, TypeScript compilation,
and Rolldown_ bundling.

Use ``node make help`` to list all available commands for the BokehJS build
system. These are the most common commands:

* ``node make build``: Builds the entire library, including the extensions
  compiler.
* ``node make dev``: Builds the library bundles and
  declarations for local development. Use the full build for packaging.
* ``node make watch``: Rebuilds after source changes.
* ``node make build:typecheck``: Checks the build and compiler infrastructure.
* ``node make build:all``: Builds the library and test bundles.
* ``node make test``: Runs all BokehJS tests. To only run specific tests, see
  :ref:`contributor_guide_testing_local_javascript_selecting`.
* ``node make test:frameworks``: Packs and installs BokehJS and its framework
  adapters, builds the React/Vite, React/Next.js, Vue, Svelte, Web
  Component, vanilla Vite/Webpack/Rspack, and server-side-rendering examples,
  and runs the browser lifecycle tests in production and development builds.
  This is also part of ``node make test`` in continuous integration.
* ``node make lint`` lint BokehJS with Oxlint_. Run ``node make lint --fix`` to
  have Oxlint fix some problems automatically.

Run ``pixi run --locked setup`` from the repository root after dependency
changes. Build commands use the installed locked dependencies and never run
``npm install``. The bootstrap uses Rolldown directly; it needs no hand-managed
compiler cache or rebuild flag.

Build outputs and extensions compiler
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The native TypeScript 7 compiler emits JavaScript modules, type declarations,
and source maps under ``build/js/lib``. The asset tasks compile LESS, wrap CSS
and GLSL as importable modules, and generate the parser from its Nearley grammar.
Rolldown resolves and bundles these modules and uses Oxc_ for minification.
This is the same bundler and minifier used by Vite.

The browser bundles retain a small adapter for Bokeh's ``require`` and
``register_plugin`` interfaces. Its lazy module registry shares constructors
and the model resolver across the core bundle, optional components, and custom
extensions. These bundles preserve every public module export, including exports
referenced only through ``Bokeh.require``. The standalone ESM bundle in
``build/esm`` can additionally tree shake unused exports.

Class names participate in Python/BokehJS model registration and serialization.
The shared output settings in :bokeh-tree:`bokehjs/src/compiler/bundle.ts`
preserve class names in both development and minified bundles. Internal function
names may be shortened in minified output.
Property names must also remain unchanged. Check these settings and run the
minified and extension interoperability tests when changing the build pipeline.

TypeScript compilation and type checking use TypeScript 7, including custom
extensions and Oxlint's type-aware rules. The Vue example uses
``typescript-native-bridge`` to run the TS7 checker behind the classic JavaScript
API required by ``vue-tsc`` for scripts and templates. Its TS6-derived API
compatibility layer is confined to that example's development tooling. The
bridge requires glibc 2.35 or later on Linux and does not support Alpine/musl.
It is not shipped in Bokeh's browser bundles or Python package. Extension
compilation invokes Microsoft's TS7 CLI instead of the former JavaScript
compiler API.

For inline custom models, Python collects implementations, installs declared
npm dependencies, consults the cache hooks, and sends one JSON request to the
Node.js compiler. TypeScript 7 checks TypeScript sources and emits ESM. Rolldown
resolves the complete graph, including relative files, npm packages, CommonJS
dependencies, and dynamic imports with statically known module paths. The
result uses Bokeh's existing plugin registry and shares the page's BokehJS
classes. Python does not walk dependencies or rewrite ``require`` calls.

The public ``bokeh.util.compiler.nodejs_compile`` function retains its
``{code, deps}`` result for JavaScript and TypeScript, with CommonJS code.
``get_cache_hook`` and ``set_cache_hook`` retain the same compiled-result
contract. Rolldown consumes cached CommonJS implementations without compiling
them again. These compatibility interfaces serve existing callers and caches;
new inline graph compilation uses ESM. LESS compilation still returns CSS.

The Bokeh distribution includes the ``compiler.js`` launcher, a bundled
JavaScript adapter in ``js/compiler/compiler.mjs``, its source map and notices,
and a pinned npm package manifest and lockfile. BokehJS declarations accompany
the browser bundles. The native TypeScript package supplies its own standard
library declarations. Compiler assets are never added to browser resources.

On the first compiler use, the launcher runs ``npm ci`` with the shipped
lockfile to install native TypeScript 7 and Rolldown into a user cache. Package
scripts are disabled and native binaries come from the pinned npm packages.
The launcher checks the tools before publishing the completed cache entry.
Concurrent callers use separate temporary installation directories and share
the completed entry. A failed installation is not treated as a completed cache.
The package directory and current working directory are not modified.

The cache is keyed by the shipped compiler inputs and host runtime. Set
``BOKEH_COMPILER_CACHE`` to override its location. Warm compilation requires
neither npm nor network access, unless the extension installs its own
dependencies. Stop compiler processes before removing the cache to reclaim
disk space. The next use reinstalls the pinned packages.
See :ref:`ug_advanced_extensions_compiler_cache` for a cache-warming command
and the runtime requirements for reusing a prepared cache.

Running this compiler requires external Node.js 22.13 or later, found on
``PATH`` or selected with ``BOKEH_NODEJS_PATH``. npm and network access are
needed for the first installation. ``BOKEH_NPMJS_PATH`` can select an existing
``npm-cli.js`` when it cannot be discovered beside Node.js or through ``PATH``.
Bokeh does not install Node.js or npm. The source development environment
supplies Node.js 24 and npm; no Go toolchain is needed.

``pixi run --locked setup`` installs the local Python package for development.
``pixi run --locked -e build build-py`` builds the Bokeh wheel and source archive
from the generated assets. The source distribution contains prebuilt assets and
can be rebuilt without invoking Node.js or npm. Compiler dependency downloads
happen when compilation is first requested, not while building the Python
package from that source distribution.

Keep the exact TypeScript and Rolldown versions in
:bokeh-tree:`bokehjs/src/compiler/runtime/package.json` synchronized with the
development dependencies, and regenerate its adjacent lockfile when updating
them. The compiler build verifies these versions.

Source maps are shipped with browser bundles, the compiler adapter,
and Bokeh's type declarations. Packaging checks all required assets.
CI runs :bokeh-tree:`bokehjs/test/validate_extensions.py` with the installed wheel
and an explicit external Node.js installation. It checks first-use npm
installation and cache reuse with npm and network access disabled, along with
the extension browser workflows.

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
same file in the :bokeh-tree:`bokehjs/src/lib/models` directory.

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

All model subclasses inherit the lifecycle-aware ``create()`` factory, so a
custom extension does not need to repeat a constructor. Instantiate the model
with ``NewActionTool.create({some_property: 1})``. Property defaults,
``initialize()``, and ``connect_signals()`` run after all subclass field
initializers have completed. A custom constructor that does more than forward
attributes must be ``protected`` so callers cannot bypass ``create()``.

Use each lifecycle phase for one kind of work:

* field initializers create instance-local storage, but must not read Bokeh
  properties because property defaults have not run yet.
* property default functions may read fields initialized by the complete
  subclass constructor chain.
* ``initialize()`` may read properties and construct derived state, and an
  override must call ``super.initialize()``.
* ``connect_signals()`` owns subscriptions and must call
  ``super.connect_signals()``. Corresponding cleanup belongs in
  ``disconnect_signals()`` or ``destroy()``.

For example, extension setup or tests should make construction and cleanup
explicit:

.. code-block:: typescript

  const tool = NewActionTool.create({some_property: 1})
  try {
    // inspect or register the initialized model
  } finally {
    tool.destroy()
  }

Register extension models explicitly when they will be deserialized. Use a
dedicated ``ModelResolver`` and call ``register_standard_models()`` and
``register_models({NewActionTool}, resolver)`` with that resolver. The object
key becomes the stable serialized model name, so production minifiers may
safely rename the JavaScript class identifier.

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

.. _Rolldown: https://rolldown.rs/
.. _Oxc: https://oxc.rs/
.. _Oxlint: https://oxc.rs/docs/guide/usage/linter
.. _JSFiddle: http://jsfiddle.net/
.. _GitHub_Actions: https://github.com/bokeh/bokeh/actions?query=workflow%3ABokehJS-CI
.. _Oxc extension for VSCode: https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode
.. _template literals (template strings): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals

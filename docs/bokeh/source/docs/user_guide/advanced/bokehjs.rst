.. _ug_advanced_bokehjs:

BokehJS
=======

BokehJS is a client-side library that lets you create interactive plots and
applications. It takes care of drawing, rendering, and event handling. The
Bokeh Python library (and libraries for other languages such as R, Scala,
and Julia) enables convenient high-level interaction with BokehJS, so you
don't have to worry about JavaScript or web development.

However, BokehJS also has its own API that lets you do pure JavaScript development
using BokehJS directly. Additionally, :ref:`ug_advanced_extensions` with custom
models typically require direct interaction with BokehJS.

.. warning::
    The BokehJS APIs is still in development and may undergo changes in future
    releases.

Obtaining BokehJS
-----------------

BokehJS is available via CDN and ``npm``. See the :ref:`install_bokehjs`
section of the :ref:`installation` page for more details.

Using BokehJS in component frameworks
-------------------------------------

The npm package provides an ESM entry point and can be imported while doing
server-side rendering. Creating views still requires a browser, so mount plots
from the framework's client-side lifecycle and dispose them when the component
unmounts. The disposal handle owns all views and, when Bokeh created it, the
temporary document as well.

Thin adapters implement this ownership pattern for the common component
frameworks. Install ``@bokeh/bokehjs`` together with the adapter for your
framework (``@bokeh/react``, ``@bokeh/vue``, ``@bokeh/svelte``, or
``@bokeh/angular``); the framework itself remains a peer dependency. In React,
use the ``Bokeh`` component or the lower-level
``useBokeh()`` hook from ``@bokeh/react``:

.. code-block:: tsx

    import {Bokeh} from "@bokeh/react"
    import type {Plot} from "@bokeh/bokehjs"

    function PlotView({model}: {model: Plot}) {
      return <Bokeh model={model} className="plot" />
    }

The ``@bokeh/react`` entry point declares a React client boundary for use with
frameworks such as Next.js. In a Next.js App Router application, construct
Bokeh models inside a Client Component instead of passing them from a Server
Component because model instances are not serializable props:

.. code-block:: tsx

    "use client"

    import {useState} from "react"
    import {Plotting} from "@bokeh/bokehjs"
    import {Bokeh} from "@bokeh/react"

    export function PlotView() {
      const [plot] = useState(() => {
        const plot = Plotting.figure({title: "BokehJS with Next.js"})
        plot.line([1, 2, 3], [2, 5, 3])
        return plot
      })
      return <Bokeh model={plot} className="plot" />
    }

Vue provides the corresponding ``Bokeh`` component and ``useBokeh()``
composable in ``@bokeh/vue``:

.. code-block:: vue

    <script setup lang="ts">
    import {Bokeh} from "@bokeh/vue"
    import type {Plot} from "@bokeh/bokehjs"

    defineProps<{model: Plot}>()
    </script>

    <template>
      <Bokeh :model="model" class="plot" />
    </template>

Svelte applications can use the ``bokeh`` action from ``@bokeh/svelte``:

.. code-block:: text

    <script lang="ts">
    import {bokeh} from "@bokeh/svelte"
    import type {Plot} from "@bokeh/bokehjs"

    export let model: Plot
    </script>

    <div use:bokeh={{model}}></div>

Angular provides a standalone component in ``@bokeh/angular``:

.. code-block:: typescript

    import {Component} from "@angular/core"
    import {BokehComponent} from "@bokeh/angular"

    @Component({
      selector: "app-root",
      imports: [BokehComponent],
      template: `<bokeh-plot [model]="plot"></bokeh-plot>`,
    })
    export class App {
      readonly plot = plot
    }

For other frameworks, ``@bokeh/web-component`` supplies a standards-based
custom element:

.. code-block:: typescript

    import {BokehElement, defineBokehElement} from "@bokeh/web-component"

    defineBokehElement()
    const element = document.createElement("bokeh-plot") as BokehElement
    element.model = plot
    document.body.append(element)

Applications without a component framework can use the root ``mount()`` API.
The same source works with Vite, Webpack, and Rspack:

.. code-block:: typescript

    import {MountError, mount} from "@bokeh/bokehjs"

    const mounted = mount(plot, document.querySelector<HTMLElement>("#app")!, {
      on_error(error) {
        if (error instanceof MountError) {
          console.error(error.kind, error.root_key, error)
        }
      },
    })
    await mounted.ready

    // Later, when your application removes the host element:
    async function removePlot() {
      await mounted.dispose()
    }

``mount()`` returns its ``BokehMount`` immediately. Await ``ready`` before
depending on rendered views. Failures are ``MountError`` instances classified
as source, target, render, abort, or early-disposal errors; keyed failures also
identify ``root_key``. The handle owns its views and listeners, but never its
DOM targets. A document created for bare models is mount-owned and released on
failure or disposal; a supplied ``Document`` remains caller-owned.

Discovering declarative mounts from page JavaScript
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Page JavaScript does not always create the mount it needs to inspect. An
artifact loader, Sphinx extension, or other declarative bootstrap may run after
application code. Use the stable host element as the rendezvous point instead
of searching ``Bokeh.index`` or relying on script order. ``when_mounted()``
returns an existing ``target.bokehMount`` immediately or waits for that target
to publish one. The wait is target-local—there is no process-wide mount
registry—and accepts an ``AbortSignal``.

This example is covered by the BokehJS mount unit suite. The observer script
intentionally appears before the artifact loader:

.. code-block:: html

    <div id="external-sales-plot"></div>
    <button id="remove-sales-plot">Remove plot</button>

    <script type="module">
      const target = document.querySelector("#external-sales-plot")
      const controller = new AbortController()
      window.addEventListener("pagehide", () => controller.abort(), {once: true})

      const mounted = await Bokeh.when_mounted(target, {signal: controller.signal})
      await mounted.ready

      const plot = mounted.root("sales")
      const source = mounted.document.get_model_by_name("sales-source")
      const plot_view = plot == null ? null : mounted.view_lookup.find_one(plot)
      console.log({plot, source, plot_view})

      document.querySelector("#remove-sales-plot").addEventListener("click", async () => {
        await mounted.dispose()
      }, {once: true})
    </script>

    <!-- This later script creates or decodes the mount with logical root "sales". -->
    <script src="/assets/sales-artifact.js"></script>

Every resolved logical-root target exposes the same ``BokehMount`` through
``target.bokehMount``. ``HTMLElement`` targets also carry a
``data-bokeh-mounted`` marker while that handle is current. Disposal, detach,
and target replacement clear the handle and marker only when they still belong
to that mount, so disposal of a stale handle cannot erase a newer remount.
``target.bokehMountError`` retains a structured pre-handle failure until a
later mount publishes successfully.

Bootstrap authors must report failures that happen before ``mount()`` can
return a handle. This makes current and later calls to ``when_mounted()`` reject
instead of waiting forever:

.. code-block:: javascript

    try {
      await bootstrapArtifact(target)
    } catch (cause) {
      Bokeh.publish_mount_error(
        target,
        new Bokeh.MountError("source", "Unable to create the sales mount", cause),
      )
    }

Normal asynchronous target and render failures are published automatically by
``BokehMount``. Advanced integrations may also listen for the target-local
``bokeh:mounted`` and ``bokeh:mount-error`` events, but ``when_mounted()`` is
the preferred consumer API because it handles existing state, future state,
and abort cleanup consistently.

``view_lookup`` exposes only view queries such as ``find_one()``, ``query()``,
and ``get_one()``. It does not expose ``ViewManager`` mutation operations.
Prefer ``view(key)`` for a logical root and use ``view_lookup`` only when code
already has a model deeper in the document graph.

Sharing models between plots
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

All adapters accept a single Bokeh root, an array of roots, or a ``Document``.
Mount related roots through one adapter instance when they share a data source,
range, selection, or other Bokeh model. The array form creates one temporary
document containing every root, so normal Bokeh linking works:

.. code-block:: typescript

    import {ColumnDataSource, Plotting} from "@bokeh/bokehjs"
    import {Bokeh} from "@bokeh/react"

    const source = ColumnDataSource.create({
      data: {x: [1, 2, 3], y: [2, 5, 3], detail: [4, 3, 6]},
    })

    const overview = Plotting.figure()
    overview.line({field: "x"}, {field: "y"}, {source})

    const detail = Plotting.figure({x_range: overview.x_range})
    detail.scatter({field: "x"}, {field: "detail"}, {source})

    export function Dashboard() {
      return <Bokeh model={[overview, detail]} className="plots" />
    }

The adapter's host element contains each root view, so its CSS can use grid or
flexbox for responsive placement. Pass the same roots array with Vue's
``:model`` binding, Svelte's ``use:bokeh`` action, Angular's ``[model]``
binding, or the Web Component's ``model`` property.

Placing linked roots independently
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Roots in one Bokeh document do not have to be siblings in one grid. Framework
adapters provide a document owner and lightweight root slots, allowing normal
application content between plots. In React, wrap the nearest common component
ancestor with ``BokehDocument`` and put each ``BokehRoot`` wherever its plot
belongs:

.. code-block:: tsx

    import {BokehDocument, BokehRoot} from "@bokeh/react"

    export function Dashboard() {
      return <BokehDocument models={[overview, detail]}>
        <section className="summary"><BokehRoot model={overview} /></section>
        <ArticleContent />
        <aside className="detail"><BokehRoot model={detail} /></aside>
      </BokehDocument>
    }

Vue uses the same provider/root vocabulary:

.. code-block:: vue

    <script setup lang="ts">
    import {BokehDocument, BokehRoot} from "@bokeh/vue"
    </script>

    <template>
      <BokehDocument :models="[overview, detail]">
        <section><BokehRoot :model="overview" /></section>
        <ArticleContent />
        <aside><BokehRoot :model="detail" /></aside>
      </BokehDocument>
    </template>

Svelte and Angular express the same relationship with actions and a directive,
respectively:

.. code-block:: text

    <script lang="ts">
    import {bokehDocument, bokehRoot} from "@bokeh/svelte"
    </script>

    <main use:bokehDocument={{models: [overview, detail]}}>
      <section><div use:bokehRoot={{model: overview}}></div></section>
      <ArticleContent />
      <aside><div use:bokehRoot={{model: detail}}></div></aside>
    </main>

.. code-block:: typescript

    import {BokehDocumentComponent, BokehRootDirective} from "@bokeh/angular"

    @Component({
      imports: [BokehDocumentComponent, BokehRootDirective],
      template: `
        <bokeh-document [models]="[overview, detail]">
          <section [bokehRoot]="overview"></section>
          <article>Ordinary Angular content</article>
          <aside [bokehRoot]="detail"></aside>
        </bokeh-document>
      `,
    })
    export class Dashboard {}

The Web Component adapter supports nested roots or an explicit provider
reference when the elements have no common DOM parent:

.. code-block:: typescript

    import {
      BokehDocumentElement, BokehRootElement,
      defineBokehDocumentElement, defineBokehRootElement,
    } from "@bokeh/web-component"

    defineBokehDocumentElement()
    defineBokehRootElement()
    const provider = document.createElement("bokeh-document") as BokehDocumentElement
    provider.models = [overview, detail]
    document.body.append(provider)

    for (const [selector, model] of [["#summary", overview], ["#detail", detail]] as const) {
      const root = document.createElement("bokeh-root") as BokehRootElement
      root.model = model
      root.bokehDocument = provider
      document.querySelector(selector)!.append(root)
    }

Direct consumers name the roots and supply targets with the same logical keys:

.. code-block:: typescript

    import {MountSource, mount} from "@bokeh/bokehjs"

    const source = MountSource.from_roots({summary: overview, detail})
    const mounted = mount(source, {
      targets: {
        summary: document.querySelector("#summary")!,
        detail: document.querySelector("#detail")!,
      },
    })
    await mounted.ready

    // Selective changes preserve the sibling view and shared document.
    mounted.detach("detail")
    await mounted.attach("detail", document.querySelector("#new-detail")!)
    await mounted.replace_target("summary", document.querySelector("#new-summary")!)

Missing or ``null`` keyed targets leave those roots detached until
``attach()`` is called. ``detach()`` removes only that root's view;
``replace_target()`` moves an existing DOM view when possible. Disposing the
handle removes every remaining view without removing caller-owned target
elements or destroying a caller-owned document.

Do not mount roots that share Bokeh models through separate adapter instances.
Each mount owns a separate temporary document, and a Bokeh model can belong to
only one document. Use one multi-root mount, one document provider with root
slots, or compose the plots into a Bokeh layout such as a row, column, or grid.

Complete runnable projects for React with Vite or Next.js, Vue, Svelte,
Angular, Web Components, vanilla Vite/Webpack/Rspack, and Node.js server-side
rendering are in :bokeh-tree:`bokehjs/examples/frameworks`. They are kept
deliberately small for reuse in documentation and are continuously built from
packed npm artifacts in BokehJS CI.

``show()`` remains convenient for scripts and now returns the same owning
``BokehMount`` as ``mount()``. Await its ``ready`` promise and retain it for
disposal; it no longer returns a raw view. The old public
``Bokeh.embed.add_document_standalone()``, ``mount_document_standalone()``, and
``add_document_from_session()`` paths are internal rendering bridges. Direct
JavaScript code should use ``mount()`` or ``show()``; artifact and server hosts
receive an owning mount from their public bootstrap API.

Adapters remount when their model, target, or abort signal changes. Keep those
values stable across ordinary framework renders. Removing one root slot from a
document provider detaches only that view; the provider and its other root
slots keep the shared document alive. Every model supplied to one document
provider must have a unique model ID; duplicate IDs are rejected before the
provider changes its active mount. A single model can have only one owning
temporary document at a time, so dispose its current mount before moving it to
another host. Abort a pending or active mount with ``mountOptions.signal``. A
signal that is already aborted prevents mount creation entirely; aborting
during or after creation disposes the owned mount and its temporary document.
Adapter error callbacks and events report the same structured mount failures;
failed and superseded mounts clean up any views and temporary document they
created. Framework packages do not inject Bokeh resource scripts or implement
a second embed lifecycle.

Importing BokehJS and creating models is safe during server-side rendering, but
``mount()`` requires a browser DOM. Create or hydrate the adapter from the
framework's client lifecycle. The Node.js example in the framework-example
directory continuously verifies the DOM-free import path, while the Next.js
example verifies App Router prerendering and client hydration.

Applications that deserialize custom models can use an isolated registry:

.. code-block:: typescript

    import {
      Document, ModelResolver, register_models, register_standard_models,
    } from "@bokeh/bokehjs"

    MyCustomModel.__qualified__ = "MyCustomModel"
    const resolver = new ModelResolver(null)
    register_standard_models(resolver)
    register_models([MyCustomModel], resolver)
    const document = Document.from_json(json, {resolver})

This avoids relying on module import order or a process-wide registry. Set a
stable ``__qualified__`` name on custom models because production bundlers are
allowed to rename JavaScript classes.

Pass the same resolver to ``embed.embed_item(item, target, {resolver})`` when
embedding JSON directly. ``register_standard_models()`` covers the core model
set. If JSON can contain optional widgets or tables, import
``register_all_models`` from ``@bokeh/bokehjs/all`` and call it instead.


.. _ug_advanced_bokehjs_models:

Low-level models
----------------

Generally, the low-level models for plots and applications (such as guides,
glyphs, widgets) match the Bokeh Python models exactly. The |reference guide|
is therefore the primary reference for BokehJS models, even though it
focuses on Python.

Whereas the Python library is organized hierarchically, JavaScript models
are all in one flat ``Bokeh`` module. Typically any Python ``ClassName``
is available as ``Bokeh.ClassName`` in JavaScript. For a complete list
of JavaScript models, see :bokeh-tree:`bokehjs/src/lib/api/models.ts`.

When creating models in JavaScript, make a JavaScript object of all the
keyword arguments you'd pass to the Python object initializer. Here is an
example of how to initialize a `Range1d` model in both languages:

• Python

  .. code-block:: python

    xdr = Range1d(start=-0.5, end=20.5)

• JavaScript

  .. code-block:: javascript

    const xdr = Bokeh.Range1d.create({ start: -0.5, end: 20.5 });

Use the inherited ``create()`` factory for every BokehJS model. It completes
property initialization only after the most-derived JavaScript constructor has
finished, so custom model fields are available to defaults, ``initialize()``,
and ``connect_signals()``. Once you create a Bokeh model,
you can set its properties in exactly the same way in both languages. For
example, ``xdr.end = 30`` sets the ``end`` value to 30 on the `Range1d` model
above in both Python and JavaScript.

When migrating to Bokeh 4.0, replace ``new SomeModel(attributes)`` with
``SomeModel.create(attributes)``. Custom extensions inherit ``create()`` and do
not need to repeat a constructor or call a per-class initialization helper.

Below is an example that creates a plot with axes, grids, and a line glyph
from scratch. Compare with samples in :bokeh-tree:`examples/models` and
you'll see that the code in Python and JavaScript is nearly identical at
this level:

.. bokehjs-content::
    :title: Bokeh simple line
    :js_file: ../../../examples/advanced/bokehjs/simple_line.js

.. _ug_advanced_bokehjs_interfaces:

Interfaces
----------

Similar to the Python Bokeh library, BokehJS provides various higher-level
interfaces. These interfaces let you interact with and compose low-level
model objects. The higher-level interfaces comprise ``Bokeh.Plotting`` and
``Bokeh.Charts``.

.. note::
    Starting from version ``0.12.2`` these APIs make up the BokehJS API in
    the ``bokeh-api.js`` file. You'll have to import this file in addition
    to ``bokeh.js`` to enable these APIs.

.. _ug_advanced_bokehjs_interfaces_plotting:

``Bokeh.Plotting``
~~~~~~~~~~~~~~~~~~

The JavaScript ``Bokeh.Plotting`` API is a port of the Python
|bokeh.plotting| interface. Accordingly, the information in the
:ref:`ug_basic` section of the User guide can be a useful
reference in addition to the material provided here.

The JavaScript sample below is very similar to the Python code in
:bokeh-tree:`examples/basic/scatters/color_scatter.py`:

.. bokehjs-content::
    :title: Bokeh color scatter

    const plt = Bokeh.Plotting;

    // set up some data
    const M = 100;
    const xx = [];
    const yy = [];
    const colors = [];
    const radii = [];
    for (let y = 0; y <= M; y += 4) {
        for (let x = 0; x <= M; x += 4) {
            xx.push(x);
            yy.push(y);
            colors.push(plt.color([50+2*x, 30+2*y, 150]));
            radii.push(Math.random() * 1.5);
        }
    }
    // create a data source
    const source = Bokeh.ColumnDataSource.create({
        data: { x: xx, y: yy, radius: radii, colors: colors }
    });

    // make the plot and add some tools
    const tools = "pan,crosshair,wheel_zoom,box_zoom,reset,save";
    const p = plt.figure({ title: "Colorful Scatter", tools: tools });

    // call the circle glyph method to add some circle glyphs
    const circles = p.circle({ field: "x" }, { field: "y" }, {field: "radius"}, {
        source: source,
        fill_color: { field: "colors" },
        fill_alpha: 0.6,
        line_color: null,
    });

    // show the plot
    plt.show(p);

.. _ug_advanced_bokehjs_interfaces_charts:

``Bokeh.Charts``
~~~~~~~~~~~~~~~~

The JavaScript ``Bokeh.Charts`` API is a high-level charting interface that
is unique to BokehJS. The API supports two high-level charts: ``pie`` and ``bar``.

.. _ug_advanced_bokehjs_interfaces_charts_pie:

``Bokeh.Charts.pie``
''''''''''''''''''''

The following lets you create basic pie charts with ``Bokeh.Charts.pie``:

.. code-block:: javascript

    Bokeh.Charts.pie(data, { options })

Where ``data`` is a JavaScript object that has ``labels`` and
``values`` keys and ``options`` is an object that can include
any of the following optional keys:

:``width``: *number* --- chart width in pixels
:``height``: *number* --- chart height in pixels
:``inner_radius``: *number* --- inner radius for wedges in pixels
:``outer_radius``: *number* --- outer radius for wedges in pixels
:``start_angle``: *number* --- start angle for wedges in radians
:``end_angle``: *number* --- end angle for wedges in radians
:``center``: *[number, number]* --- ``(x, y)`` location of the pie center in pixels
:``palette``: *Palette | Array<Color>* --- a named palette or list of colors to color-map the values
:``slice_labels``: *"labels" | "values" | "percentages"* --- what the tooltip should show

By default, plots created with ``Bokeh.Charts.pie`` automatically add a tooltip
and hover policy. Here is an example of a ``pie`` chart and the plot it generates:

.. bokehjs-content::
    :title: Bokeh pie chart

    const plt = Bokeh.Plotting;

    const pie_data = {
        labels: ['Work', 'Eat', 'Commute', 'Sport', 'Watch TV', 'Sleep'],
        values: [8, 2, 2, 4, 0, 8],
    };

    const p1 = Bokeh.Charts.pie(pie_data);
    const p2 = Bokeh.Charts.pie(pie_data, {
        inner_radius: 0.2,
        start_angle: Math.PI / 2
    });
    const p3 = Bokeh.Charts.pie(pie_data, {
        inner_radius: 0.2,
        start_angle: Math.PI / 6,
        end_angle: 5 * Math.PI / 6
    });
    const p4 = Bokeh.Charts.pie(pie_data, {
        inner_radius: 0.2,
        palette: "Oranges9",
        slice_labels: "percentages"
    });

    // add the plot to a document and display it
    const doc = new Bokeh.Document();
    doc.add_root(plt.gridplot(
                     [[p1, p2], [p3, p4]],
                     {width: 250, height: 250}));
    const mounted = Bokeh.mount(doc, document.currentScript.parentElement);
    await mounted.ready;

.. _ug_advanced_bokehjs_interfaces_charts_bar:

``Bokeh.Charts.bar``
''''''''''''''''''''

The following lets you create basic bar charts with ``Bokeh.Charts.bar``:

.. code-block:: javascript

    Bokeh.Charts.bar(data, { options })

Where ``data`` is an array with entries representing rows of a data table.
The first row should contain the column headers. Here is an example of
some sales data from different regions for different years:

.. code-block:: javascript

    const data = [
        ['Region', 'Year', 'Sales'],
        ['East',   2015,    23000 ],
        ['East',   2016,    35000 ],
        ['West',   2015,    16000 ],
        ['West',   2016,    34000 ],
        ['North',  2016,    12000 ],
    ];

Similar to the ``pie`` chart, the ``options`` parameter is an object that
can include any of the following optional keys:

:``width``: *number* --- chart width in pixels
:``height``: *number* --- chart height in pixels
:``stacked``: *boolean* --- whether the bars should be stacked or not
:``orientation``: *"horizontal" | "vertical"* --- how the bars should be oriented
:``bar_width``: *number* --- width of each bar in pixels
:``palette``: *Palette | Array<Color>* --- a named palette or list of colors to color-map the values
:``axis_number_format``: *string* --- a format string to use for axis ticks

By default, plots created with ``Bokeh.Charts.bar`` automatically add a tooltip
and hover policy. Here is an example of a ``bar`` chart and the plot it generates:

.. bokehjs-content::
    :title: Bokeh bar chart

    const plt = Bokeh.Plotting;

    const bar_data = [
        ['City', '2010 Population', '2000 Population'],
        ['NYC', 8175000, 8008000],
        ['LA', 3792000, 3694000],
        ['Chicago', 2695000, 2896000],
        ['Houston', 2099000, 1953000],
        ['Philadelphia', 1526000, 1517000],
    ];

    const p1 = Bokeh.Charts.bar(bar_data, {
        axis_number_format: "0.[00]a"
    });
    const p2 = Bokeh.Charts.bar(bar_data, {
        axis_number_format: "0.[00]a",
        stacked: true
    });
    const p3 = Bokeh.Charts.bar(bar_data, {
        axis_number_format: "0.[00]a",
        orientation: "vertical"
    });
    const p4 = Bokeh.Charts.bar(bar_data, {
        axis_number_format: "0.[00]a",
        orientation: "vertical",
        stacked: true
    });

    plt.show(plt.gridplot([[p1, p2], [p3, p4]], {width: 350, height: 350}));


Minimal example
---------------

The following basic example shows how to import libraries and
create and modify plots.

.. bokehjs-content::
    :title: Minimal Example
    :include_html: true
    :disable_codepen: true

    // create a data source to hold data
    const source = Bokeh.ColumnDataSource.create({
        data: { x: [], y: [] }
    });

    // make a plot with some tools
    const plot = Bokeh.Plotting.figure({
        title: 'Example of random data',
        tools: "pan,wheel_zoom,box_zoom,reset,save",
        height: 300,
        width: 300
    });

    // add a line with data from the source
    plot.line({ field: "x" }, { field: "y" }, {
        source: source,
        line_width: 2
    });

    // show the plot and retain its lifecycle handle
    const mounted = Bokeh.Plotting.show(plot);
    await mounted.ready;

    function addPoint() {
        // add data --- all fields must be the same length.
        source.data.x.push(Math.random())
        source.data.y.push(Math.random())

        // update the data source with local changes
        source.change.emit()
    }

    const addDataButton = document.createElement("Button");
    addDataButton.appendChild(document.createTextNode("Some data."));
    document.currentScript.parentElement.appendChild(addDataButton);
    addDataButton.addEventListener("click", addPoint);

    addPoint();
    addPoint();

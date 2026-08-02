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

.. code-block:: typescript

    import {Bokeh} from "@bokeh/react"
    import type {Plot} from "@bokeh/bokehjs"

    function PlotView({model}: {model: Plot}) {
      return <Bokeh model={model} className="plot" />
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

.. code-block:: html

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

    import {mount} from "@bokeh/bokehjs"

    const mounted = await mount(plot, document.querySelector<HTMLElement>("#app")!)
    // Later, when your application removes the host element:
    function removePlot() {
      mounted.dispose()
    }

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

Do not mount roots that share Bokeh models through separate adapter instances.
Each mount owns a separate temporary document, and a Bokeh model can belong to
only one document. Use one multi-root mount or compose the plots into a Bokeh
layout such as a row, column, or grid.

Complete runnable projects for React, Vue, Svelte, Angular, Web Components,
vanilla Vite/Webpack/Rspack, and Node.js server-side rendering are in
:bokeh-tree:`bokehjs/examples/frameworks`. They are kept deliberately small
for reuse in documentation and are continuously built from packed npm
artifacts in BokehJS CI.

``show()`` remains convenient for scripts; component frameworks should prefer
``mount()`` because its lifetime is explicit.

Adapters remount only when the model, target, or mount-options object changes
identity. Keep those values stable across ordinary framework renders. A single
model can have only one owning temporary document at a time; dispose its current
mount before moving it to another host. Abort a pending or active mount with
``mountOptions.signal``. Adapter error callbacks and events report failures;
failed and superseded mounts clean up any views and temporary document they
created. A caller-supplied ``Document`` remains owned by the caller.

Importing BokehJS and creating models is safe during server-side rendering, but
``mount()`` requires a browser DOM. Create or hydrate the adapter from the
framework's client lifecycle. The Node.js example in the framework-example
directory continuously verifies the DOM-free import path.

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
    Bokeh.embed.add_document_standalone(doc, document.currentScript.parentElement);

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

    // show the plot, appending it to the end of the current section
    Bokeh.Plotting.show(plot);

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

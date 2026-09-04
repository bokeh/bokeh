.. _ug_output_embed:

Web pages
=========

This chapter explores a variety of ways to embed standalone Bokeh documents and
Bokeh applications into web pages. First, here's how standalone documents
differ from applications:

:ref:`ug_output_embed_standalone`
    These documents don't require a Bokeh server to work. They may have many
    tools and interactions such as custom JavaScript callbacks but are
    otherwise nothing but HTML, CSS, and JavaScript. These documents can be
    embedded into other HTML pages as one large document or as a set of
    sub-components with individual templating.

:ref:`ug_output_embed_apps`
    These applications require a Bokeh server to work. Having a Bokeh server
    lets you connect events and tools to real-time Python callbacks that
    execute on the server. For more information about creating and running
    Bokeh apps, see :ref:`ug_server`.

.. _ug_output_embed_standalone:

Standalone documents
--------------------

This section describes different ways to publish and embed standalone Bokeh
documents.

Embedding artifacts
~~~~~~~~~~~~~~~~~~~

Bokeh 4.0 uses one versioned embedding artifact for complete pages, template
fragments, JSON endpoints, external static payloads, and rich display. Compile
the artifact once and choose a delivery form independently:

.. code-block:: python

    from bokeh.embed import embed

    artifact = embed({"summary": summary_plot, "detail": detail_plot})
    page = artifact.page(resources="cdn", title="Report")
    fragment = artifact.fragment(resources="none")
    json_payload = artifact.to_json_string()
    external = artifact.external("/assets/report.json", resources="none")

Artifacts address roots by stable logical keys. Browser targets are supplied
when mounting and are not stored in reusable data:

.. code-block:: javascript

    const handle = Bokeh.mount(artifact, {
      targets: {summary: summaryElement, detail: detailElement},
      resources: "auto",
    })
    await handle.ready

    // Dispose from a framework unmount hook or when replacing the output.
    await handle.dispose()

The artifact declares what it requires. The page or host separately chooses
CDN, inline/offline, server, relative/absolute, or host-owned ``none`` resource
delivery. BokehJS resource loading is promise-based and deduplicates concurrent
and later additive requirements.

Embedding artifacts are executable content, not a safe interchange format for
untrusted input. ``CustomJS`` callbacks and extension assets may execute
JavaScript or load scripts and styles from declared URLs. Only mount artifacts
from trusted sources; hosts accepting external artifacts should validate or
allowlist extension resources and apply an appropriate resource policy.

Requirements and policy answer different questions:

.. list-table:: Artifact requirements versus host policy
   :header-rows: 1
   :widths: 20 34 46

   * - Layer
     - Meaning
     - Examples
   * - Requirements
     - Exact capabilities and extension assets needed by the compiled content.
     - ``bokeh/core``, ``bokeh/widgets``, ``bokeh/tables``, or a custom extension script.
   * - ``none`` policy
     - Emit no assets; the host promises that every declared requirement is already available.
     - Framework shells, managed portals, and notebook hosts.
   * - ``cdn`` or ``server`` policy
     - Resolve matching Bokeh bundles to network URLs.
     - Complete pages and server application hosts.
   * - ``inline`` policy
     - Embed resolved asset content in the output.
     - Self-contained HTML where inline content is allowed by CSP.
   * - ``offline`` policy
     - Require self-contained/local content and reject every external URL.
     - Disconnected reports and controlled archives.
   * - ``relative`` or ``absolute`` policy
     - Resolve installed assets against an explicit filesystem or URL base.
     - Static-site generators and application asset pipelines.

Public artifact v1 contract
~~~~~~~~~~~~~~~~~~~~~~~~~~~

The public ``bokeh.embed/v1`` envelope has one standalone document, unique
logical root keys, and non-negative document/root ordinals that refer into that
document. Server artifacts use model IDs instead of ordinals. Requirements and
extension names are unique, while metadata must contain JSON-compatible values;
the ``compiler`` metadata key is reserved for Bokeh. Python and BokehJS enforce
the same invariants when reading an artifact.

``fingerprint`` is a SHA-256 content identity over the canonical artifact data,
excluding the fingerprint field itself and normalizing allocation-specific
model IDs. It detects mismatched or stale payloads and provides a stable cache
or deduplication key. It is not a signature, an authentication mechanism, or a
substitute for subresource integrity.

Standalone v1 artifacts serialize their document data inline and do not carry
an artifact-level ``buffers`` field. Efficient binary transport remains
out-of-band where a live protocol exists: protocol messages, ASGI WebSocket
frames, and connected-notebook patches retain their separate binary buffers.

Renderer tour
~~~~~~~~~~~~~

The following review-sized example deliberately includes a plot, a widget, and
a table so the artifact declares four different BokehJS component bundles
(``bokeh/core``, ``bokeh/api``, ``bokeh/widgets``, and ``bokeh/tables``).
Each renderer serves a distinct host rather than recompiling the models:

.. code-block:: python

    from bokeh.embed import embed
    from bokeh.models import Button, ColumnDataSource, DataTable, TableColumn
    from bokeh.plotting import figure

    source = ColumnDataSource(data={"x": [1, 2, 3], "y": [3, 1, 2]})
    plot = figure(width=360, height=220, title="Artifact plot")
    plot.scatter("x", "y", source=source)
    button = Button(label="Artifact widget")
    table = DataTable(source=source, columns=[
        TableColumn(field="x", title="X"),
        TableColumn(field="y", title="Y"),
    ])

    artifact = embed({"plot": plot, "button": button, "table": table})

    # Complete document: Bokeh resolves and emits matching CDN resources.
    page_html = artifact.page(resources="cdn", title="Embedding renderer tour")

    # Host composition: place fragment.divs independently; the host owns assets.
    fragment = artifact.fragment(resources="none")

    # Data endpoint: return this with application/vnd.bokeh.embed+json.
    json_payload = artifact.to_json_string()

    # Static asset pipeline: store external.payload at this URL and insert external.html.
    external = artifact.external("/assets/renderer-tour.json", resources="none")

    # Rich display: notebooks request this automatically through the MIME protocol.
    mimebundle = artifact._repr_mimebundle_()

.. _ug_output_embed_standalone_html:

HTML files
~~~~~~~~~~

Bokeh can generate complete HTML pages for Bokeh documents using the
|file_html| function. This function can create an HTML document from its own
generic template or from a template you provide. These HTML files contain plot
data and are fully portable while still providing interactive tools
(pan, zoom, etc.) for your plot. Here is an example:

.. code-block:: python

    from bokeh.plotting import figure
    from bokeh.embed import embed

    plot = figure()
    plot.scatter([1,2], [3,4])

    html = embed(plot).page(resources="cdn", title="my plot")

You can save the returned HTML text to a file using standard Python file
operations. You can also provide your own template for the HTML output
and pass in custom, or additional, template variables. For more details,
see the |file_html| documentation.

The familiar |file_html| function remains as a thin facade over this artifact
page renderer. File-backed |save| and |show| routes therefore use the same
compiler and resource policy.

This is a low-level, explicit way to generate an HTML file, which can be
useful for web applications such as Flask apps.

In scripts and Jupyter notebooks employing the |bokeh.plotting| interface, you
can call the |output_file| function in conjunction with |show| or |save|
instead. The |show| function creates an HTML document and displays it in a
web browser whereas |save| creates an HTML document and saves it locally.

.. _ug_output_embed_json_items:

JSON items
~~~~~~~~~~

``json_item()`` and ``Bokeh.embed.embed_item()`` were removed in Bokeh 4.0.
Serve the versioned artifact itself; target selection belongs to the page that
mounts it:

.. code-block:: python

    @app.route('/plot')
    def plot():
        p = make_plot('petal_width', 'petal_length')
        return embed({"plot": p}).to_json_string(), 200, {
            "Content-Type": "application/vnd.bokeh.embed+json",
        }

.. code-block:: javascript

    const response = await fetch('/plot')
    const artifact = await response.json()
    const target = document.querySelector("#report [data-bokeh-root='plot']")
    const mounted = Bokeh.mount(artifact, {
      targets: {plot: target},
      resources: "none", // the host page already loaded matching BokehJS
    })
    await mounted.ready

For declarative output from ``artifact.fragment()`` or
``artifact.external()``, page JavaScript does not need the payload. Select a
stable logical-root target and acquire the handle published by the shared mount
lifecycle. This works whether the acquisition code runs before or after the
declaration bootstrap:

.. code-block:: javascript

    const target = document.querySelector("#report [data-bokeh-root='summary']")
    const controller = new AbortController()
    const mounted = await Bokeh.when_mounted(target, {signal: controller.signal})
    await mounted.ready

    const root = mounted.root("summary")
    const source = mounted.document.get_model_by_name("sales-source")
    const view = mounted.view_lookup.find_one(root)

    // Disposal owns views and artifact/session state, never the target element.
    await mounted.dispose()

.. _ug_output_embed_standalone_components:

Components
~~~~~~~~~~

In Bokeh 4.0, |components| is a thin facade over
``embed(models).fragment(resources="none")`` and retains only its canonical
``(script, divs)`` return shape. For composable output, use the typed fragment's
``script``, ``mounts``, ``divs``, ``requirements``, and ``resources`` fields.
The old wrapping flags were removed and raise a migration error. Generated
markup uses logical ``data-bokeh-root`` attributes and the shared artifact
bootstrap; it does not contain ``RenderItem`` data or generated DOM IDs.

You can also have Bokeh return individual components of a standalone document
to embed them one by one with the |components| function. This function returns
a ``<script>`` that contains the data for your plot and provides a target
``<div>`` to display the plot view. You can use these elements in HTML
documents however you like.

.. code-block:: python

    from bokeh.plotting import figure
    from bokeh.embed import components

    plot = figure()
    plot.scatter([1,2], [3,4])

    script, div = components(plot)

The target markup is declarative and stable by logical root key:

.. code-block:: html

    <div class="bk-embed-root"
         data-bokeh-artifact="ARTIFACT_FINGERPRINT"
         data-bokeh-root="root"></div>

Place the script and target markup anywhere in the same document. The shared
bootstrap waits for the DOM, calls ``Bokeh.mount()``, and publishes the owning
``BokehMount`` on the target for ``Bokeh.when_mounted()`` consumers.

Resource requirements and policy are separate. The artifact records required
components and extension assets; the renderer or host chooses how to satisfy
them:

.. code-block:: python

    artifact.fragment(resources="cdn")      # matching CDN assets
    artifact.fragment(resources="inline")   # self-contained assets
    artifact.fragment(resources="offline")  # rejects every external URL
    artifact.fragment(resources="none")     # host owns all resource loading

``resources="none"`` is not an assertion that the artifact needs no resources.
It is an explicit host-owned policy: the page must load a matching core/API
runtime and every component or extension listed by ``artifact.requires``.
Policy/version, CSP nonce, SRI, offline, and ``external_only`` conflicts fail
with actionable errors rather than silently producing incomplete markup. In
the browser, additive resources are loaded through one promise-based,
deduplicating loader shared by all artifact mounts.

Static JSON and model identity
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Static embedding does not use construction-time model IDs as addresses. The
explicit :meth:`~bokeh.document.document.Document.to_static_json` path omits an
ID when an object can be reconstructed from its position in the serialized
tree. It retains IDs only where sharing, a cycle, or an explicitly external
identity requires them. Canonical documents and live protocol patches remain
ID-full.

This compact diagnostic makes the difference visible without rendering an
artifact:

.. code-block:: python

    from bokeh.document import Document
    from bokeh.models import CustomJS

    shared = CustomJS(code="shared")
    first = CustomJS(code="first", args={"shared": shared})
    second = CustomJS(code="second", args={"shared": shared})
    document = Document()
    document.add_root(first)
    document.add_root(second)

    def ids(value):
        if isinstance(value, dict):
            return ([value["id"]] if value.get("type") == "object" and "id" in value else []) + [
                model_id for child in value.values() for model_id in ids(child)
            ]
        if isinstance(value, list):
            return [model_id for child in value for model_id in ids(child)]
        return []

    canonical = document.to_json(deferred=False)
    static = document.to_static_json(deferred=False)
    print("canonical IDs:", len(ids(canonical)))
    print("static IDs:", len(ids(static)), ids(static))

The two anonymous roots lose their IDs in ``static``; the shared callback keeps
one because both roots must reconstruct the same object. Supplying a model via
``models_with_ids`` can retain the identity of a model already in the document,
but cannot add an unrelated model to the serialized graph.

In addition to a single Bokeh model, such as a plot, the |components| function
can also accept a list or tuple of models or a dictionary of keys and models.
Each returns a tuple with one script and a corresponding data structure for the
target ``<div>`` elements.

The following illustrates how different input types correlate to outputs:

.. code-block:: python

    components(plot)
    #=> (script, plot_div)

    components((plot_1, plot_2))
    #=> (script, (plot_1_div, plot_2_div))

    components({"Plot 1": plot_1, "Plot 2": plot_2})
    #=> (script, {"Plot 1": plot_1_div, "Plot 2": plot_2_div})

For new code, prefer the typed result when you need more than the legacy tuple:

.. code-block:: python

    fragment = embed({"Red": red, "Blue": blue, "Green": green}).fragment(
        resources="none",
    )

    html = fragment.html
    script = fragment.script
    divs = fragment.divs
    requirements = fragment.requirements

.. _ug_output_embed_standalone_autoload:

External static payloads
~~~~~~~~~~~~~~~~~~~~~~~~

``autoload_static()`` and its per-embed JavaScript program were removed in
Bokeh 4.0. Save the deterministic artifact as data and render a declarative
external reference instead:

.. code-block:: python

    artifact = embed({"plot": plot})
    Path("static/plot.json").write_text(artifact.to_json_string())
    external = artifact.external(
        payload_url="/static/plot.json",
        resources="none",
    )

Insert ``external.html`` in the page. It contains logical-root targets plus one
shared bootstrap invocation; it never replaces a script tag or stores target
IDs in the payload. Use ``Bokeh.when_mounted()`` to acquire the published
handle as shown above.

.. _ug_output_embed_apps:

Bokeh applications
------------------

This section describes how to embed entire Bokeh server applications. You can
embed Bokeh apps so that every page load either creates and displays a new
session and document or outputs a specific, existing session.

App documents
~~~~~~~~~~~~~

Bokeh 4.0 represents a server application as a structured server-source
artifact. ``embed_server(url, ...).fragment()`` is the primary route;
|server_document| remains a thin facade. The browser obtains a signed bootstrap
from ``/embed.json`` and exposes HTTP, WebSocket, session, render, readiness, and
disposal through the same ``BokehMount`` used by standalone artifacts. The old
``/autoload.js`` program endpoint is not part of the 4.0 route.

Server artifact ``headers`` and a directly supplied ``token`` are serialized
into browser-visible page data. Do not put credentials or other secrets there
unless they are explicitly safe for every page consumer. Prefer the normal
``/embed.json`` bootstrap, which creates a short-lived signed session token,
over persisting a token in reusable markup.

If an application is running on a Bokeh server that makes it available at some
URL, you will typically want to embed the entire application in a web page.
This way, the page will create a new session and display it to the user every
time it loads.

You can achieve this with the |server_document| function. This function
accepts the URL to a Bokeh server application and returns a script that
embeds a new session from that server every time the script executes.

Here is an example of the |server_document| function in use:

.. code-block:: python

    from bokeh.embed import server_document
    script = server_document("https://demo.bokeh.org/sliders")

This returns declarative artifact markup: resource tags, a logical-root target,
the ``bokeh.embed/v1`` server descriptor, and the common artifact bootstrap.
Add that markup to an HTML page at the point where the application should
appear. It does not call or emulate the removed ``/autoload.js`` endpoint.

App sessions
~~~~~~~~~~~~

Sometimes, instead of loading a new session, you might wish to load a
*specific* one.

Take a Flask app that renders a page for an authenticated user. You might want
it to pull a new session, make some customizations for that specific user, and
serve this customized Bokeh server session.

You can accomplish this with the |server_session| function. This function
accepts a specific model to embed (or ``None`` for an entire session document),
session ID, and a URL to the Bokeh application.

Here is an example of how to use |server_session| with Flask:

.. code-block:: python

    from flask import Flask, render_template

    from bokeh.client import pull_session
    from bokeh.embed import server_session

    app = Flask(__name__)

    @app.route('/', methods=['GET'])
    def bkapp_page():

        # pull a new session from a running Bokeh server
        with pull_session(url="http://localhost:5006/sliders") as session:

            # update or customize that session
            session.document.roots[0].children[1].title.text = "Special sliders for a specific user!"

            # generate a script to load the customized session
            script = server_session(session_id=session.id, url='http://localhost:5006/sliders')

            # use the script in the rendered page
            return render_template("embed.html", script=script, template="Flask")

    if __name__ == '__main__':
        app.run(port=8080)

Standard template
-----------------

Bokeh also provides a standard Jinja template that helps you quickly and
flexibly embed different document roots by extending the "base" template. This
is especially useful when you need to embed individual components of a Bokeh
app in a non-Bokeh layout, such as Bootstrap.

Here's a minimal example for an application that creates two roots with name
properties set:

.. code-block:: python

    p1 = figure(..., name="scatter")

    p2 = figure(..., name="line")

    curdoc().add_root(p1)
    curdoc().add_root(p2)

You can then refer to these roots by their names and pass them to the ``embed``
macro to place them in any part of the template:

.. code-block:: html

    {% extends base %}

    <!-- goes in head -->
    {% block preamble %}
    <link href="app/static/css/custom.min.css" rel="stylesheet">
    {% endblock %}

    <!-- goes in body -->
    {% block contents %}
    <div> {{ embed(roots.scatter) }} </div>
    <div> {{ embed(roots.line) }} </div>
    {% endblock %}


Here's a full template with all the sections that you can override:

.. code-block:: html

    <!DOCTYPE html>
    <html lang="en">
    {% block head %}
    <head>
    {% block inner_head %}
        <meta charset="utf-8">
        <title>{% block title %}{{ title | e if title else "Bokeh Plot" }}{% endblock %}</title>
    {%  block preamble -%}{%- endblock %}
    {%  block resources -%}
    {%   block css_resources -%}
        {{- bokeh_css if bokeh_css }}
    {%-  endblock css_resources %}
    {%   block js_resources -%}
        {{  bokeh_js if bokeh_js }}
    {%-  endblock js_resources %}
    {%  endblock resources %}
    {%  block postamble %}{% endblock %}
    {% endblock inner_head %}
    </head>
    {% endblock head%}
    {% block body %}
    <body>
    {%  block inner_body %}
    {%    block contents %}
    {%      for doc in docs %}
    {{        embed(doc) if doc.elementid }}
    {%-       for root in doc.roots %}
    {%          block root scoped %}
    {{            embed(root) }}
    {%          endblock %}
    {%        endfor %}
    {%      endfor %}
    {%    endblock contents %}
    {{ plot_script | indent(4) }}
    {%  endblock inner_body %}
    </body>
    {% endblock body%}
    </html>


.. |file_html|       replace:: :func:`~bokeh.embed.file_html`
.. |json_item|       replace:: :func:`~bokeh.embed.json_item`
.. |server_document| replace:: :func:`~bokeh.embed.server_document`
.. |server_session|  replace:: :func:`~bokeh.embed.server_session`

.. _Subresource Integrity: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity

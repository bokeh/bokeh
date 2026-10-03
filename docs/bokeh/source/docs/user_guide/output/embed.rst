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

Embed results
~~~~~~~~~~~~~

Bokeh uses one versioned embed result for complete pages, template
fragments, JSON endpoints, external static payloads, and rich display. Build
the result once and choose a delivery form independently:

.. code-block:: python

    from bokeh.embed import embed
    from bokeh.resources import CDN

    result = embed({"summary": summary_plot, "detail": detail_plot})
    page = result.page(resources=CDN, title="Report")
    fragment = result.fragment(resources="none")
    json_payload = result.to_json_string()
    external = result.external("/assets/report.json", resources="none")

Embed results address roots by stable logical keys. Browser targets are supplied
when mounting and are not stored in reusable data:

.. code-block:: javascript

    const handle = Bokeh.mount(payload, {
      summary: summaryElement, detail: detailElement,
    }, {
      resources: "auto",
    })
    await handle.ready

    // Dispose from a framework unmount hook or when replacing the output.
    await handle.dispose()

The embed result declares what it requires. The page or host separately chooses
CDN, inline/offline, server, relative/absolute, or host-owned ``none`` resource
delivery. BokehJS resource loading is promise-based and deduplicates concurrent
and later additive requirements.

Embed payloads are executable content, not a safe interchange format for
untrusted input. ``CustomJS`` callbacks and extension assets may execute
JavaScript or load scripts and styles from declared URLs. Only mount embed payloads
from trusted sources. Hosts accepting external payloads should validate or
allowlist extension resources and apply an appropriate resource policy.

Requirements and policy answer different questions:

.. list-table:: Embed result requirements versus host policy
   :header-rows: 1
   :widths: 20 34 46

   * - Layer
     - Meaning
     - Examples
   * - Requirements
     - Exact capabilities and extension assets needed by the built result.
     - ``bokeh/core``, ``bokeh/widgets``, ``bokeh/tables``, or a custom extension script.
   * - ``none`` policy
     - Emit no assets. The host promises that every declared requirement is already available.
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

Public embed v1 contract
~~~~~~~~~~~~~~~~~~~~~~~~

The public ``bokeh.embed/v1`` payload has one standalone document, unique
logical root keys, and non-negative document/root ordinals that refer into that
document. Server payloads use model IDs instead of ordinals. Requirements and
extension names are unique, while metadata must contain JSON-compatible values.
The ``embedding`` metadata key is reserved for Bokeh. Python and BokehJS enforce
the structural invariants when reading a result.

``fingerprint`` is a SHA-256 content identity over the canonical embed payload,
excluding the fingerprint field itself and normalizing allocation-specific
model IDs. It provides a stable cache or deduplication key. Python verifies the
fingerprint when reconstructing an ``EmbedResult``. BokehJS treats it as opaque
producer metadata and checks that external declarations identify the payload
they load. It is not a signature, an authentication mechanism, or a substitute
for subresource integrity.

Standalone v1 embed results serialize their document data inline and do not carry
a payload-level ``buffers`` field. Efficient binary transport remains
out-of-band where a live protocol exists: protocol messages, ASGI WebSocket
frames, and connected-notebook patches retain their separate binary buffers.

Renderer tour
~~~~~~~~~~~~~

The following example includes a plot, a widget, and a table so the embed result
declares four different BokehJS component bundles
(``bokeh/core``, ``bokeh/api``, ``bokeh/widgets``, and ``bokeh/tables``).
Each renderer serves a distinct host rather than recompiling the models:

.. code-block:: python

    from IPython.display import display

    from bokeh.embed import embed
    from bokeh.models import Button, ColumnDataSource, DataTable, TableColumn
    from bokeh.plotting import figure
    from bokeh.resources import CDN

    source = ColumnDataSource(data={"x": [1, 2, 3], "y": [3, 1, 2]})
    plot = figure(width=360, height=220, title="Embed result plot")
    plot.scatter("x", "y", source=source)
    button = Button(label="Embed result widget")
    table = DataTable(source=source, columns=[
        TableColumn(field="x", title="X"),
        TableColumn(field="y", title="Y"),
    ])

    result = embed({"plot": plot, "button": button, "table": table})

    # Complete document: Bokeh resolves and emits matching CDN resources.
    page_html = result.page(resources=CDN, title="Embedding renderer tour")

    # Host composition places fragment.divs independently. The host owns assets.
    fragment = result.fragment(resources="none")

    # Data endpoint: return this with application/vnd.bokeh.embed+json.
    json_payload = result.to_json_string()

    # Store external.payload at this URL.
    # Insert the HTML string in external.html into the host page.
    external = result.external("/assets/renderer-tour.json", resources="none")

    # Rich display: notebooks request the MIME representation automatically.
    display(result)

.. _ug_output_embed_standalone_html:

HTML files
~~~~~~~~~~

Bokeh can generate complete HTML pages for Bokeh documents using an embed result's
``page()`` renderer. The renderer can use Bokeh's generic template or one you
provide. These HTML files contain plot data and are fully portable while still
providing interactive tools such as pan and zoom:

.. code-block:: python

    from bokeh.embed import embed
    from bokeh.plotting import figure
    from bokeh.resources import CDN

    plot = figure()
    plot.scatter([1,2], [3,4])

    html = embed(plot).page(resources=CDN, title="my plot")

You can save the returned HTML text to a file using standard Python file
operations. You can also provide your own template for the HTML output
and pass in custom, or additional, template variables. For more details, see
:meth:`~bokeh.embed.EmbedResult.page`.

.. deprecated:: 4.0
    The |file_html| compatibility facade remains available during the 4.x
    transition. Use ``embed(models).page(...)`` in new code.

File-backed |save| and |show| routes use the same embed result builder and resource
policy and remain supported.

This is a low-level, explicit way to generate an HTML file, which can be
useful for web applications such as Flask apps.

In scripts employing the |bokeh.plotting| interface, pass a ``filename``
directly to |show| or |save|. The |show| function creates an HTML document and
displays it in a web browser whereas |save| creates an HTML document and saves
it locally.

.. _ug_output_embed_json_items:

JSON payloads
~~~~~~~~~~~~~

Serve the versioned embed payload itself. Target selection belongs to the page that
mounts it:

.. code-block:: python

    from bokeh.embed import EMBED_MIME_TYPE, embed

    @app.route('/plot')
    def plot():
        p = make_plot('petal_width', 'petal_length')
        return embed({"plot": p}).to_json_string(), 200, {
            "Content-Type": EMBED_MIME_TYPE,
        }

.. code-block:: javascript

    const response = await fetch('/plot')
    const payload = await response.json()
    const target = document.querySelector("#report [data-bokeh-root='plot']")
    const mounted = Bokeh.mount(payload, {plot: target}, {
      resources: "none", // the host page already loaded matching BokehJS
    })
    await mounted.ready

Even with ``resources: "none"``, mounting verifies that the embed result's Bokeh
version exactly matches the loaded BokehJS version. A stale host runtime fails
with a version error instead of attempting to render mismatched content. Use a
versioned page or fragment resource policy when the generated output should
own and update its Bokeh assets.

For declarative output from ``result.fragment()`` or
``result.external()``, page JavaScript does not need the payload. Select a
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

    // Disposal owns views and embed/session state, never the target element.
    await mounted.dispose()

.. _ug_output_embed_standalone_components:

Fragments
~~~~~~~~~

Use ``result.fragment()`` to embed the roots of a standalone document in a
larger host page. Its typed result provides ``script``, ``mounts``, ``divs``,
``requirements``, and ``resources`` fields. Generated markup uses logical
``data-bokeh-root`` attributes and the shared embed bootstrap.

.. code-block:: python

    from bokeh.embed import embed
    from bokeh.plotting import figure

    plot = figure()
    plot.scatter([1,2], [3,4])

    fragment = embed(plot).fragment(resources="none")
    script = fragment.script
    div = fragment.divs["root"]

.. deprecated:: 4.0
    The |components| compatibility facade remains available during the 4.x
    transition and returns its canonical ``(script, divs)`` tuple. Use
    ``embed(models).fragment(...)`` in new code.

The target markup is declarative and stable by logical root key:

.. code-block:: html

    <div class="bk-embed-root"
         data-bokeh-embed="EMBED_FINGERPRINT"
         data-bokeh-embed-instance="DECLARATION_INSTANCE"
         data-bokeh-root="root"></div>

Place the script and target markup anywhere in the same document. The shared
bootstrap waits for the DOM, calls ``Bokeh.mount()``, and publishes the owning
``BokehMount`` on the target for ``Bokeh.when_mounted()`` consumers.

Resource requirements and policy are separate. The embed result records required
components and extension assets. The renderer or host chooses how to satisfy
them:

.. code-block:: python

    result.fragment(resources="cdn")      # matching CDN assets
    result.fragment(resources="inline")   # self-contained assets
    result.fragment(resources="offline")  # rejects every external URL
    result.fragment(resources="none")     # host owns all resource loading

``resources="none"`` is not an assertion that the embed result needs no resources.
It is an explicit host-owned policy: the page must load a matching core/API
runtime and every component or extension listed by ``result.requires``.
Policy/version, CSP nonce, SRI, offline, and ``external_only`` conflicts fail
with actionable errors rather than silently producing incomplete markup. The
browser's programmatic resource loader deduplicates additive requirements.
Python-rendered fragments emit ordinary resource tags, so exactly one host or
fragment on a page should own the resources. Render sibling fragments with
``resources="none"`` after the owner has loaded their combined requirements.

For a strict CSP that disallows inline scripts, store the embed payload externally
and select an external-only resource policy. This complete example writes the
payload separately and produces the HTML that the host page should insert.

.. code-block:: python

    from pathlib import Path

    from bokeh.embed import embed
    from bokeh.resources import CDN, Resources

    result = embed({"report": plot})
    external = result.external(
        "/assets/report.json",
        resources=Resources(mode=CDN, external_only=True),
    )
    Path("static/report.json").write_text(external.payload)
    print(external.html)

Serve ``static/report.json`` at ``/assets/report.json`` with the
``application/vnd.bokeh.embed+json`` media type and insert the HTML string from
``external.html`` in the host page. The CSP must allow the selected Bokeh
resource origin in ``script-src`` and the payload origin in ``connect-src``.
No inline JavaScript is emitted.

CDN, server, relative, and absolute resource modes automatically select
Bokeh's versioned ``bokeh-embed-bootstrap.min.js`` asset. A host that loads all
Bokeh assets itself can instead use ``Resources(mode="none",
external_only=True)`` and pass its external asset URL as ``bootstrap_url``.
Custom bootstrap URLs are rejected when ``integrity=True`` because Bokeh cannot
verify a caller-owned asset's hash.
The simpler ``resources="none"`` spelling uses the inline bootstrap and is not
suitable for a policy that disallows inline scripts.

The declarative payload loader uses the browser's default ``fetch()`` behavior
and does not add custom headers. A cross-origin payload must allow the host
origin with CORS. If a payload requires custom headers or cross-origin
credentials, fetch it in an allowed external application script and pass the
decoded embed payload to ``Bokeh.mount()`` with either one shared target or
targets addressed by logical root key.

Static JSON and model identity
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Static embedding does not use construction-time model IDs as addresses. The
explicit :meth:`~bokeh.document.document.Document.to_static_json` path omits an
ID when an object can be reconstructed from its position in the serialized
tree. It retains IDs only where sharing, a cycle, or an explicitly external
identity requires them. Canonical documents and live protocol patches remain
ID-full.

Compact model objects use ``$type``. Retained model identities use ``$id`` and
later uses use ``$ref``. Data specifications use direct literals when they are
unambiguous, ``$field`` for column references, ``$expr`` for expressions, and
``$value`` for explicit string values. ``ColumnDataSource.data`` always uses
the standard ``{"type": "map", "entries": [...]}`` representation so column
names cannot be confused with serialization metadata.

This compact diagnostic makes the difference visible without rendering an
embed result:

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
            is_compact_model = isinstance(value.get("$type"), str) and "$id" in value
            is_canonical_model = value.get("type") == "object" and "id" in value
            model_ids = (
                [value["$id"] if is_compact_model else value["id"]]
                if is_compact_model or is_canonical_model else []
            )
            return model_ids + [
                model_id for child in value.values() for model_id in ids(child)
            ]
        if isinstance(value, list):
            return [model_id for child in value for model_id in ids(child)]
        return []

    canonical = document.to_json(deferred=False)
    static = document.to_static_json(deferred=False)
    print("canonical IDs:", len(ids(canonical)))
    print("static IDs:", len(ids(static)), ids(static))

The two anonymous roots lose their IDs in ``static``. The shared callback keeps
one because both roots must reconstruct the same object. Supplying a model via
``models_with_ids`` can retain the identity of a model already in the document,
but cannot add an unrelated model to the serialized graph.

An embed result can accept a single Bokeh model, a list or tuple of models, or a
dictionary of logical keys and models. The fragment exposes its targets as a
keyed ``divs`` mapping:

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

To store plot data separately from the host HTML, save the deterministic embed
payload as data and render a declarative external reference:

.. code-block:: python

    result = embed({"plot": plot})
    Path("static/plot.json").write_text(result.to_json_string())
    external = result.external(
        payload_url="/static/plot.json",
        resources="none",
    )

Insert the HTML string from ``external.html`` in the page. That string contains
logical-root targets plus one shared bootstrap invocation. It never replaces a
script tag or stores target IDs in the payload. Use ``Bokeh.when_mounted()`` to
acquire the published handle as shown above. With an ``external_only`` resource
policy, the invocation uses Bokeh's standard external bootstrap asset and
contains no inline JavaScript.
See the strict-CSP recipe above for the complete deployment flow.

.. _ug_output_embed_apps:

Bokeh applications
------------------

This section describes how to embed entire Bokeh server applications. You can
embed Bokeh apps so that every page load either creates and displays a new
session and document or outputs a specific, existing session.

App documents
~~~~~~~~~~~~~

Bokeh represents a server application as a structured server-source
result. ``embed_server(url, ...).fragment()`` is the primary route. The
browser obtains a signed bootstrap
from ``/embed.json`` and exposes HTTP, WebSocket, session, render, readiness, and
disposal through the same ``BokehMount`` used by standalone embed results.

Server result ``headers`` and a directly supplied ``token`` are serialized
into browser-visible page data. Do not put credentials or other secrets there
unless they are explicitly safe for every page consumer. Prefer the normal
``/embed.json`` bootstrap, which creates a short-lived signed session token,
over persisting a token in reusable markup.

``headers`` and ``with_credentials=True`` may be used together when an
application requires both request headers and cookies. As with a directly
supplied token, header values are visible to page consumers.

If an application is running on a Bokeh server that makes it available at some
URL, you will typically want to embed the entire application in a web page.
This way, the page will create a new session and display it to the user every
time it loads.

Build the server embed result from the application URL, then render its fragment.
This creates a new session from that server every time the declaration mounts:

.. code-block:: python

    from bokeh.embed import embed_server

    result = embed_server("https://demo.bokeh.org/sliders")
    html = result.fragment(resources="server").html

.. deprecated:: 4.0
    The |server_document| compatibility facade remains available during the
    4.x transition. Use ``embed_server(url, ...).fragment(...).html`` in new
    code.

This returns declarative embed markup: resource tags, a logical-root target,
the ``bokeh.embed/v1`` server descriptor, and the common embed bootstrap.
Add that markup to an HTML page at the point where the application should
appear.

App sessions
~~~~~~~~~~~~

Sometimes, instead of loading a new session, you might wish to load a
*specific* one.

Take a Flask app that renders a page for an authenticated user. You might want
it to pull a new session, make some customizations for that specific user, and
serve this customized Bokeh server session.

Supply the existing session ID to ``embed_server()``. You can also provide a
mapping of logical root keys to specific session models.

Here is an example with Flask:

.. code-block:: python

    from flask import Flask, render_template

    from bokeh.client import pull_session
    from bokeh.embed import embed_server

    app = Flask(__name__)

    @app.route('/', methods=['GET'])
    def bkapp_page():

        # pull a new session from a running Bokeh server
        with pull_session(url="http://localhost:5006/sliders") as session:

            # update or customize that session
            session.document.roots[0].children[1].title.text = "Special sliders for a specific user!"

            # generate markup to load the customized session
            result = embed_server(
                "http://localhost:5006/sliders",
                session_id=session.id,
            )
            html = result.fragment(resources="server").html

            # use the markup in the rendered page
            return render_template("embed.html", script=html, template="Flask")

    if __name__ == '__main__':
        app.run(port=8080)

.. deprecated:: 4.0
    The |server_session| compatibility facade remains available during the 4.x
    transition. Use ``embed_server(session_id=...).fragment(...).html`` in new
    code.

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

    {% from macros import embed %}
    <!DOCTYPE html>
    <html lang="en">
    {% block head %}
    <head>
    {% block inner_head %}
        <meta charset="utf-8">
        <title>{% block title %}{{ title | e if title is not none else "Bokeh Plot" }}{% endblock %}</title>
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
    {%      if embed_mounts is defined %}
    {%        for root in embed_mounts %}
    {{          root.html }}
    {%        endfor %}
    {%      else %}
    {%      for doc in docs %}
    {{        embed(doc) if doc.elementid }}
    {%-       for root in doc.roots %}
    {%          block root scoped %}
    {{            embed(root) }}
    {%          endblock %}
    {%        endfor %}
    {%      endfor %}
    {%      endif %}
    {%    endblock contents %}
    {{ plot_script | indent(4) }}
    {%  endblock inner_body %}
    </body>
    {% endblock body%}
    </html>


.. |file_html|       replace:: :func:`~bokeh.embed.file_html`
.. |server_document| replace:: :func:`~bokeh.embed.server_document`
.. |server_session|  replace:: :func:`~bokeh.embed.server_session`

.. _Subresource Integrity: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity

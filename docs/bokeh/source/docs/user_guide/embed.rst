.. _userguide_embed:

Embedding Bokeh content
=======================

This chapter explores a variety of ways to embed standalone Bokeh documents and
Bokeh applications into web pages. First, here's how standalone documents
differ from applications:

:ref:`userguide_embed_standalone`
    These documents don't require a Bokeh server to work. They may have many
    tools and interactions such as custom JavaScript callbacks but are
    otherwise nothing but HTML, CSS, and JavaScript. These documents can be
    embedded into other HTML pages as one large document or as a set of
    sub-components with individual templating.

:ref:`userguide_embed_apps`
    These applications require a Bokeh server to work. Having a Bokeh server
    lets you connect events and tools to real-time Python callbacks that
    execute on the server. For more information about creating and running
    Bokeh apps, see :ref:`userguide_server`.

.. _userguide_embed_standalone:

Standalone documents
--------------------

This section describes different ways to publish and embed standalone Bokeh
documents.

.. _userguide_embed_standalone_html:

HTML files
~~~~~~~~~~

Bokeh can generate complete HTML pages for Bokeh documents using the
|file_html| function. This function can create an HTML document from its own
generic template or from a template you provide. These HTML files contain plot
data and are fully portable while still providing interactive tools
(pan, zoom, etc.) for your plot. Here is an example:

.. code-block:: python

    from bokeh.plotting import figure
    from bokeh.resources import CDN
    from bokeh.embed import file_html

    plot = figure()
    plot.circle([1,2], [3,4])

    html = file_html(plot, CDN, "my plot")

You can save the returned HTML text to a file using standard Python file
operations. You can also provide your own template for the HTML output
and pass in custom, or additional, template variables. For more details,
see the |file_html| documentation.

This is a low-level, explicit way to generate an HTML file, which can be
useful for web applications such as Flask apps.

In scripts and Jupyter notebooks employing the |bokeh.plotting| interface, you
can call the |output_file| function in conjunction with |show| or |save|
instead. The |show| function creates an HTML document and displays it in a
web browser whereas |save| creates an HTML document and saves it locally.

.. _userguide_embed_json_items:

JSON items
~~~~~~~~~~

Bokeh can also supply JSON data that BokehJS can use to render a standalone
Bokeh document in a specified ``<div>``. The |json_item| function accepts a
Bokeh model (for example, a plot) and an optional ID of the target ``<div>``.

.. code-block:: python

        p = figure()
        p.circle(x, y)

        item_text = json.dumps(json_item(p, "myplot"))

The :func:`~Bokeh.embed.embed_item` function can then use this output
on a web page:

.. code-block:: javascript

    item = JSON.parse(item_text);
    Bokeh.embed.embed_item(item);

This renders the plot in the ``<div>`` with the ID *"myplot"*.

You can also omit the target ID when calling |json_item|:

.. code-block:: python

        p = figure()
        p.circle(x, y)

        item_text = json.dumps(json_item(p)) # no target ID given

You can then specify the ID in JavaScript:

.. code-block:: javascript

    item = JSON.parse(item_text);
    Bokeh.embed.embed_item(item, "myplot");

Here's a more complete example of a Flask app serving Bokeh JSON items from a
*/plot* endpoint:

.. code-block:: python

    @app.route('/plot')
    def plot():
        p = make_plot('petal_width', 'petal_length')
        return json.dumps(json_item(p, "myplot"))

This produces JavaScript code that looks either like this:

.. code-block:: html

    <script>
    fetch('/plot')
        .then(function(response) { return response.json() })
        .then(function(item) { return Bokeh.embed.embed_item(item) })
    </script>

Or, with modern syntax, like this:

.. code-block:: html

    <script>
    const response = await fetch('/plot')
    const item = await response.json()
    Bokeh.embed.embed_item(item)
    </script>

For a complete example, see :bokeh-tree:`examples/embed/json_item.py`.

.. _userguide_embed_standalone_components:

Components
~~~~~~~~~~

You can also have Bokeh return individual components of a standalone document
to embed them one by one with the |components| function. This function returns
a ``<script>`` that contains the data for your plot and provides a target
``<div>`` to display the plot view. You can use these elements in HTML
documents however you like.

.. code-block:: python

    from bokeh.plotting import figure
    from bokeh.embed import components

    plot = figure()
    plot.circle([1,2], [3,4])

    script, div = components(plot)

The returned ``<script>`` will look something like this:

.. code-block:: html

    <script type="text/javascript">
        (function() {
      const fn = function() {
        Bokeh.safely(function() {
          const docs_json = { DOCUMENT DATA HERE };
          const render_items = [{
            "docid":"6833819f-9b5b-4904-821e-3f5eec77de9b",
            "elementid":"9574d123-9332-4b5f-96cc-6323bef37f40",
            "modelid":"7b328b27-9b14-4f7b-a5d8-0138bc7b0f59"
          }];

          Bokeh.embed.embed_items(docs_json, render_items);
        });
      };
      if (document.readyState != "loading") fn();
      else document.addEventListener("DOMContentLoaded", fn);
    })();

    </script>

Note that Jupyter notebooks do not allow for use of the |components| and |show|
functions in the same notebook cell.

The ``docs_json`` contains all the data as well as plot or widget objects
(omitted here for brevity). The resulting ``<div>`` looks something like
this:

.. code-block:: html

    <div id="9574d123-9332-4b5f-96cc-6323bef37f40"></div>

You can insert or template this script and its companion ``<div>`` in an HTML
document and, when the script executes, your plot replaces the ``<div>``.

For this to work you first need to load BokehJS, either locally or from a
content delivery network (CDN). To load BokehJS from a CDN, add the following
lines to your HTML text or template with the appropriate version replacing
the ``x.y.z``:

.. code-block:: html

    <script src="https://cdn.bokeh.org/bokeh/release/bokeh-x.y.z.min.js"
            crossorigin="anonymous"></script>
    <script src="https://cdn.bokeh.org/bokeh/release/bokeh-widgets-x.y.z.min.js"
            crossorigin="anonymous"></script>
    <script src="https://cdn.bokeh.org/bokeh/release/bokeh-tables-x.y.z.min.js"
            crossorigin="anonymous"></script>
    <script src="https://cdn.bokeh.org/bokeh/release/bokeh-gl-x.y.z.min.js"
            crossorigin="anonymous"></script>
    <script src="https://cdn.bokeh.org/bokeh/release/bokeh-mathjax-x.y.z.min.js"
            crossorigin="anonymous"></script>

The ``"-widgets"``, ``"-tables"``, and ``"-mathjax"`` files are only necessary
if your document includes :ref:`Bokeh widgets <userguide_interaction_widgets>`,
:ref:`data tables <userguide_interaction_widgets_examples_datatable>`, or
:ref:`math text <userguide_styling_math>`, respectively.

For example, to use version ``2.4.0`` with support for widgets, tables, and
math text, include the following in your HTML:

.. code-block:: html

    <script src="https://cdn.bokeh.org/bokeh/release/bokeh-2.4.0.min.js"
            crossorigin="anonymous"></script>
    <script src="https://cdn.bokeh.org/bokeh/release/bokeh-widgets-2.4.0.min.js"
            crossorigin="anonymous"></script>
    <script src="https://cdn.bokeh.org/bokeh/release/bokeh-tables-2.4.0.min.js"
            crossorigin="anonymous"></script>
    <script src="https://cdn.bokeh.org/bokeh/release/bokeh-gl-2.4.0.min.js"
            crossorigin="anonymous"></script>
    <script src="https://cdn.bokeh.org/bokeh/release/bokeh-mathjax-2.4.0.min.js"
            crossorigin="anonymous"></script>

.. note::
    Always provide the closing ``</script>`` tag. This is required by all
    browsers and the page will typically not render without it. You should also
    always include the ``crossorigin="anonymous"`` attribute on the script tag.

If you would like to include `Subresource Integrity`_ (SRI) hashes in your
explicit script tags by setting the ``integrity`` attribute, the necessary
hashes can be obtained by calling
:func:`~bokeh.resources.get_sri_hashes_for_version`. Here's an example:

.. code-block:: python

    In [1]: import bokeh.resources

    In [2]: bokeh.resources.get_sri_hashes_for_version("2.2.0")
    Out[2]:
    {'bokeh-2.2.0.js': 'TQAjsk2/lDn1NHjYoe8HIascd3/Cw4EWdk6GNtYXVVyAiUkbEZiuP7fEgbSwM37Y',

    ...

    'bokeh-widgets-2.2.0.min.js': '2ltAd1cQhavmLeBEZXGgnna8fjbw+FjvDq9m2dig4+8KVS8JcYFUQaALvLT//qHE'}

These are bare hashes, and you have to prefix them with `sha384-` to use. For
example:

.. code-block:: html

     <script src="https://cdn.bokeh.org/bokeh/release/bokeh-2.2.0.min.js"
             integrity="sha384-5Y+xuMRAbgBj/2WKUiL8yzV4fBFic1HJPo2hT3pq2IsEzbsJjj8kT2i0b1lZ7C2N"
             crossorigin="anonymous"></script>

You can produce SRI hashes only for full release versions, not for dev builds
or release candidates.

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

Here's an example of how you could use a multiple plot generator:

.. code-block:: python

    # scatter.py

    from bokeh.plotting import figure
    from bokeh.models import Range1d
    from bokeh.embed import components

    # create some data
    x1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    y1 = [0, 8, 2, 4, 6, 9, 5, 6, 25, 28, 4, 7]
    x2 = [2, 5, 7, 15, 18, 19, 25, 28, 9, 10, 4]
    y2 = [2, 4, 6, 9, 15, 18, 0, 8, 2, 25, 28]
    x3 = [0, 1, 0, 8, 2, 4, 6, 9, 7, 8, 9]
    y3 = [0, 8, 4, 6, 9, 15, 18, 19, 19, 25, 28]

    # select the tools you want
    TOOLS="pan,wheel_zoom,box_zoom,reset,save"

    # the red and blue graphs share this data range
    xr1 = Range1d(start=0, end=30)
    yr1 = Range1d(start=0, end=30)

    # only the green graph uses this data range
    xr2 = Range1d(start=0, end=30)
    yr2 = Range1d(start=0, end=30)

    # build the figures
    p1 = figure(x_range=xr1, y_range=yr1, tools=TOOLS, width=300, height=300)
    p1.scatter(x1, y1, size=12, color="red", alpha=0.5)

    p2 = figure(x_range=xr1, y_range=yr1, tools=TOOLS, width=300, height=300)
    p2.scatter(x2, y2, size=12, color="blue", alpha=0.5)

    p3 = figure(x_range=xr2, y_range=yr2, tools=TOOLS, width=300, height=300)
    p3.scatter(x3, y3, size=12, color="green", alpha=0.5)

    # plots can be a single Bokeh model, a list/tuple, or even a dictionary
    plots = {'Red': p1, 'Blue': p2, 'Green': p3}

    script, div = components(plots)
    print(script)
    print(div)

Running ``python scatter.py`` prints out the following:

.. code-block:: shell

    <script type="text/javascript">
        const docs_json = { DOCUMENT DATA HERE }
        const render_items = [{
          "docid":"33961aa6-fd96-4055-886f-b2afec7ff193",
          "elementid":"e89297cf-a2dc-4edd-8993-e16f0ca6af04",
          "modelid":"4eff3fdb-80f4-4b4c-a592-f99911e14398"
        },{
          "docid":"33961aa6-fd96-4055-886f-b2afec7ff193",
          "elementid":"eeb9a417-02a1-47e3-ab82-221abe8a1644",
          "modelid":"0e5ccbaf-62af-42cc-98de-7c597d83747a"
        },{
          "docid":"33961aa6-fd96-4055-886f-b2afec7ff193",
          "elementid":"c311f123-368f-43ba-88b6-4e3ecd9aed94",
          "modelid":"57f18497-9598-4c70-a251-6072baf223ff"
        }];

        Bokeh.embed.embed_items(docs_json, render_items);
    </script>

        {
            'Green': '\n<div id="e89297cf-a2dc-4edd-8993-e16f0ca6af04"></div>',
            'Blue': '\n<div id="eeb9a417-02a1-47e3-ab82-221abe8a1644"></div>',
            'Red': '\n<div id="c311f123-368f-43ba-88b6-4e3ecd9aed94"></div>'
        }

You can then insert the resulting script and ``<div>`` elements into a
boilerplate such as the following:

.. code-block:: html

    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="utf-8">
            <title>Bokeh Scatter Plots</title>

            <script src="https://cdn.bokeh.org/bokeh/release/bokeh-2.2.0.min.js"></script>

            <!-- COPY/PASTE SCRIPT HERE -->

        </head>
        <body>
            <!-- INSERT DIVS HERE -->
        </body>
    </html>

Note that this doesn't include JavaScript and CSS files for ``"-widgets"``
because the document doesn't use any Bokeh widgets.

You can see an example of multiple plot generation by executing the following:

.. code:: bash

    python /bokeh/examples/embed/embed_multiple.py

.. _userguide_embed_standalone_autoload:

Autoloading scripts
~~~~~~~~~~~~~~~~~~~

You can also embed standalone documents with the |autoload_static| function.
This function provides a ``<script>`` tag that replaces itself with a Bokeh
plot. This script also checks for BokehJS and loads it if necessary. This
function lets you embed a plot with nothing but this ``<script>`` tag.

This function takes a Bokeh model, such as a plot, that you want to display, a
``Resources`` object, and a path to load a script from. Then |autoload_static|
returns a self-contained ``<script>`` tag and a block of JavaScript code. The
JavaScript code saves to the path you provide and the ``<script>`` loads and
runs it to display your plot on a web page.

Here is how you might use |autoload_static| with a simple plot:

.. code-block:: python

    from bokeh.resources import CDN
    from bokeh.plotting import figure
    from bokeh.embed import autoload_static

    plot = figure()
    plot.circle([1,2], [3,4])

    js, tag = autoload_static(plot, CDN, "some/path")

The resulting ``<script>`` tag looks like this:

.. code-block:: html

    <script
        src="some/path"
        id="c5339dfd-a354-4e09-bba4-466f58a574f1"
        async="true"
        data-bokeh-modelid="7b226555-8e16-4c29-ba2a-df2d308588dc"
        data-bokeh-loglevel="info"
    ></script>

Include this tag anywhere you want your plot to display on an HTML page.

Save the JavaScript code to a file at `"some/path"` on the server where the
document containing the plot can reach it.

.. note::
    The ``<script>`` tag replaces itself with a ``<div>``, so it must be placed
    within the ``<body>`` of the document.

.. _userguide_embed_apps:

Bokeh applications
------------------

This section describes how to embed entire Bokeh server applications. You can
embed Bokeh apps so that every page load either creates and displays a new
session and document or outputs a specific, existing session.

App documents
~~~~~~~~~~~~~

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

This returns a ``<script>`` tag that looks something like this:

.. code-block:: html

    <script
        src="https://demo.bokeh.org/sliders/autoload.js?bokeh-autoload-element=1000&bokeh-app-path=/sliders&bokeh-absolute-url=https://demo.bokeh.org/sliders"
        id="1000">
    </script>

You can add this tag to an HTML page to include the Bokeh application at that
point.

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


.. |autoload_static| replace:: :func:`~bokeh.embed.autoload_static`
.. |file_html|       replace:: :func:`~bokeh.embed.file_html`
.. |json_item|       replace:: :func:`~bokeh.embed.json_item`
.. |server_document| replace:: :func:`~bokeh.embed.server_document`
.. |server_session|  replace:: :func:`~bokeh.embed.server_session`

.. _Subresource Integrity: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity

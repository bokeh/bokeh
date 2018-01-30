.. _userguide_embed:

Embedding Plots and Apps
========================

Bokeh provides a variety of ways to embed plots and data into HTML documents.
First, a reminder of the distinction between standalone documents and apps:

:ref:`userguide_embed_standalone`
    These are Bokeh documents that are not backed by a Bokeh server. They
    may have many tools and interactions (e.g. from ``CustomJS`` callbacks)
    but are self-containtain HTML, JavaScript, and CSS. They can be
    embedded into other HTML pages as one large document, or as a set of
    sub-components templated individually.

:ref:`userguide_embed_apps`
    These are Bokeh documents that are backed by a Bokeh Server. In addition
    to all the features of standalone documents, it is also possible to connect
    events and tools to real Python callbacks, to execute that execute in the
    Bokeh server. See :ref:`userguide_server` for more information about
    creating and running Bokeh apps.

.. _userguide_embed_standalone:

Standalone Documents
--------------------

This section describes how Bokeh standalone documents (i.e. those that are *not*
linked to a Bokeh server) may be published or embedded in a variety of ways.

.. _userguide_embed_standalone_html:

HTML files
~~~~~~~~~~

Bokeh can generate complete HTML pages for Bokeh documents using the
|file_html| function. This function can emit HTML from its own generic
template, or a template you provide. These files contain the data for the
plot inline and are completely transportable, while still providing
interactive tools (pan, zoom, etc.) for your plot. Here is an example:

.. code-block:: python

    from bokeh.plotting import figure
    from bokeh.resources import CDN
    from bokeh.embed import file_html

    plot = figure()
    plot.circle([1,2], [3,4])

    html = file_html(plot, CDN, "my plot")

The returned HTML text can be saved to a file using standard python file
operations. You can also provide your own template and pass in custom, or
additional, template variables. See the |file_html| documentation for more
details.

This is a fairly low-level, explicit way to generate an HTML file, which
may be useful for use from a web application, e.g. a Flask app. When using
the |bokeh.plotting| interface in a script or Jupyter notebook, users will
typically call the function |output_file| in conjunction with |show| or
|save| instead.

.. _userguide_embed_standalone_components:

Components
~~~~~~~~~~

It is also possible to ask Bokeh to return the individual components of a
stnadalone document for a idiidual  embedding using the |components| function.
This function returns a ``<script>`` that contains the data for your plot,
together with an accompanying ``<div>`` tag that the plot view is loaded into.
These tags can be used in HTML documents however you like:

.. code-block:: python

    from bokeh.plotting import figure
    from bokeh.embed import components

    plot = figure()
    plot.circle([1,2], [3,4])

    script, div = components(plot)

The returned ``<script>`` will look something like:

.. code-block:: html

    <script type="text/javascript">
        (function() {
      var fn = function() {
        Bokeh.safely(function() {
          var docs_json = { DOCUMENT DATA HERE };
          var render_items = [{
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

Note that in Jupyter Notebooks, it is not possible to use components and show in
the same notebook cell.

All of the data and plot or widget objects are contained in the ``docs_json``
variable (contents omitted here for brevity). The resulting ``<div>`` will
look something like:

.. code-block:: html

    <div class="bk-root">
        <div class="bk-plotdiv" id="9574d123-9332-4b5f-96cc-6323bef37f40"></div>
    </div>

These two elements can be inserted or templated into your HTML text, and the
script, when executed, will replace the div with the plot.

Using these components assumes that BokehJS has already been loaded, for
instance either inline in the document text, or from CDN. To load BokehJS
from CDN, add the following lines in your HTML text or template with the
appropriate version replacing ``x.y.z``:

.. code-block:: html

    <link
        href="https://cdn.pydata.org/bokeh/release/bokeh-x.y.z.min.css"
        rel="stylesheet" type="text/css">
    <link
        href="httsp://cdn.pydata.org/bokeh/release/bokeh-widgets-x.y.z.min.css"
        rel="stylesheet" type="text/css">
    <link
        href="https://cdn.pydata.org/bokeh/release/bokeh-tables-x.y.z.min.css"
        rel="stylesheet" type="text/css">

    <script src="https://cdn.pydata.org/bokeh/release/bokeh-x.y.z.min.js"></script>
    <script src="https://cdn.pydata.org/bokeh/release/bokeh-widgets-x.y.z.min.js"></script>
    <script src="https://cdn.pydata.org/bokeh/release/bokeh-tables-x.y.z.min.js"></script>

The ``"-widgets"`` files are only necessary if your document includes Bokeh widgets.
Similarly, the ``"-tables"`` files are only necessary if you are using Bokeh data tables in
your document.

For example, to use version ``0.12.13``, including widgets and tables support:

.. code-block:: html

    <link
        href="https://cdn.pydata.org/bokeh/release/bokeh-0.12.13.min.css"
        rel="stylesheet" type="text/css">
    <link
        href="https://cdn.pydata.org/bokeh/release/bokeh-widgets-0.12.13.min.css"
        rel="stylesheet" type="text/css">
    <link
        href="https://cdn.pydata.org/bokeh/release/bokeh-tables-0.12.13.min.css"
        rel="stylesheet" type="text/css">

    <script src="https://cdn.pydata.org/bokeh/release/bokeh-0.12.13.min.js"></script>
    <script src="https://cdn.pydata.org/bokeh/release/bokeh-widgets-0.12.13.min.js"></script>
    <script src="https://cdn.pydata.org/bokeh/release/bokeh-tables-0.12.13.min.js"></script>

.. note::
    You must provide the closing `</script>` tag. This is required by all
    browsers and the page will typically not render without it.

In addition to a single Bokeh model (e.g. a plot), the |components| function
also accepts a list or tuple of models, or a dictionary of keys and models.
Each returns a tuple with one script script and a corresponding data structure
for the divs.

The following illustrates how different input types correlate to outputs:

.. code-block:: python

    components(plot)
    #=> (script, plot_div)

    components((plot_1, plot_2))
    #=> (script, (plot_1_div, plot_2_div))

    components({"Plot 1": plot_1, "Plot 2": plot_2})
    #=> (script, {"Plot 1": plot_1_div, "Plot 2": plot_2_div})

Here's an example of how you would use the multiple plot generator:

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

    # select the tools we want
    TOOLS="pan,wheel_zoom,box_zoom,reset,save"

    # the red and blue graphs will share this data range
    xr1 = Range1d(start=0, end=30)
    yr1 = Range1d(start=0, end=30)

    # only the green will use this data range
    xr2 = Range1d(start=0, end=30)
    yr2 = Range1d(start=0, end=30)

    # build our figures
    p1 = figure(x_range=xr1, y_range=yr1, tools=TOOLS, plot_width=300, plot_height=300)
    p1.scatter(x1, y1, size=12, color="red", alpha=0.5)

    p2 = figure(x_range=xr1, y_range=yr1, tools=TOOLS, plot_width=300, plot_height=300)
    p2.scatter(x2, y2, size=12, color="blue", alpha=0.5)

    p3 = figure(x_range=xr2, y_range=yr2, tools=TOOLS, plot_width=300, plot_height=300)
    p3.scatter(x3, y3, size=12, color="green", alpha=0.5)

    # plots can be a single Bokeh Model, a list/tuple, or even a dictionary
    plots = {'Red': p1, 'Blue': p2, 'Green': p3}

    script, div = components(plots)
    print(script)
    print(div)

Running ``python scatter.py`` will print out:

.. code-block:: shell

    script type="text/javascript">
        var docs_json = { DOCUMENT DATA HERE }
        var render_items = [{
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
            'Green': '\n<div class="bk-root">\n    <div class="bk-plotdiv" id="e89297cf-a2dc-4edd-8993-e16f0ca6af04"></div>\n</div>',
            'Blue': '\n<div class="bk-root">\n    <div class="bk-plotdiv" id="eeb9a417-02a1-47e3-ab82-221abe8a1644"></div>\n</div>',
            'Red': '\n<div class="bk-root">\n    <div class="bk-plotdiv" id="c311f123-368f-43ba-88b6-4e3ecd9aed94"></div>\n</div>'
        }

Then inserting the script and div elements into this boilerplate:

.. code-block:: html

    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="utf-8">
            <title>Bokeh Scatter Plots</title>

            <link rel="stylesheet" href="http://cdn.pydata.org/bokeh/release/bokeh-0.12.6.min.css" type="text/css" />
            <script type="text/javascript" src="http://cdn.pydata.org/bokeh/release/bokeh-0.12.6.min.js"></script>

            <!-- COPY/PASTE SCRIPT HERE -->

        </head>
        <body>
            <!-- INSERT DIVS HERE -->
        </body>
    </html>

Note that above we have not included the ``"-widgets"`` JS and CSS files, since the
document does not use Bokeh widgets. If required, the CDN resources are available as HTTPS
URLs as well.

You can see an example by running:

.. code:: bash

    python /bokeh/examples/embed/embed_multiple.py

.. _userguide_embed_standalone_autoload:

Autoload Scripts
~~~~~~~~~~~~~~~~

A final way to embed standalone documents is the |autoload_static| function.
This function with provide a  ``<script>`` tag that will replace itself with
a Bokeh plot, wherever the tag happens to be located. The script will also check f
or BokehJS and load it, if necessary. Using this function it is possible to
embed a plot by placing this script tag alone in your document.

This function takes a Bokeh model (e.g. a plot) that you want to display, a
``Resources`` object, and a path to load a script from. Then |autoload_static|
will return a self-contained ``<script>`` tag, and a block of JavaScript code.
The JavaScript code should be saved to the path you provided. The ``<script>``
tag, when it is included in a page, will load and run the saved JavaScript in
order to realize your plot in the browser.

Here is how you might use |autoload_static| with a simple plot:

.. code-block:: python

    from bokeh.resources import CDN
    from bokeh.plotting import figure
    from bokeh.embed import autoload_static

    plot = figure()
    plot.circle([1,2], [3,4])

    js, tag = autoload_static(plot, CDN, "some/path")

The resulting ``<script>`` tag looks like:

.. code-block:: html

    <script
        src="some/path"
        id="c5339dfd-a354-4e09-bba4-466f58a574f1"
        async="true"
        data-bokeh-data="static"
        data-bokeh-modelid="7b226555-8e16-4c29-ba2a-df2d308588dc"
        data-bokeh-modeltype="Plot"
        data-bokeh-loglevel="info"
    ></script>

The script tag should be included in the HTML page wherever you wish to load
the plot.

The separate JavaScript code should be saved to a file that can be reached
on the server at `"some/path"`, from the document that has the plot embedded.

.. note::
    The ``<script>`` tag loads a ``<div>`` in place, so it must be placed
    under ``<head>``.

.. _userguide_embed_apps:

Bokeh Applications
------------------

This section describes how Bokeh server applications may be embedded. Bokeh
apps may be embeeded so that every page load creates and displays a new
session and Document, or so that a specific, existing session is loaded.

App Documents
~~~~~~~~~~~~~

When an application is running on a Bokeh server and available at some URL,
it is typically desired to embed the entire application in a page so that
whenever the page is loaded, a completely new session is created and
presented to the the user. This can be accomplished with the |server_document|
function, which accepts the URL to a Bokeh server application, and returns
a script that will embed new sessions from that server any time the script
is executed.

Here is an example snipped using |server_document|:

.. code-block:: python

    from bokeh.embed import server_document
    script = server_document("https://demo.bokehplots.com/apps/slider")

The returned script tag will look something like this:

.. code-block:: html

    <script
        src="https://demo.bokehplots.com/apps/slider/autoload.js?bokeh-autoload-element=d8713a1a-d714-43be-a1c5-48a7a9dece3f&bokeh-app-path=/apps/slider&bokeh-absolute-url=https://demo.bokehplots.com/apps/slider"
        id="d8713a1a-d714-43be-a1c5-48a7a9dece3f"
        data-bokeh-model-id=""
        data-bokeh-doc-id=""
    ></script>

It can be templated in an HTML page to include the Bokeh application at
that point.

App Sessions
~~~~~~~~~~~~

Sometimes, instead of loading a new session, we might wish to load a
*specific* session. For instance, a Flask app rendering a page for an
authenticated user might want to pull a new session, make some
customizations for the specific user, then serve the specific Bokeh
server session. This can be accomplished with the |server_session|
function which accepts a specific model to embed (or ``None`` for an
entire session document), session ID, and a URL to the Bokeh appllication.

Here is a complete example using |server_session| and Flask:

.. code-block:: python

    from flask import Flask, render_template

    from bokeh.client import pull_session
    from bokeh.embed import server_session

    app = Flask(__name__)

    @app.route('/', methods=['GET'])
    def bkapp_page():

        # pull a new session from a running Bokeh server
        session = pull_session(url="http://localhost:5006/sliders")

        # update or customize that session
        session.document.roots[0].children[1].title.text = "Special Sliders For A Specific User!"

        # generate a script to load the customized session
        script = server_session(None, session.id, url='http://localhost:5006/sliders')
        return render_template("embed.html", script=script, template="Flask")

    if __name__ == '__main__':
        app.run(port=8080)

.. |bokeh.models|   replace:: :ref:`bokeh.models <bokeh.models>`
.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`

.. |output_file|     replace:: :func:`~bokeh.io.output_file`
.. |output_notebook| replace:: :func:`~bokeh.io.output_notebook`
.. |save|            replace:: :func:`~bokeh.io.save`
.. |show|            replace:: :func:`~bokeh.io.show`

.. |autoload_static| replace:: :func:`~bokeh.embed.autoload_static`
.. |components|      replace:: :func:`~bokeh.embed.components`
.. |file_html|       replace:: :func:`~bokeh.embed.file_html`
.. |server_document| replace:: :func:`~bokeh.embed.server_document`
.. |server_session|  replace:: :func:`~bokeh.embed.server_session`

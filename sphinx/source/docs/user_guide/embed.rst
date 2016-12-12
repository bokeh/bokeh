.. _userguide_embed:

Embedding Plots and Apps
========================

Bokeh provides a variety of ways to embed plots and data into HTML documents.

.. _userguide_embed_html:

Standalone HTML
---------------

Bokeh can generate standalone HTML documents using the |file_html|
function. This function can emit HTML from its own generic template,
or a template you provide. These files contain the data for the plot inline
and are completely transportable, while still providing interactive tools
(pan, zoom, etc.) for your plot. Here is an example:

.. code-block:: python

    from bokeh.plotting import figure
    from bokeh.resources import CDN
    from bokeh.embed import file_html

    plot = figure()
    plot.circle([1,2], [3,4])

    html = file_html(plot, CDN, "my plot")

The returned HTML text can be saved to a file using standard python file
operations.

.. note::
    This is a fairly low-level, explicit way to generate an HTML file.
    When using the |bokeh.plotting| or |bokeh.charts| interfaces, users will
    typically call the function |output_file| in conjunction with |show| or
    |save| instead.

You can also provide your own template and pass in custom, or additional, template variables.
See the |file_html| function for more details. You can see an example of this
in the `gapminder example plot`_.

.. _gapminder example plot: https://github.com/bokeh/bokeh/blob/master/examples/howto/interactive_bubble/gapminder.py

.. _userguide_embed_components:

Components
----------

It is also possible to ask Bokeh to return the individual components for a
inline embedding using the |components| function. This function returns a
``<script>`` that contains the data for your plot, together with an
accompanying ``<div>`` tag that the plot view is loaded into. These tags
can be used in HTML documents however you like:

.. code-block:: python

    from bokeh.plotting import figure
    from bokeh.embed import components

    plot = figure()
    plot.circle([1,2], [3,4])

    script, div = components(plot)

The returned ``<script>`` will look something like:

.. code-block:: html

    <script type="text/javascript">
        $(function() {
            var modelid = "fba97329-a355-499e-9252-0adc64b19d2e";
            var modeltype = "Plot";
            var elementid = "8ed68feb-d258-4953-9dfb-fb1c13326509";
            Bokeh.logger.info("Realizing plot:")
            Bokeh.logger.info(" - modeltype: Plot");
            Bokeh.logger.info(" - modelid: fba97329-a355-499e-9252-0adc64b19d2e");
            Bokeh.logger.info(" - elementid: 8ed68feb-d258-4953-9dfb-fb1c13326509");

            var all_models = [ JSON PLOT MODELS AND DATA ARE HERE ];

            Bokeh.load_models(all_models);
            var model = Bokeh.Collections(modeltype).get(modelid);
            var view = new model.default_view({
                model: model, el: '#8ed68feb-d258-4953-9dfb-fb1c13326509'
            });
            Bokeh.index[modelid] = view
        });
    </script>

All of the data and plot objects are contained in the ``all_models`` variable
(contents omitted here for brevity). The resulting ``<div>`` will look
something like:

.. code-block:: html

    <div class="plotdiv" id="8ed68feb-d258-4953-9dfb-fb1c13326509"></div>

These two elements can be inserted or templated into your HTML text, and the
script, when executed, will replace the div with the plot.

Using these components assumes that BokehJS has already been loaded, for
instance either inline in the document text, or from CDN. To load BokehJS
from CDN, add the following lines in your HTML text or template with the
appropriate version replacing ``x.y.z``:

.. code-block:: html

    <link
        href="http://cdn.pydata.org/bokeh/release/bokeh-x.y.z.min.css"
        rel="stylesheet" type="text/css">
    <link
        href="http://cdn.pydata.org/bokeh/release/bokeh-widgets-x.y.z.min.css"
        rel="stylesheet" type="text/css">

    <script src="http://cdn.pydata.org/bokeh/release/bokeh-x.y.z.min.js"></script>
    <script src="http://cdn.pydata.org/bokeh/release/bokeh-widgets-x.y.z.min.js"></script>

The ``"-widgets"`` files are only necessary if your document includes Bokeh widgets.

For example, to use version ``0.12.0``, including widgets support:

.. code-block:: html

    <link
        href="http://cdn.pydata.org/bokeh/release/bokeh-0.12.0.min.css"
        rel="stylesheet" type="text/css">
    <link
        href="http://cdn.pydata.org/bokeh/release/bokeh-widgets-0.12.0.min.css"
        rel="stylesheet" type="text/css">

    <script src="http://cdn.pydata.org/bokeh/release/bokeh-0.12.0.min.js"></script>
    <script src="http://cdn.pydata.org/bokeh/release/bokeh-widgets-0.12.0.min.js"></script>

.. note::
    You must provide the closing `</script>` tag. This is required by all
    browsers and the page will typically not render without it.

When embedding in a page served via HTTPS, any scripts and resources must also
be loaded via HTTPS or the browser will refuse to load due to an "unsafe" script.
For this situation, the Bokeh CDN resources are also available via HTTPS, by
replacing "http" with "https" in the above URLs.

The |components| function takes either a single Bokeh Model a list/tuple of
Models, or a dictionary of keys and Models. Each returns a corresponding
data structure of script and div pairs.

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
        var render_items = [
          {"docid":"33961aa6-fd96-4055-886f-b2afec7ff193",
           "elementid":"e89297cf-a2dc-4edd-8993-e16f0ca6af04",
           "modelid":"4eff3fdb-80f4-4b4c-a592-f99911e14398"},
          {"docid":"33961aa6-fd96-4055-886f-b2afec7ff193",
           "elementid":"eeb9a417-02a1-47e3-ab82-221abe8a1644",
           "modelid":"0e5ccbaf-62af-42cc-98de-7c597d83747a"},
          {"docid":"33961aa6-fd96-4055-886f-b2afec7ff193",
           "elementid":"c311f123-368f-43ba-88b6-4e3ecd9aed94",
           "modelid":"57f18497-9598-4c70-a251-6072baf223ff"}
        ];

        Bokeh.embed.embed_items(docs_json, render_items);
    </script>

        {'Green': '\n<div class="bk-root">\n    <div class="plotdiv" id="e89297cf-a2dc-4edd-8993-e16f0ca6af04"></div>\n</div>', 'Blue': '\n<div class="bk-root">\n    <div class="plotdiv" id="eeb9a417-02a1-47e3-ab82-221abe8a1644"></div>\n</div>', 'Red': '\n<div class="bk-root">\n    <div class="plotdiv" id="c311f123-368f-43ba-88b6-4e3ecd9aed94"></div>\n</div>'}

Then inserting the script and div elements into this boilerplate:

.. code-block:: html

    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="utf-8">
            <title>Bokeh Scatter Plots</title>

            <link rel="stylesheet" href="http://cdn.pydata.org/bokeh/release/bokeh-0.12.0.min.css" type="text/css" />
            <script type="text/javascript" src="http://cdn.pydata.org/bokeh/release/bokeh-0.12.0.min.js"></script>

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

.. _userguide_embed_notebook:

IPython Notebook
----------------

Bokeh can also generate ``<div>`` tags suitable for inline display in the
IPython notebook using the |notebook_div| function:

.. code-block:: python

    from bokeh.plotting import figure
    from bokeh.embed import notebook_div

    plot = figure()
    plot.circle([1,2], [3,4])

    div = notebook_div(plot)

The returned div contains the same sort of ``<script>`` and ``<div>`` that
the |components| function above returns.

.. note::
    This is a fairly low-level, explicit way to generate an IPython
    notebook div. When using the |bokeh.plotting| or |bokeh.charts|
    interfaces, users will typically call the function |output_notebook|
    in conjunction with |show| instead.

.. _userguide_embed_autoloading:

Autoloading
-----------

Finally it is possible to ask Bokeh to return a ``<script>`` tag that will
replace itself with a Bokeh plot, wherever happens to be located. The script
will also check for BokehJS and load it, if necessary, so it is possible to
embed a plot by placing this script tag alone in your document.

There are two cases:

.. _userguide_embed_autoload_server:

server data
~~~~~~~~~~~

The simplest case is to use the Bokeh server to persist your plot and data.
Additionally, the Bokeh server affords the opportunity of animated plots or
updating plots with streaming data. The |autoload_server| function returns a
``<script>`` tag that will load both your plot and data from the Bokeh server.

If you are already an app on a bokeh server and have the url for
it then you may want to use |autoload_server| by passing the ``url`` for
the server, as well as the ``app_path`` for the application on the server.
As a concrete example, you could embed the sliders app from the demo site
with a command like:

.. code-block:: python

    script = autoload_server(model=None,
                             app_path="/apps/slider",
                             url="https://demo.bokehplots.com")

The resulting ``<script>`` tag that you can use to embed the plot inside
your HTML document looks like:

.. code-block:: html

    <script
        src="https://demo.bokehplots.com/apps/slider/autoload.js?bokeh-autoload-element=c5c9bdb5-40e8-46a2-9bf0-40a9d396ce97"
        id="c5c9bdb5-40e8-46a2-9bf0-40a9d396ce97"
        data-bokeh-model-id=""
        data-bokeh-doc-id=""
    ></script>

.. note::
    When using ``autoload_server`` the brower document title will not be set.

It's also possible to use ``autoload_server`` to generate scripts to load
apps that were created using ``bokeh.client`` and ``push_session``. Here is some code using |autoload_server| with a default session:

.. code-block:: python

    from bokeh.client import push_session
    from bokeh.embed import autoload_server
    from bokeh.plotting import figure, curdoc

    # figure() function auto-adds the figure to curdoc()
    plot = figure()
    plot.circle([1,2], [3,4])

    session = push_session(curdoc())
    script = autoload_server(plot, session_id=session.id)

.. note::
    To execute the code above, a Bokeh server must already be running.

The resulting ``<script>`` tag for this use case has more information, and
will look something like this:

.. code-block:: html

    <script
    src="http://localhost:5006/autoload.js?bokeh-autoload-element=82ae93bf-79c2-4028-af7e-1cf6b1a0ea1a&bokeh-session-id=qjPGXLj7UWx7G9LDkwEq48fMOcxQfepxW7HUYPCQNrmN"
    id="82ae93bf-79c2-4028-af7e-1cf6b1a0ea1a"
    data-bokeh-model-id="b08c02c4-f93c-461c-bb23-514b54dfec83"
    data-bokeh-doc-id=""
    ></script>

For full details read the autoload_server reference here: |autoload_server|.

.. _userguide_embed_autoload_static:

static data
~~~~~~~~~~~

If you do not need or want to use the Bokeh server, then the you can use the
|autoload_static| function. This function takes the plot object you want to
display together with a resources specification and path to load a script
from. It will return a self-contained ``<script>`` tag, together with some
JavaScript code that contains the data for your plot. This code should be
saved to the script path you provided. The ``<script>`` tag will load this
separate script to realize your plot.

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


The resulting JavaScript code should be saved to a file that can be reached
on the server at `"some/path"`, from the document that has the plot embedded.

.. note::
    In both cases the ``<script>`` tag loads a ``<div>`` in place, so it must
    be placed under ``<head>``.

.. |bokeh.charts|   replace:: :ref:`bokeh.charts <bokeh.charts>`
.. |bokeh.models|   replace:: :ref:`bokeh.models <bokeh.models>`
.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`

.. |output_file|     replace:: :func:`~bokeh.io.output_file`
.. |output_notebook| replace:: :func:`~bokeh.io.output_notebook`
.. |save|            replace:: :func:`~bokeh.io.save`
.. |show|            replace:: :func:`~bokeh.io.show`

.. |autoload_server| replace:: :func:`~bokeh.embed.autoload_server`
.. |autoload_static| replace:: :func:`~bokeh.embed.autoload_static`
.. |components|      replace:: :func:`~bokeh.embed.components`
.. |file_html|       replace:: :func:`~bokeh.embed.file_html`
.. |notebook_div|    replace:: :func:`~bokeh.embed.notebook_div`

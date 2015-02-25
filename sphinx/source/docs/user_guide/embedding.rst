.. _user_guide_embedding:

Embedding
=========

.. contents::
    :local:
    :depth: 2

Bokeh provides a variety of ways to embed plots and data into HTML documents.

.. _user_guide_embedding_html:

Standalone HTML
---------------

Bokeh can generate standalone HTML documents using the :func:`bokeh.embed.file_html`
function. This function can emit HTML from its own generic template,
or a template you provide. These files contain the data for the plot inline
and are completely transportable, while still providing interactive tools
(pan, zoom, etc.) for your plot. Here is an example::

    from bokeh.plotting import circle
    from bokeh.resources import CDN
    from bokeh.embed import file_html

    plot = circle([1,2], [3,4])

    html = file_html(plot, CDN, "my plot")

The returned HTML text can be saved to a file using standard python file
operations.

.. note::
    This is a fairly low-level, explicit way to generate an HTML file.
    When using the :ref:`userguide_plotting` interface, typically users
    will use the function :func:`~bokeh.plotting.output_file` in conjuction with
    :func:`~bokeh.plotting.show` or :func:`~bokeh.plotting.save`.

.. _user_guide_embedding_components:

Components
----------

It is also possible to ask Bokeh to return the individual components for a
inline embedding using the :func:`bokeh.embed.components` function. This
function returns a ``<script>`` that contains the data for your plot,
together with an accompanying ``<div>`` tag that the plot view is loaded
into. These tags can be used in HTML documents however you like::

    from bokeh.plotting import figure
    from bokeh.resources import CDN
    from bokeh.embed import components

    plot = figure()
    plot.circle([1,2], [3,4])

    script, div = components(plot, CDN)

The returned ``<script>`` will look something like::

    <script type="text/javascript">
        $(function() {
            var modelid = "fba97329-a355-499e-9252-0adc64b19d2e";
            var modeltype = "Plot";
            var elementid = "8ed68feb-d258-4953-9dfb-fb1c13326509";
            Bokeh.logger.info("Realizing plot:")
            Bokeh.logger.info(" - modeltype: Plot");
            Bokeh.logger.info(" - modelid: fba97329-a355-499e-9252-0adc64b19d2e");
            Bokeh.logger.info(" - elementid: 8ed68feb-d258-4953-9dfb-fb1c13326509");

            var all_models = [ JSON PLOT MODELS AND DATA GO HERE ];

            Bokeh.load_models(all_models);
            var model = Bokeh.Collections(modeltype).get(modelid);
            var view = new model.default_view({
                model: model, el: '#8ed68feb-d258-4953-9dfb-fb1c13326509'
            });
            Bokeh.index[modelid] = view
        });
    </script>

All of the data and plot objects are contained in the ``all_models`` variable
(contents omitted here for brevity). The resulting ``<div>`` will look something
like::

    <div class="plotdiv" id="8ed68feb-d258-4953-9dfb-fb1c13326509"></div>

These two elements can be inserted or templated into your HTML text, and the
script, when executed, will replace the div with the plot.

.. note::
    Using these components assumes that BokehJS has already been loaded, for
    instance either inline in the document text, or from CDN.

.. _user_guide_embedding_notebook:

IPython Notebook
----------------

Bokeh can also generate ``<div>`` tags suitable for inline display in the
IPython notebook using the :func:`bokeh.embed.notebook_div` function::

    from bokeh.plotting import figure
    from bokeh.embed import notebook_div

    plot = figure()
    plot.circle([1,2], [3,4])

    div = notebook_div(plot)

The returned div contains the same sort of ``<script>`` and ``<div>`` that
the :func:`~bokeh.embed.components` function above returns.

.. note::
    This is a fairly low-level, explicit way to generate an IPython
    notebook div. When using the :ref:`userguide_plotting` interface,
    typically users will use the function :func:`~bokeh.plotting.output_notebook`
    in conjuction with :func:`~bokeh.plotting.show` and the ``%bokeh`` IPython
    "magic" command.

.. _user_guide_embedding_autoload:

Autoloading
-----------

Finally it is possible to ask Bokeh to return a ``<script>`` tag that will
replace itself with a Bokeh plot, wherever happens to be located. The script
will also check for BokehJS and load it, if necessary, so it is possible to
embed a plot by placing this script tag alone in your document.

There are two cases:

.. _user_guide_embedding_autoload_server:

server data
~~~~~~~~~~~

The simplest case is to use the Bokeh server to persist your plot and data.
Additionally, the Bokeh server affords the opportunity of animated plots or
updating plots with streaming data. The :func:`bokeh.embed.autoload_server`
function accepts a plot object and a Bokeh server ``Session`` object. It
returns a ``<script>`` tag that will load both your plot and data from the
Bokeh server.

As a concrete example, here is some simple code using :func:`~bokeh.embed.autoload_server`
with a default session::

    from bokeh.plotting import figure
    from bokeh.embed import autoload_server
    from bokeh.session import Session
    from bokeh.document import Document

    # alternative to these lines, plotting.output_server(...)
    document = Document()
    session = Session()
    session.use_doc('population_reveal')
    session.load_document(document)

    plot = figure()
    plot.circle([1,2], [3,4])

    script = autoload_server(plot, session)

The resulting ``<script>`` tag that you can use to embed the plot inside
a document looks like::

    <script
        src="http://localhost:5006/bokeh/autoload.js/f64f7959-017d-4d1b-924e-899a61fed42b"
        id="f64f7959-017d-4d1b-924e-899a61fed42b"
        async="true"
        data-bokeh-data="server"
        data-bokeh-modelid="82ef36f7-9d58-47c8-9b0d-201947febb00"
        data-bokeh-root-url="http://localhost:5006/"
        data-bokeh-docid="2b4c75a2-8311-4b4d-b014-370b430d6469"
        data-bokeh-docapikey="8c4e34e5-04f9-4c1c-b92f-fb1ec0d52cae"
        data-bokeh-loglevel="info"
    ></script>

.. _user_guide_embedding_autoload_static:

static data
~~~~~~~~~~~

If you do not need or want to use the Bokeh server, then the you can use the
:func:`bokeh.embed.autoload_static` function. This function takes the plot object
you want to display together with a resources specification and path to load a script
from. It will return a self-contained ``<script>`` tag, together with some
JavaScript code that contains the data for your plot. This code should be
saved to the script path you provided. The ``<script>`` tag will load this
separate script to realize your plot.

Here is how you might use :func:`~bokeh.embed.autoload_static` with a simple plot::

    from bokeh.resources import CDN
    from bokeh.plotting import figure
    from bokeh.embed import autoload_static

    plot = figure()
    plot.circle([1,2], [3,4])

    js, tag = autoload_static(plot, CDN, "some/path")

The resulting ``<script>`` tag looks like::

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



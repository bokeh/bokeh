.. _user_guide_embedding:

Embedding
=========

.. contents::
    :local:
    :depth: 2


Embedding
---------

Bokeh provides a variety of ways to embed plots and data into HTML documents.


Standalone HTML
'''''''''''''''

Bokeh can generate standalone HTML documents, from its own generic template,
or a template you provide. These files contain the data for the plot inline
and are completely transportable, while still providing interactive tools
(pan, zoom, etc.) for your plot.

Components
''''''''''

It is also possible to ask Bokeh to return the individual components for a
inline embedding: a ``<script>`` that contains the data for your plot,
together with an accompanying ``<div>`` tag that the plot view is loaded
into. These tags can be used in HTML documents however you like.

.. note:: using these components assums that BokehJS has been loaded already.

IPython Notebook
''''''''''''''''

Bokeh can also generate ``<div>`` tags suitable for inline display in the
IPython notebook using the ``notebook_div`` function.

.. note:: Typically users will probably use the higher-level function
          ``plotting.output_notebook()`` in conjuction with ``%bokeh``
          magic in the IPython notebook.

Autoload ``<script>``
'''''''''''''''''''''

Finally it is possible to ask Bokeh to return a ``<script>`` tag that will
replace itself with a Bokeh plot, wherever happens to be located. The script
will also check for BokehJS and load it, if necessary, so it is possible to
embed a plot by placing this script tag alone in your document.

There are two cases:

server data
***********

The simplest case is to use the Bokeh server to persist your plot and data.
Additionally, the Bokeh server affords the opportunity of animated plots or
updating plots with streaming data. The :func:`bokeh.embed.autoload_server` function accepts
a plot object and a Bokeh server ``Session`` object. It returns a ``<script>``
tag that will load both your plot and data from the Bokeh server.

As a concrete example, here is some simple code using :func:`bokeh.embed.autoload_server`
with the ``plotting.py`` interface::

    from bokeh.plotting import circle, cursession, output_server
    from bokeh.embed import autoload_server
    output_server("mydoc")
    plot = circle([1,2], [3,4])
    script = autoload_server(plot, cursession())

The resulting ``<script>`` tag that you can use to embed the plot inside
a document looks like::

    <script
        src="http://localhost:5006/bokeh/autoload.js/7b6e5722-b7e1-4b9e-b8d9-84e1059f7dea"
        id="7b6e5722-b7e1-4b9e-b8d9-84e1059f7dea"
        async="true"
        data-bokeh-data="server"
        data-bokeh-modelid="da023ae3-b88b-45b5-8fc1-f45c53f09fa2"
        data-bokeh-modeltype="Plot"
        data-bokeh-root-url="http://localhost:5006/"
        data-bokeh-docid="db499b59-c06e-4415-a482-af9802512ede"
        data-bokeh-docapikey="45959c87-3120-4ce5-a1ec-ca0720023951"
        data-bokeh-conn-string="ws://localhost:5006/bokeh/sub"
    ></script>

static data
***********

If you do not need or want to use the Bokeh server, then the you can use the
:func:`bokeh.embed.autoload_static` function. This function takes the plot object you want
to display together with a resources specification and path to load a script
from. It will return a self-contained ``<script>`` tag, together with some
JavaScript code that contains the data for your plot. This code should be
saved to the script path you provided. The ``<script>`` tag will load this
separate script to realize your plot.

Here is how you might use :func:`bokeh.embed.autoload_static` with a simple plot::

    from bokeh.resources import CDN
    from bokeh.plotting import circle, output_server
    from bokeh.embed import autoload_static
    from bokeh.resources import CDN
    output_server("mydoc")
    plot = circle([1,2], [3,4])
    js, tag = autoload_static(plot, CDN, "some/path")

The resulting ``<script>`` tag looks like::

    <script
        src="some/path"
        id="f1a5ad43-8d26-4199-8916-6405fe53b143"
        async="true"
        data-bokeh-data="static"
        data-bokeh-modelid="5dd89f11-1f06-4408-a6be-281933ee3e0c"
        data-bokeh-modeltype="Plot"
    ></script>

The resulting JavaScript code should be saved to a file that can be reached
on the server at `"some/path"`, from the document that has the plot embedded.

.. note:: In both cases the ``<script>`` tag loads a ``<div>`` in place, so
          it must be placed under ``<head>``.



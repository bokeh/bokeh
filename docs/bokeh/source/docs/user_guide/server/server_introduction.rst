.. _ug_server_introduction:

Server introduction
===================

Purpose
-------

.. note::
    To make this guide easier to follow, consider familiarizing
    yourself with some of the core concepts of Bokeh in the section
    :ref:`ug_intro`.

Bokeh server makes it easy to create interactive web applications that connect
front-end UI events to running Python code.

Bokeh creates high-level Python models, such as plots, ranges, axes, and
glyphs, and then converts these objects to JSON to pass them to its client
library, BokehJS. For more information on the latter, see
:ref:`contributor_guide_bokehjs`.

This flexible and decoupled design offers some advantages. For instance, it is
easy to have other languages, such as R or Scala, drive Bokeh plots and
visualizations in the browser.

However, keeping these models in sync between the Python environment and the
browser would provide further powerful capabilities:

* respond to UI and tool events in the browser with computations or queries
  using the full power of Python
* automatically push server-side updates to the UI elements such as widgets or
  plots in the browser
* use periodic, timeout, and asynchronous callbacks to drive streaming updates

This is where the Bokeh server comes into play:

**The primary purpose of the Bokeh server is to synchronize data between the
underlying Python environment and the BokehJS library running in the browser.**

----

Here's a simple example from `<https://demo.bokeh.org>`_ that illustrates this
behavior:

.. raw:: html

    <div>
    <iframe
        src="https://demo.bokeh.org/sliders"
        frameborder="0"
        style="overflow:hidden;height:400px;width: 90%;

        -moz-transform-origin: top left;
        -webkit-transform-origin: top left;
        -o-transform-origin: top left;
        -ms-transform-origin: top left;
        transform-origin: top left;"
        height="460"
    ></iframe>
    </div>

Manipulating the UI controls communicates new values to the backend via Bokeh
server. This also triggers callbacks that update the plots with the input in
real time.

Use case scenarios
------------------

Consider a few different scenarios when you might want to use the Bokeh server.

Local or individual use
~~~~~~~~~~~~~~~~~~~~~~~

You might want to use the Bokeh server for exploratory data analysis, possibly
in a Jupyter notebook, or for a small app that you and your colleagues can run
locally.

The Bokeh server is very convenient here, allowing for quick and simple
deployment through effective use of Bokeh server applications. For more
detail, see :ref:`ug_server_apps`.

Creating deployable applications
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You might also want to use the Bokeh server to publish interactive data
visualizations and applications to a wider audience, say, on the internet
or an internal company network. The Bokeh server also suits this usage well,
but you might want to first consult the following:

* For information on how to create Bokeh applications, see
  :ref:`ug_server_apps`.
* For information on how to deploy a server with your application, see
  :ref:`ug_server_deploy`.

Shared publishing
~~~~~~~~~~~~~~~~~

Both of the scenarios above involve *one person* making applications on the
server, either for personal use or for consumption by a larger audience.

While it is possible for *several people* to publish different applications
to the same server, **this does not make for a good use case** because hosted
applications can execute arbitrary Python code. This raises process isolation
and security concerns and makes this kind of shared tenancy prohibitive.

One way to support this kind of multi-application environment with multiple
users is to build up infrastructure that can run a Bokeh server for each app or
at least for each user. The Bokeh project or a third party might create a
public service for this kind of usage in the future but such developments are
beyond the scope this documentation.

Another possibility is to have one app that can access data and other artifacts
published by many different people, possibly with access controls. This sort of
scenario *is* possible with the Bokeh server, but often involves integrating it
with other web application frameworks.

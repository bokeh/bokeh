.. _first_steps_9:

First steps 9: Bokeh Server app
================================

In the :ref:`previous first steps guides <first_steps_8>`, you used different
sources and structures to import and filter data.

In this section, you will use Bokeh as a server to create a visualization with
more elements interactivity than in the previous, static examples.

Running Bokeh as a server
-------------------------

Bokeh includes a standalone server component. Use this command on a command
line to start Bokeh in server mode:

.. code-block:: sh

    bokeh serve

You can use Bokeh Server to build complex dashboards and interactive
applications. Some of the capabilities of the Bokeh server include:

* UI widgets and plot selections that drive computations and plot updates
* Streaming live data to automatically updating plots
* Intelligent server-side downsampling of large datasets
* Sophisticated glyph re-writing and transformations for “Big Data”
* Plot and dashboard publishing for wider audiences

This is an example of a simple Bokeh server app. Adjust the sliders on the left
to change the sine wave on the right:

.. raw:: html

    <div>
    <iframe
        src="https://demo.bokeh.org/sliders"
        frameborder="0"
        style="overflow:hidden;height:460px;width: 120%;
        -moz-transform: scale(0.85, 0.85);
        -webkit-transform: scale(0.85, 0.85);
        -o-transform: scale(0.85, 0.85);
        -ms-transform: scale(0.85, 0.85);
        transform: scale(0.85, 0.85);
        -moz-transform-origin: top left;
        -webkit-transform-origin: top left;
        -o-transform-origin: top left;
        -ms-transform-origin: top left;
        transform-origin: top left;"
        height="460"
    ></iframe>
    </div>

For more examples of Bokeh server applications, see the
:ref:`gallery_server_examples` section of the :ref:`gallery`.

.. seealso::
    For information on using the server and writing Bokeh server plots
    and apps, see :ref:`userguide_server` in the user guide.

.. panels::
    :column: col-lg-12 col-md-12 col-sm-12 col-xs-12 p-2

    ---
    :card: + text-left
    .. link-button:: first_steps_8.html
        :text: Previous
        :classes: stretched-link

Next steps
----------

Congratulations, you have completed all of Bokeh's first steps guides!

More information about Bokeh is available in the :ref:`userguide`. For more
in-depth information about all aspects of Bokeh, see the :ref:`refguide`.

For more examples of what you can do with Bokeh, check the :ref:`gallery` and
the :bokeh-tree:`examples` directory in Bokeh's GitHub repository.

On the `Bokeh community page<https://bokeh.org/community/>`_, you can find links
and information about asking for help and contributing to Bokeh and the Bokeh
community.

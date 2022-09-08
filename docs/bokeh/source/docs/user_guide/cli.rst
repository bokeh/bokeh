.. _userguide_cli:

Using the command line
======================

You can produce a wide range of Bokeh outputs programmatically
with functions such as |output_file| and |output_notebook|.

However, this isn't the only way to work with the library. The ``bokeh`` command
line tool often offers better flexibility and makes iteration easier and faster.

For example:

``bokeh html``
    Create standalone HTML documents from any kind of Bokeh application
    source such as Python scripts, app directories, or JSON files.

``bokeh json``
    Generate a serialized JSON representation of a Bokeh document from any
    kind of Bokeh application source.

``bokeh serve``
    Publish Bokeh documents as interactive web applications.

An advantage of using the ``bokeh`` command on a command line is that the code
you write does not have to specify any particular output method or format. You
can write just the visualization code and decide how to output the results
later. This simplifies the above example as follows:

.. code-block:: python

    from bokeh.plotting import figure, curdoc

    p = figure()
    p.line(x=[1, 2, 3], y=[4,6,2])
    curdoc().add_root(p)

You can now run ``bokeh html foo.py`` to generate a standalone HTML file
or ``bokeh serve foo.py`` to start serving this document as a web application.

See :ref:`bokeh.command` in the |reference guide| for more information.

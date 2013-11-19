.. _userguide:


User Guide
==========

Coming soon. For now, consult the numerous `examples <https://github.com/ContinuumIO/Bokeh/tree/master/examples>`_
to see the kinds of parameters that can be passed in to plotting functions in ``bokeh.plotting``, and look
at the `glyph examples <https://github.com/ContinuumIO/Bokeh/tree/master/examples/glyphs>`_ to see
the kinds of low-level object attributes that can be set to really customize a plot.

Styling
-------

Bokeh plots are centered around glyphs, which generally have some combination of line, fill, or text properties,
depending on what is appropriate for a given glyph. For example, the ``Circle`` glyph has both line and fill properties,
but the ``Bezier`` glyph only has line properties.  These properties may be specified as keyword arguments
when calling the glyph functions::

    rect(x, y, radius, fill_color="green", fill_alpha=0.6, line_color=None)

line properties:

* **line_color**: the color of the line used to stroke the glyph
* **line_alpha**: an alpha value to use for the stroked line
* **line_width**: the width of the line stroked
* **line_join**: policy for joining lines ``"bevel", "round", "miter"``
* **line_cap**: style of endcaps for lines ``"butt", "round", *square"``
* **line_dash**: a pattern for lien dashing, expressed as a string. e.g., ``"4 6"``
* **line_dash_offset**: where in the dash pattern should the canvas start

fill properties:

* **fill_color**: the color to use when filling the glyph
* **fill_alpha**: an alpha value to use for filling

text properties:

* **text_font**: the name of the font to use for rendering text, e.g. ``"times", "sans"``
* **text_font_size**: the size of the font to render, e.g., ``"12pt", "10px", "1.5em"``
* **text_font_style**: font style to apply ``"normal", "italic", "oblique"``
* **text_color**: the color to render text with
* **text_alpha**: an alpha value to use while rendering text
* **text_align** horizontal alignment with respect to reference coordinates ``"left", "right", "center"``
* **text_baseline** vertical placement with respect to reference coordinates ``"top", "middle", "bottom"``

Embedding
---------


Animated Plots
--------------

While a sophisticated animation API is planned for Bokeh, it is already possible to create animated
plots just by updating a glyph's data source periodically. This requires running ``bokeh-server`` so
that plots are notified of the updates to the data. Below is a video capture of an animated
plot in the ipython notebook (which may be found in ``examples/plotting/notebook``).

.. image:: /_images/animated.gif
    :align: center

Note that all the tools, zoom, pan, resize function normally and the plot continues to animate while
the tools are used. Currently in order to animate, you must grab the glyph renderer off a plot, update
its data source and set the dirty flag, then store the data source on the session. The code to animate
the above plot is shown here::

    renderer = [r for r in curplot().renderers if isinstance(r, Glyph)][0]
    ds = renderer.data_source
    while True:
        for i in linspace(-2*pi, 2*pi, 50):
            rmin = ds.data["inner_radius"]
            rmin = roll(rmin, 1)
            ds.data["inner_radius"] = rmin
            rmax = ds.data["outer_radius"]
            rmax = roll(rmax, -1)
            ds.data["outer_radius"] = rmax
            ds._dirty = True
            session().store_obj(ds)
            time.sleep(.5)

This is somewhat clunky, but improvements and simplifications are planned for the 0.4 release and after.


Extending
---------


Novel Plots
-----------




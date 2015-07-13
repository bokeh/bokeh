.. _userguide_webgl:

Speeding up visualizations with WebGL
=====================================

When visualizing large datasets with Bokeh, the interaction can become
rather slow. To counter this, one can enable WebGL, which allows
rendering some glyph types on graphics hardware.

What is WebGL?
--------------

WebGL is a JavaScript API that allows rendering content in the browser
via the Graphics Processing Unit (GPU), without the need for plugins.
WebGL is standardized and available in all modern browsers. 

How to enable WebGL
-------------------

*Note: the way in which WebGL is enabled may change*

Inside the browser, the global boolean variable ``window.BOKEH_WEBGL``
indicates whether WebGL is enabled. This value can be modified in the
browser (by opening the developer console) to toggle between normal
and WebGL rendering.

The initial value of ``window.BOKEH_WEBGL`` is determined by the
environment variable ``BOKEH_WEBGL`` at the moment that the
visualization is created. Thus, to enable WebGL by default, set the
``BOKEH_WEBGL` environment variable to '1', for instance using:

    os.environ['BOKEH_WEBGL'] = '1'


Support
-------

Only a subset of Bokeh's objects are capable of rendering in WebGL.
Currently this is limited to circle and square marker glyphs. We plan
to extend the support to more markers, lines, and other objects such
as maps. You can safely combine multiple glyphs in a plot, of which
some are rendered in WebGL, and some are not.

The performance improvements when using WebGL varies per situation. Due
to overhead in some places of BokehJS, we can currently not benefit
from the full speed that you might expect from WebGL. This is also
something we plan to improve over time.

Notes
-----

* Glyphs drawn using WebGL are drawn on top of glyphs that are not drawn
  in WebGL.
* When the scale is non-linear (e.g. log), the system falls back to 2D
  rendering.
* Making selections does not work when there are more than 65k data points
  (due to the WebGL limitation that index buffers can only be uint16).
* Typical browsers restrict the number of GL contexts to 16. When there
  are many plots on one page, some are likely to produce wrong visual
  output.


Example
-------

Here's a Plot of 10.000 points. You should notice how panning the plot
is a bit slow, even though a decimated version of the data is shown
during user interaction.

If you now now open your browser developer console (e.g. by pressing
F12), and type ``BOKEH_WEBGL = 1``, the plot should look the same, but
interaction should be much smoother.


.. bokeh-plot::
    :source-position: above

    import numpy as np
    
    from bokeh.plotting import figure, show, output_file
    
    N = 10000
    
    x = np.random.normal(0, np.pi, N)
    y = np.sin(x) + np.random.normal(0, 0.2, N)
    
    output_file("scatter10k.html", title="scatter 10k points")
    
    p = figure()
    p.scatter(x,y, alpha=0.1)
    show(p)

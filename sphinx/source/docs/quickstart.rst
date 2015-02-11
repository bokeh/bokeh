.. _quickstart:

Quickstart
##########

Introduction
============

Bokeh is a Python interactive visualization library that targets modern web browsers
for presentation providing elegant, concise construction of novel graphics with
high-performance interactivity over very large or streaming datasets in quick and
easy way.

Offering both powerful and flexible features to enable very advanced customizations
in one hand and simplicity on the other Bokeh exposes different interface levels
to the users:

* a low Level (and more flexible) glyph interface
* an intermediate level interface called plotting
* a high level interface that can be used to build complexs plot in a simple way.

Charts layer is still experimental and may significantly change in the next releases.
Plotting should be preferred for a more stable or production code. For this reason
we will focus mainly on showing plotting in this quickstart section.

.. _quickstart_download:

Downloading
===========

There are several ways to get Bokeh:

If you are using the `Anaconda Python distribution <http://continuum.io/anaconda>`_::

    $ conda install bokeh

This will install all the dependencies that you need to be ready to run bokeh and we
strongly recommend using it. It really reduces the installation effort near to zero
on every platform and configuration (Windows included). It will also install the examples
into the ``examples/`` subdirectory of your Anaconda (or miniconda) installation directory.

If you are confident you have dependencies like NumPy, Pandas, and Redis installed,
then you can use ``pip``::

    $ pip install bokeh

This will not install any examples, and you will need to clone the git
repository and look in the ``examples/`` directory there.

To download from source, clone the `Bokeh git repo <https://github.com/bokeh/bokeh>`_,
then run::

    $ python setup.py install

If you are using Windows, please see the
:ref:`install_windows`.


Getting Started
===============

Bokeh is very large and flexible by its nature, so this section should only be
considered just as a quick taste of Bokeh capabilities and workflows. For more
meaningful and detailed information please move forward the full :ref:`userguide`.

Let's start with some examples.

Plotting this data as a simple line chart is very straightforward:

.. bokeh-plot::
   :source-position: above

   from bokeh.plotting import figure, output_file, show

   # prepare some data
   x = [1, 2, 3, 4, 5]
   y = [6, 7, 2, 4, 5]

   # output to static HTML file
   output_file("lines.html", title="line plot example")

   # Plot a `line` renderer setting the color, line thickness, title, and legend value.
   p = figure(title="simple line example")
   p.line(x, y, legend="Temp.", x_axis_label='x', y_axis_label='y')

   show(p)

What just happened?

What you see when you execute this script is that after it's execution it opens
your current browser in a new tab with a plot showing a line glyph representing
the data we have on the script. Of course there is a lot more going on. Bokeh targets
modern browser for presentation. This means while a lot is happening inside a python
environment the presentation part is happening on your browser. That's BokehJS working
for you. All your python code prepares the  context for BokehJS to display a nice
looking plot on your browser for you. If you are curious about it and want to read
more refer to the :ref:`bokehjs` section.

All we had to do was tell bokeh.plotting that:

1. We want to write our plots to the output file "lines.html"
2. Build a line from our data and add some simple customizations like title, legend and axes labels
3. Ask to show the result

Plotting is also quite handy if we need to customize the output a bit more by adding
more data series, glyphs, logarithmic axis, etc...

.. bokeh-plot::
   :source-position: above

   from bokeh.plotting import figure, output_file, show

   # prepare some data
   x0 = [1, 2, 3, 4, 5]
   y1 = [x**2 for x in x0]
   y2 = [10**x for x in x0]
   y3 = [10**(x**2) for x in x0]

   # output to static HTML file
   output_file("log_lines.html")

   # create a new figure
   p = figure(
       tools="pan,box_zoom,reset,save",
       y_axis_type="log", y_range=[0.001, 10**22], title="log axis example",
       x_axis_label='sections', y_axis_label='particles'
   )

   # create plots!
   p.line(x0, x0, legend="y=x")
   p.circle(x0, x0, legend="y=x")
   p.line(x0, y1, legend="y=x**2")
   p.circle(x0, y1, fill_color=None, line_color="green", legend="y=x**2")
   p.line(x0, y2, line_color="red", line_width=2, legend="y=10^x")
   p.line(x0, y3, line_color="orange", line_width=2, legend="y=10^(x^2)")

   show(p)

Much better, right? At this point it's time to take a better look at the last example.
We've exposed quite a few structures like plot figures, line, circle, axes, figures
without any premise. It's time define some core concepts of Bokeh:


Plot
----

Plots are a centric concept in Bokeh and are rendered as a plot figure draw
on the selected output. In both previous examples we have created a plot. In the
first example this action has been implicit (when calling output_file followed by
line glyph it automatically creates a new plot instance to contain the following
glyph [line]) while we have explicitly used figure to create a new plot in the second
example. Everytime figure is called it creates a new plot figure and, as you may
have noticed from the previous example, defines a rich set of keyword arguments
that control its appearence. See :ref:`userguide_plotting` for more details.


Glyphs (Line/Circle)
--------------------

Line and Circle are just 2 of the many glyphs supported by Bokeh. Those are the basic
geometrical shapes that are combined together to build a plot. In the first example
we have just used one glyph (line) to represent our data while in the second example
we have used combination of lines and circles. There is a big variety of glyphs in Bokeh
and they are often referred as 'glyphs' or 'markers' (used for simple markers placed
at (x,y) locations). Please see :ref:`userguide_objects_glyphs` for more information.


Guides
------

Axes are a very important type of guide and are automatically managed by bokeh
when a new plot is created. It's very easy to customize plot axes as you have seen
in the previous examples. With the plotting API you can have access to the axis
configuration directly specifying some keyword arguments when calling figure or one
of the glyphs. Plotting also expose access to the axes by explicitly calling axis
method (as show in the next example). Please refer to :ref:`userguide_objects_axes`
for more information.

Legend is another very useful guide. As you can notice from the former examples
you can use it to group more the one glyph to the same data series under the same
legend text (in addition to the traditional use case of legends). Please refer
to :ref:`userguide_objects_axes` for more information about it.


Ranges
------

With x_range and y_range figure keyword arguments it's possible to control the ranges
of a plot. These may be passed into the bokeh.plotting.figure function, or into any
of the high-level plotting Glyph Functions (like line or cycle). They may also be
set as attributes on a plot object. As usual tale a look at the more detailed section
:ref:`userguide_objects_ranges`.

Bokeh offers a lot of structures and we really recommend the reader to spend some time
looking at :ref:`userguide`.

One very useful aspect to keep in mind is that the previous structures are always at the
base the objects, also those created using higher interface levels like bokeh.plotting
(or bokeh.charts).


More examples
=============

Another very common way of visualizing data is using a histogram to represent distributions.
Here's how the code for this use case looks like using bokeh.charts:

.. bokeh-plot::
   :source-position: above

   import numpy as np
   from bokeh.plotting import figure, output_file, show

   # prepare data
   mu, sigma = 0, 0.5
   measured = np.random.normal(mu, sigma, 1000)
   hist, edges = np.histogram(measured, density=True, bins=50)
   x = np.linspace(-2, 2, 1000)

   # output to static HTML file
   output_file('histogram.html')

   p = figure(title="Histogram", background_fill="#E8DDCB")
   p.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
          fill_color="#036564", line_color="#033649")

   # customize axes
   xa, ya = p.axis
   xa.axis_label = 'x'
   ya.axis_label = 'Pr(x)'

   show(p)

and (again) we can easily add more elements to make it look better (we'll highlight the
differences from the previous examples to help comparison):

.. bokeh-plot::
   :source-position: above
   :emphasize-lines: 2,10,11,23,24,27

   import numpy as np
   import scipy.special
   from bokeh.plotting import figure, output_file, show

   # prepare data
   mu, sigma = 0, 0.5
   measured = np.random.normal(mu, sigma, 1000)
   hist, edges = np.histogram(measured, density=True, bins=50)
   x = np.linspace(-2, 2, 1000)
   pdf = 1/(sigma * np.sqrt(2*np.pi)) * np.exp(-(x-mu)**2 / (2*sigma**2))
   cdf = (1+scipy.special.erf((x-mu)/np.sqrt(2*sigma**2)))/2

   # output to static HTML file
   output_file('histogram.html')

   # prepare the histogram
   p = figure(title="Normal Distribution (μ=0, σ=0.5)",tools="previewsave",
              background_fill="#E8DDCB")
   p.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
          fill_color="#036564", line_color="#033649",)

   # Use `line` renderers to display the PDF and CDF
   p.line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
   p.line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")

   # customize axes
   p.legend.orientation = "top_left"
   xa, ya = p.axis
   xa.axis_label = 'x'
   ya.axis_label = 'Pr(x)'

   show(p)

One thing to notice is that we have always created static html files by
calling output_file function. This output option will write a static HTML
file with the filename it receive as input.

If these HTML files are too large (since they embed the source code for
the BokehJS JavaScript library, as well as the various Bokeh CSS), then you
can modify any of the example scripts in ``examples/plotting/file`` and change
the ``output_file()`` function calls by adding ``mode`` keyword argument.

.. note:: Please remember what we mentioned at the :ref:`quickstart_download`
          section before: if you have installed bokeh using pip you won't have
          the examples available and will need to clone the git
          repository and look in the ``examples/`` directory there.


Bokeh offers easy access to other powerful output options:


Using Bokeh Plot Server
=======================

Rather than embedding all the data directly into the HTML file, you can also
store data into a "plot server" and the client-side library will directly,
dynamically load the data from there.

If you installed Bokeh via running ``python setup.py`` or via a
`conda <http://docs.continuum.io/conda/intro.html>`_ package, then you should
have a command `bokeh-server` available to you.  You can run this command in
any directory, but it will create temporary files in the directory in which
you are running it.  You may want to create a ``~/bokehtemp/`` directory or
some such, and run the command there::

    $ bokeh-server

If you have Bokeh installed for development mode (see :ref:`devguide_building`),
then you should go into the checked-out source directory and run::

    $ python ./bokeh-server

Once the plot server is started, you can make your bokeh server automagically
manage your plots.
At this point, with the bokeh server up and running, all you need to do to make
the previous examples run against the bokeh server is to simply replace the
"output_file" command with "output_server". Here's the first example reviewed:

.. literalinclude:: examples/line_server.py
   :language: python
   :linenos:
   :emphasize-lines: 8


Well... this is a quite boring thing to do with bokeh server. Now you can use it
to live update your data creating nice dynamic plots. Here's a simple example of
an animated line plot:

.. literalinclude:: examples/line_server_animated.py
   :language: python
   :linenos:

At this point you should really be asking if bokeh server could offer something
else for you. Of course yes(!) and you should check the related documentation.


Using Bokeh with IPython Notebooks
==================================

IPython notebooks are great and widely used. Bokeh integrates with IPython notebooks
nicely. All you need to do is to use the function output_notebook() (instead of
output_file) in conjuction with show(). You could also use the %bokeh IPython “magic”
for the notebook that allows for configuring modes like autoshow, autohold for every
cell.

There are a number of IPython notebooks in the ``examples/plotting/notebook/``
directory.  Just run::

    ipython notebook

in that directory, and open any of the notebooks.

Sample Data
===========

Some of the examples included in the Bokeh source make use of sample data files that are
distributed separately. To download this data, execute the following commands at a
command prompt::

    $ python -c "import bokeh.sampledata; bokeh.sampledata.download()"

What's next?
============

For more information about the goals and direction of the project, please
see the :ref:`technicalvision`.

To see examples of how you might use Bokeh with your own data, check out
the :ref:`gallery`.

For questions and technical assistance, come join the `bokeh users mailing list <https://groups.google.com/a/continuum.io/forum/#!forum/bokeh>`_.

Visit the source repository: `https://github.com/bokeh/bokeh <https://github.com/bokeh/bokeh>`_
and try the examples.

Be sure to follow us on Twitter `@bokehplots <http://twitter.com/BokehPlots>`_, as well as on `Vine <https://vine.co/bokehplots>`_, and `Youtube <https://www.youtube.com/channel/UCK0rSk29mmg4UT4bIOvPYhw>`_!




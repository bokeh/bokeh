.. _quickstart:

##########
Quickstart
##########

Introduction
------------

Bokeh is a Python interactive visualization library that targets modern web browsers
for presentation providing elegant, concise construction of novel graphics with
high-performance interactivity over very large or streaming datasets in quick and
easy way.

Offering both powerful and flexible features to enable user very advanced customizations
in on hand and simplicity on the other Bokeh exposes different interface levels
to the users: a low Level (and more flexible) glyph interface, an intermediate level
interface called plotting and a high level interface that can be used to build
complexs plot in a simple way.

Charts layer is still experimental and may significantly change in the next releases.
Plotting should be preferred for a more stable or production code. For this reason
we will focus mainly on showing plotting in this quickstart section.


Downloading
-----------

There are several ways to get Bokeh:

If you are using the `Anaconda Python distribution <http://continuum.io/anaconda>`_::

    $ conda install bokeh

This will install all the dependencies that you need to be ready to run bokeh and we
strongly recommend using it. It really reduces the installation effort near to zero
on every platform and configuration (Windows included). It will also install the examples
into the ``examples/`` subdirectory of your Anaconda installation directory.

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
---------------

By it's nature Bokeh is wide and flexible, so this quickstart should only be
considered as a quick taste of Bokeh capabilities and workflows. For more meaningful
and detailed information please move forward the full docs.


First, let's write some boilerplate code to generate the data that we will be using
on all examples below.

.. literalinclude:: examples/examples_boilerplate.py
   :language: python
   :linenos:
   :emphasize-lines: 33,43,44,49,51,52


Plotting data to a simple line chart can be quite easy if you already have your data
ready to use.

.. literalinclude:: examples/simple_line.py
   :language: python
   :linenos:
   :emphasize-lines: 33,43,44,49,51,52

.. image:: /_images/quickstart/simple_line.png


Let's say we need to customize it a bit more fancy features like data series, glyphs,
logarithmic axis, etc...

.. literalinclude:: examples/log_line.py
   :language: python
   :linenos:
   :emphasize-lines: 33,43,44,49,51,52

.. image:: /_images/quickstart/log_line.png


Another very common way of visualizing data is using a histogram to represent
distributions:

.. literalinclude:: examples/histogram.py
   :language: python
   :linenos:
   :emphasize-lines: 33,43,44,49,51,52

.. image:: /_images/quickstart/histogram.png

and we can easily make it look better..

.. literalinclude:: examples/histogram_more.py
   :language: python
   :linenos:
   :emphasize-lines: 33,43,44,49,51,52

.. image:: /_images/quickstart/histogram_more.png


One thing to notice is that we have always created static html files by
calling output_file function. This output option will write a static HTML
file with the filename it receive as input.

If these HTML files are too large (since they embed the source code for
the BokehJS JavaScript library, as well as the various Bokeh CSS), then you
can modify any of the example scripts in ``examples/plotting/file`` and change
the ``output_file()`` function calls by adding ``mode`` keyword argument.

Bokeh offers easy access to other powerful options...


Using Bokeh Plot Server
-----------------------

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

If you have Bokeh installed for development mode (see :ref:`developer_install`),
then you should go into the checked-out source directory and run::

    $ python ./bokeh-server

Once the plot server is started, you can make your bokeh server automagically
manage your plots.
At this point, with the bokeh server up and running, all you need to do to make
the previous examples run against the bokeh server is to simply replace the
"output_file" command with "output_server". So first example reviewed:


.. literalinclude:: quickstart/simple_line_server.py
   :language: python
   :linenos:
   :emphasize-lines: 33,43,44,49,51,52


Well... this is a quite boring thing to do with bokeh server. Now you can use it
to live update your data creating nice dynamic plots. Here's a simple example of
an animated line plot:

.. literalinclude:: quickstart/simple_line_server_animated.py
   :language: python
   :linenos:
   :emphasize-lines: 33,43,44,49,51,52


At this point you should really be asking if bokeh server could offer something
else for you. Of course yes(!) and you should check the related documentation.


Using Bokeh with IPython Notebooks
----------------------------------

IPython notebooks are great and widely used. Bokeh integrates with IPython notebooks
nicely. All you need to do is to use the function output_notebook() (instead of
output_file) in conjuction with show(). You could also use the %bokeh IPython “magic”
for the notebook that allows for configuring modes like autoshow, autohold for every
cell.

There are a number of IPython notebooks in the ``examples/plotting/notebook/``
directory.  Just run::

    ipython notebook

in that directory, and open any of the notebooks.

What's next?
------------

For more information about the goals and direction of the project, please
see the :ref:`technicalvision`.

For a more detailed guide about plotting and charts , follow the :ref:`quickstart`.

To see examples of how you might use Bokeh with your own data, check out
the :ref:`gallery`.

Visit the source repository: `https://github.com/bokeh/bokeh <https://github.com/bokeh/bokeh>`_
and try the examples.

Be sure to follow us on Twitter `@bokehplots <http://twitter.com/BokehPlots>`_!

.. note:: If you try running the be sure that you have downloaded the examples sample data.
          To do this you just need to execute the following commands at a command prompt::
          ``python -c "import bokeh.sampledata; bokeh.sampledata.download()"``


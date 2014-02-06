.. _quickstart:

##########
Quickstart
##########

Downloading
-----------

There are several ways to get Bokeh:

If you are using the `Anaconda Python distribution <http://continuum.io/anaconda>`_:
::

    $ conda install bokeh

This will install the examples into the ``examples/`` subdirectory of
your Anaconda installation directory.

If you are confident you have dependencies like NumPy, Pandas, and Redis installed,
then you can use ``pip``:
::

    $ pip install bokeh

This will not install any examples, and you will need to clone the git 
repository and look in the ``examples/`` directory there.

To download from source, clone the `Bokeh git repo <https://github.com/ContinuumIO/bokeh>`_,
then run:
::

    $ python setup.py install

If you are using Windows, please see the 
:ref:`install_windows`.


Generate Static HTML Files
--------------------------

Now you are ready to generate static plots. In ``examples/plotting/file/``, try:
::

    $ python iris.py

This will write a static HTML file ``iris.html`` in the current directory and
open a browser window to display it, and it should look like:

.. image:: images/iris.png

Try running ``line.py`` or ``candlestick.py`` for other static HTML file examples.

If these HTML files are too large (since they embed the source code for 
the BokehJS Javascript library, as well as the various Bokeh CSS), then you
can modify any of the example scripts in ``examples/plotting/file/`` and change
the ``output_file()`` function calls by adding two keyword arguments.  For the
iris.py example, you would change the call:
::

    output_file("iris.html", title="iris.py example")

To:
::

    output_file("iris.html", title="iris.py example", js="relative", css="relative")


Using the Plot Server
---------------------

Rather than embedding all the data directly into the HTML file, you can also
store data into a "plot server" and the client-side library will directly,
dynamically load the data from there.

If you installed Bokeh via running ``python setup.py`` or via a 
`conda <http://docs.continuum.io/conda/intro.html>`_ package, then you should
have a command `bokeh-server` available to you.  You can run this command in
any directory, but it will create temporary files in the directory in which
you are running it.  You may want to create a ``~/bokehtemp/`` directory or
some such, and run the command there.
::

    $ ./bokeh-server

If you have Bokeh installed for development mode (see :ref:`developer_install`), 
then you should go into the checked-out source directory and run:
::

    $ python ./bokeh-server

Once the plot server is started, you can run any of the examples in
``examples/plotting/server/``.  When those examples run, they will not
necessarily open a new browser window.  Instead, you should navigate to
**http://localhost:5006/bokeh** and you will see a list of all plot "documents"
which have been created.  Clicking on a document name will display its
plots.


Example IPython Notebooks
-------------------------

There are a number of IPython notebooks in the ``examples/plotting/notebook/``
directory.  Just run::

    ipython notebook

in that directory, and open any of the notebooks.


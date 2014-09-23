
Package Installation
====================

The easiest way to obtain and start using Bokeh is to install a pre-built
package. You can find "quickstart" instructions on the main Bokeh docs
site here:

    http://bokeh.pydata.org/docs/quickstart.html

Typically this is as simple as:

    conda install bokeh

or:

    pip install bokeh

Thre is more detailed information about different methods of installation
here:

    http://bokeh.pydata.org/docs/installation.html

Source Installation
===================

Bokeh is a multi-language project, and building it from source requires
installing and coordinating different toolchains. You can find detailed
instructions for building Bokeh from source here:

    http://bokeh.pydata.org/docs/dev_guide.html#developer-install

Once all the required tools and dependencies are installed, building
Bokeh is typically accomplished with by running:

    python setup.py install --build_js

or:

    python setup.py develop --build_js

However, there are other ways to build that can afford incremental
compilation of BokehJS (and hence faster code iteration). Consult
the developer install link above for full details.
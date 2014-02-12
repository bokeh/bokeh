
Welcome to Bokeh
================


.. _about:

Bokeh is a Python interactive visualization library for large datasets that
natively uses the latest web technologies.  Its goal is to provide elegant,
concise construction of novel graphics in the style of Protovis/D3, while
delivering high-performance interactivity over large data to thin clients.

For more information about the goals and direction of the project, please
see the :ref:`technicalvision`.

To get started quickly, follow the :ref:`quickstart`.

Visit the source repository: `https://github.com/ContinuumIO/bokeh <https://github.com/ContinuumIO/bokeh>`_

Be sure to follow us on Twitter `@bokehplots <http://twitter.com/BokehPlots>`_!

.. raw:: html

    <p>
    <table cellspacing="20">
    <tr>
        <td><a href="http://continuumio.github.io/bokehjs/image.html"><img src="_images/image_plot1.png"/></a></td>
        <td><a href="plot_gallery/anscombe.html"><img src="_images/anscombe2.png"/></a></td>
        <td><a href="plot_gallery/correlation.html"><img src="_images/stocks3.png"/></a></td>
        <td><a href="plot_gallery/lorenz_example.html"><img src="_images/lorenz2.png"/></a></td>
        <td><a href="plot_gallery/candlestick.html"><img src="_images/candlestick2.png"/></a></td>
        <td><a href="plot_gallery/color_scatter_example.html"><img src="_images/scatter.png"/></a></td>
    </tr><tr>
        <td><a href="http://continuumio.github.io/bokehjs/map_overlay.html"><img src="_images/map_overlay1.png"/></a></td>
        <td><a href="plot_gallery/iris.html"><img src="_images/iris2.png"/></a></td>
        <td><a href="plot_gallery/texas_example.html"><img src="_images/choropleth2.png"/></a></td>
        <td><a href="plot_gallery/iris_splom.html"><img src="_images/splom2.png"/></a></td>
        <td><a href="plot_gallery/burtin_example.html"><img src="_images/burtin.png"/></a></td>
        <td><a href="plot_gallery/vector_example.html"><img src="_images/streamline.png"/></a></td>

    </tr>
    </table>
    </p>

Contents
--------

.. toctree::
   :maxdepth: 2

   quickstart.rst
   installation.rst
   tutorial.rst
   gallery.rst
   user_guide.rst
   dev_guide.rst
   contributing.rst
   faq.rst
   release_notes.rst
   reference.rst


.. _technicalvision:

Technical Vision
----------------

Photographers use the Japanese word "bokeh" to describe the blurring of the
out-of-focus parts of an image.  Its aesthetic quality can greatly enhance a
photograph, and photographers artfully use focus to draw attention to subjects
of interest.  "Good bokeh" contributes visual interest to a photograph and
places its subjects in context.

In this vein of focusing on high-impact subjects while always maintaining
a relationship to the data background, the Bokeh project attempts to
address fundamental challenges of large dataset visualization:

* How do we look at *all* the data?

  * What are the best perceptual approaches to honestly and accurately
    represent the data to domain experts and SMEs so they can apply their
    intuition to the data?

  * Are there automated approaches to accurately reduce large datasets
    so that outliers and anomalies are still visible, while we meaningfully
    represent baselines and backgrounds?  How can we do this without
    "washing away" all the interesting bits during a naive downsampling?

  * If we treat the pixels and topology of pixels on a screen as a bottleneck
    in the I/O channel between hard drives and an analyst's visual cortex,
    what are the best compression techniques at all levels of the data
    transformation pipeline?

* How can scientists and data analysts be empowered to use visualization
  fluidly, not merely as an output facility or one stage of a pipeline,
  but as an entire mode of engagement with data and models?

  * Are language-based approaches for expressing mathematical modeling
    and data transformations the best way to compose novel interactive
    graphics?

  * What data-oriented interactions (besides mere linked brushing/selection)
    are useful for fluid, visually-enable analysis?

Some of the core ideas for the backend processing in bokeh-server are currently
implemented as a standalone library, and are being developed under the term
"Abstract Rendering", which we will be presenting at VDA 2014.  For more
information, you can visit the
`Abstract Rendering github <http://github.com/JosephCottam/AbstractRendering>`_.

Bokeh is one of several open-source components of the broader technical
vision of `Continuum Analytics <http://continuum.io>`_.  By providing powerful data
description and vector computing on remote and distributed data via
`Blaze <http://blaze.pydata.org>`_ and `Numba <http://numba.pydata.org>`_, and
providing interactive visualizations of them via Bokeh, we enable teams
to collaboratively perform rich analysis, share them with others (potentially
non-technical members of their team or business), and rapidly create
analytical dashboards and monitoring interfaces.

One guiding principle for the development of Bokeh is to provide useful
software for people, while incorporating novel ideas from the academic world of
visualization research.  Additionally, as a modular and open-source project, we
hope that Bokeh will enable many other projects to build a rich suite of
domain-specific applications that change existing, legacy paradigms of data
processing workflow.



.. _contact:

Contact
-------

For questions, please join the bokeh mailing list:
`https://groups.google.com/a/continuum.io/forum/#!forum/bokeh <https://groups.google.com/a/continuum.io/forum/#!forum/bokeh>`_

You can also ask questions on StackOverflow and use the #bokeh tag:
`http://stackoverflow.com/questions/tagged/bokeh <http://stackoverflow.com/questions/tagged/bokeh>`_.

Follow us on Twitter `@bokehplots <http://twitter.com/BokehPlots>`_!
When tweeting about how awesome Bokeh is, be sure to use the #bokeh tag!

For information about commercial development, custom visualization development
or embedding Bokeh in your applications, please contact
`pwang@continuum.io <mailto://pwang@continuum.io>`_.

To donate funds to support the development of Bokeh, please contact
`info@pydata.org <mailto://info@pydata.org>`_.


Thanks
------

Bokeh is developed with funding from `DARPA <http://www.darpa.mil>`_'s
`XDATA <http://www.darpa.mil/Our_Work/I2O/Programs/XDATA.aspx>`_ program.

Additionally, many thanks to `all of the Bokeh Github contributors <https://github.com/ContinuumIO/bokeh/graphs/contributors>`_.


License
-------

Traditional 3-clause BSD license:

..

    Copyright (c) 2012, Continuum Analytics, Inc.
    All rights reserved.

    Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

    Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

    Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

    Neither the name of Continuum Analytics nor the names of any contributors may be used to endorse or promote products derived from this software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.



Indices and tables
------------------

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`






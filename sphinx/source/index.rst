
Welcome to Bokeh
================

.. _about:

Bokeh is a Python interactive visualization library that targets modern
web browsers for presentation. Its goal is to provide elegant, concise
construction of novel graphics in the style of D3.js, but also deliver this
capability with high-performance interactivity over very large or streaming
datasets. Bokeh can help anyone who would like to quickly and easily create
interactive plots, dashboards, and data applications.

For more information about the goals and direction of the project, please
see the :ref:`technicalvision`.

To get started quickly, follow the :ref:`quickstart`.

To see examples of how you might use Bokeh with your own data, check out
the :ref:`gallery`.

For questions and technical assistance, come join the `Bokeh mailing list`_.

Visit the `GitHub source repository <Bokeh GitHub_>`_.

Be sure to follow us on Twitter `@bokehplots <Twitter_>`_, as well as on `Vine`_, and
`Youtube`_!

.. include:: docs/includes/hero.txt

Contents
--------

.. toctree::
   :maxdepth: 2

   docs/quickstart.rst
   docs/installation.rst
   docs/gallery.rst
   docs/user_guide.rst
   docs/tutorials.rst
   docs/dev_guide.rst
   docs/contributing.rst
   docs/faq.rst
   docs/release_notes.rst
   docs/reference.rst


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
information, you can visit the `Abstract Rendering GitHub page <AR GitHub_>`_.

Bokeh is one of several open-source components of the broader technical
vision of `Continuum Analytics`_.  By providing powerful data
description and vector computing on remote and distributed data via
`Blaze`_ and `Numba`_, and providing interactive visualizations of them
via Bokeh, we enable teams to collaboratively perform rich analysis,
share them with others (potentially non-technical members of their team
or business), and rapidly create analytical dashboards and monitoring
interfaces.

One guiding principle for the development of Bokeh is to provide useful
software for people, while incorporating novel ideas from the academic world of
visualization research.  Additionally, as a modular and open-source project, we
hope that Bokeh will enable many other projects to build a rich suite of
domain-specific applications that change existing, legacy paradigms of data
processing workflow.

.. _contact:

Contact
-------

For questions and technical assistance, come join the `Bokeh mailing list`_.

You can also ask and read questions on StackOverflow with the
`#bokeh tag <Bokeh SO_>`_.

Follow us on Twitter `@bokehplots <Twitter_>`_! When tweeting about
how awesome Bokeh is, be sure to use the #bokeh hashtag!

For information about commercial development, custom visualization
development or embedding Bokeh in your applications, please contact
`pwang@continuum.io <pwang email_>`_.

To donate funds to support the development of Bokeh, please contact
`info@pydata.org <info email_>`_.

.. _thanks:

Thanks
------

Bokeh is developed with funding from `DARPA`_'s `XDATA`_ program.

Additionally, many thanks to all of the `Bokeh contributors`_.

.. _license:

License
-------

Traditional 3-clause BSD license:

----

Copyright (c) 2012, Continuum Analytics, Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.

Neither the name of Continuum Analytics nor the names of any contributors
may be used to endorse or promote products derived from this software without
specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS”
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.

.. _indices:

Indices and tables
------------------

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

.. _AR GitHub: http://github.com/JosephCottam/AbstractRendering
.. _Blaze: http://blaze.pydata.org
.. _Bokeh contributors: https://github.com/bokeh/bokeh/graphs/contributors
.. _Bokeh GitHub: https://github.com/bokeh/bokeh
.. _Bokeh mailing list: https://groups.google.com/a/continuum.io/forum/#!forum/bokeh
.. _Bokeh SO: http://stackoverflow.com/questions/tagged/bokeh
.. _Continuum Analytics: http://continuum.io
.. _DARPA: http://www.darpa.mil
.. _info email: mailto:info@pydata.org
.. _Numba: http://numba.pydata.org
.. _pwang email: mailto:pwang@continuum.io
.. _Twitter: http://twitter.com/BokehPlots
.. _Vine: https://vine.co/bokehplots
.. _YouTube: https://www.youtube.com/channel/UCK0rSk29mmg4UT4bIOvPYhw
.. _XDATA: http://www.darpa.mil/Our_Work/I2O/Programs/XDATA.aspx





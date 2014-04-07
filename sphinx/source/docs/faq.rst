
.. _faq:

##########################
Frequently Asked Questions
##########################

.. contents::
    :local:
    :depth: 2
    :backlinks: none

..
    OK this is pretty maddening. If there is a better way to get all the answers, including
    multi-paragraph ones, to render in the same font, with the same sidebar, with all of
    their text, please make it better.

General Questions
=================

*How do you pronounce "bokeh"?*
-------------------------------

.. raw:: html

    <blockquote style="font-size: 10pt;">

.. compound::

    Either "boh-Kay" or "boh-Kuh".  For more information, you can
    `consult Wikipedia <http://en.wikipedia.org/wiki/Bokeh>`_ or an actual
    Japanese person.

.. raw:: html

    </blockquote>

*Why did you start writing a new plotting library, instead of just extending e.g. Matplotlib?*
----------------------------------------------------------------------------------------------

.. raw:: html

    <blockquote>

.. compound::

    There are a number of reasons why we wrote a new Python library, but they
    all hinge on maximizing flexibility for exploring new design spaces for
    achieving our long-term visualization goals.  (Please see
    :ref:`technicalvision` for details about those.)

    The client-server nature of displaying for the web is reflected in the
    fundamental architecture of the library, and also has significant impact on
    the front-end interface.  Additionally, the difficult task of coalescing
    large datasets for display on thin clients in a perceptually useful way
    demands different things of a graphics and rendering architecture than most
    of the readily-available libraries in Python today.

    In the meantime, we would like to remain as *compatible* with the rest of
    the Scipy and PyData ecosystems of tools as possible.  This means that we
    are very eager to get contributions that help us understanding
    configuration files from other libraries, provide API compatibility layers,
    and possibly create backends for other libraries on top of Bokeh's
    low-level glyph API.

    Please see :ref:`contact` and get in touch with the dev team if you have
    ideas along these lines.

.. raw:: html

    </blockquote>

*I'd like to incorporate Bokeh into my proprietary app or platform. Is there any problem with doing this?*
----------------------------------------------------------------------------------------------------------

.. raw:: html

    <blockquote>

.. compound::

    We are happy for people to do this.  We do appreciate an attribution, and
    we also would like to receive feedback about how it's working out for your
    project.

.. raw:: html

    </blockquote>


*What is the relationship between Bokeh and Chaco?*
---------------------------------------------------

.. raw:: html

    <blockquote>

.. compound::

    There is no direct active relationship between these two projects.  Some of
    the design choices in Chaco are reflected in the architecture of Bokeh, and
    some snippets of code from Chaco have been ported to Javascript and placed
    in BokehJS.  The goals of the two projects are quite different.  If you
    have a Chaco project that you'd like to put on the web, there is a good
    chance that you can make it work with Bokeh (since the HTML5 Canvas API is
    fairly close to Kiva's), but at this point, you will need to write
    Javascript if you want custom interactors.  For rich client, customizable,
    interactive visualization in Python, `Chaco
    <http://github.com/enthought/chaco>`_ is still a good tool.

.. raw:: html

    </blockquote>


*How Bokeh compare to mpld3?*
-----------------------------

.. raw:: html

    <blockquote>

.. compound::

    For a lightweight, python-only library that exposes most of matplotlib
    to the browser, mpld3 could be a good choice. Bokeh also intends
    to fully support the MPL interface (and hence Seaborn, pandas, and
    ggplot.py), however the main goal of Bokeh is to provide approachable
    capability for novel interactive visualizations in the browser. If you
    would like to have the benefits of HTML canvas rendering, dynamic
    downsampling, abstract rendering, server plot hosting, and the possibility
    of interacting from languages besides python, please consider Bokeh for
    your project.

.. raw:: html

    </blockquote>

Technical Questions
===================

*Is this using D3.js?*
----------------------

.. raw:: html

    <blockquote>

.. compound::

    No.  D3 is very cool and its predecessor Protovis was one of the
    inspirations for Bokeh.  However, we understand the goals of D3 to be about
    providing a Javascript-based data scripting layer for the DOM, and this is
    somewhat orthogonal (at this point) to the visualization challenges that
    Bokeh is trying to tackle.  Please see :ref:`technicalvision` for more
    details about the underlying goals and vision behind our project.

.. raw:: html

    </blockquote>

*If Bokeh is merely producing JSON objects for BokehJS to handle, why not use something like Vega?*
---------------------------------------------------------------------------------------------------

.. raw:: html

    <blockquote>

.. compound::

    We may very well end up using the Vega grammar.  For now, we need to be
    able to specifically tag certain objects with UUIDs so that the object
    graph structure can be reconstituted on the JS side.  Additionally, we
    use this JSON to reproduce Python object graphs when we load up a
    Python plot from the plot server - so we would need to make sure that Vega
    can fully encapsulate all the information we need here as well.

    At this point, the Trifacta folks are actively iterating on Vega in support
    of their projects.  We don't want to burden them with requirements that
    may be incidental to their main design goals at this early stage.  However,
    we are keeping an active watch over its evolution, and hope that there can
    be a convergence in this space down the road.

.. raw:: html

    </blockquote>



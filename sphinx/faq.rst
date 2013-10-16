
.. _faq:

##########################################
Frequently (or Inevitably) Asked Questions
##########################################

*Q: Why did you start writing a new plotting library, instead of just extending e.g. Matplotlib?*

There are a number of reasons why we wrote a new Python library, but they 
all hinge on maximizing flexibility for exploring new design spaces
for achieving our long-term visualization goals.  (Please see :ref:`technicalvision`
for details about those.)

The client-server nature of displaying for the web is reflected in the
fundamental architecture of the library, and also has significant impact on the
front-end interface.  Additionally, the difficult task of coalescing large
datasets for display on thin clients in a perceptually useful way demands 
different things of a graphics and rendering architecture than most of the
readily-available libraries in Python today.

In the meantime, we would like to remain as *compatible* with the rest of
the Scipy and PyData ecosystems of tools as possible.  This means that 
we are very eager to get contributions that help us understanding configuration
files from other libraries, provide API compatibility layers, and possibly
create backends for other libraries on top of Bokeh's low-level :ref:`glyph_api`.

Please see :ref:`contact` and get in touch with the dev team if you have 
ideas along these lines.

*Q: Is this using D3.js?*

No.  D3 is very, very cool and its predecessor Protovis was one of the
inspirations for the Bokeh project.  However, we understand the goals of D3 to
be about providing a Javascript-based data scripting layer for the DOM, and
this is somewhat orthogonal (at this point) to the visualization challenges
that Bokeh is trying to tackle.  Please see :ref:`technicalvision` for more
details about the underlying goals and vision behind our project.

*Q: What is the relationship between Bokeh and Chaco?*

There is no direct active relationship between these two projects.  Some of the
design choices in Chaco are reflected in the architecture of Bokeh, and some
snippets of code from Chaco have been ported to Javascript and placed in
BokehJS.  The goals of the two projects are quite different.  If you have
a Chaco project that you'd like to put on the web, there is a good chance
that you can make it work with Bokeh (since the HTML5 Canvas API is fairly
close to Kiva's), but at this point, you will need to write Javascript if
you want custom interactors.  For rich client, customizable, interactive
visualization in Python, `Chaco <http://github.com/enthought/chaco>` is 
still a good tool.

*Q: I'd like to incorporate Bokeh into my proprietary app or platform. Is
there any problem with doing this?*

We are happy for people to do this.  We do appreciate an attribution,
and we also would like to receive feedback about how it's working out
for your project.




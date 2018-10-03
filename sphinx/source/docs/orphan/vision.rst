:orphan:

.. _vision:

Vision
######

Bokeh is a Python interactive visualization library that targets modern web
browsers for presentation. Its goal is to provide elegant, concise construction
of basic exploratory and advanced custom graphics in the style of D3, but also
deliver this capability with high-performance interactivity over very large or
streaming datasets. Bokeh should help anyone who would like to quickly and
easily create interactive plots, dashboards, and data applications.

.. _aow:

Areas of Work
#############

The development pace of Bokeh is contigent on external funding opportunities,
so instead of a traditional "roadmap" with specific dates and deadlines, we
present the major areas of work the core team considers important. These are
tasks and projects that we would like to do ourselves, when time and resources
permit, or that we would be happy to have done by new contributors.

Improvements to Layout
======================

Bokeh has a built in layout system that is suitable for simple use cases. There
are still currently use-cases that do not function well or properly. We would
like to make Bokeh's layout system more robust, simpler, faster, and applicable
as widely as possible, while demonstrating alternative options using external
layout libraries for more sophisticated use cases.

Use WebGL Throughout
====================

Bokeh currently can use WebGL to accelerate plotting for larger datasets in some
limited situations. In addition to not fully supporting all use-cases, the
internal cost is having to maintain two separate code paths. It would be
desirable to convert all of Bokeh's rendering to use WebGL (possibly via a
higher level library such as ReGL) so that better performance for larger data
sets is always available, and to streamline maintenance for the future.

Develop BokehJS as a first-class JavaScript library
===================================================

By and large none of the core contributors have been JS or front-end experts,
and for some time the client side BokehJS library was an implementation detail.
There is more interest to use BokehJS directly, and with attention from
experienced front-end JS developers, BokehJS could integrate better with
existing common web frameworks and tools than it currently does. This includes
making much more accessible documentation for BokehJS itself. These improvements
would also help increase the potential pool of core developers interested in
maintaining BokehJS over the long run.

Better Theming Support
======================

Bokeh currently has some minimal theming ability, that can specify properties
for types. It would be useful to have more targets and sophisticated ways to
theme individual objects, or collections of objects. Additionally some work is
needed to improve or create visual assets that work with different themes, and
to make DOM elements easily themeable as well.

Visual Design improvements
==========================

Bokeh has never had the benefit of any dedicated web or visual designers, and
this is one area where it suffers compared to some other projects. Visually, it
looks much less "designed by engineers" than it used to, there is still much
room for improvement. Another idea, if *Better Theming Support* is accomplished
is to have visual designers help create a set of attractive themes that can be
immediately available to users.

Smooth Animations and Transitions
=================================

Some users have expressed interest in the ability to make different views of a
plot transform smoothly from one state to another. (Compare to "tween"
animations in R/GGplot). This would afford the ability to create visually
attractive "data stories" by scripting smooth transitions that connect one view
of data to another.

Simple RPC mechanism
====================

Bokeh currently allows for users to execute JavaScript code or Python code in
response to data changes or various UI events. Some users have requests a more
direct "simple remote procedure" capability that would enable them to e.g.
execute a JavaScript function directly from Python in a Bokeh server application
or vice versa.

Technical Writing Assistance
============================

The Bokeh documentation has grown quite large and has much information, but it
seems to be the case that many users still have difficulty finding the
appropriate documentation or examples, even when they exist. The project would
benefit greatly from experienced help to organize the information architecture
of the docs, point out missing areas, etc.

Patches with Holes
==================

Currently Bokeh can draw polygonal patch (or multi-patch) glyphs, but these may
not have "holes" in them. Adding support for Patches with Holes is needed to
better support various kinds of scientific plots (e.g. contour plots) as well
as to better support certain types of Geo/GIS usage.

Built-in LaTeX / MathText support
=================================

Bokeh can display mathematical symbols and formulas by creating and using custom
extensions. Users have expressed a desire for this capability to be more
directly integrated, e.g to draw math text for axis or tick labels, wihtout
needing to resort to a custom extension.

Selection and Hover
===================

Bokeh supports various sorts of hit testing for selection and hover on a
per-glyph basis. It would be good to make support more uniform by adding the
requisite hit testing wherever it is currently missing. Additionally Bokeh needs
a policy-based mechanism for dealing with "multiple hits" i.e. if the mouse
hovers over 50 points, a way to show just one, or just the top N, or even some
aggregation or summary as the hover.

Namespace Variables
===================

It would be very useful for users to be able to synchronize and manipulate
arbitrary data / variables across the Bokeh/BokehJS boundary. Currently only
DataSource columns and defined properties are available.

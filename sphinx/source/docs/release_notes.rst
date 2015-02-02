.. _release_notes_roadmap:

Release Notes and Roadmap
#########################

.. _release_notes:

Release Notes
=============

.. toctree::
    :maxdepth: 1

    releases/0.7.1.rst
    releases/0.7.0.rst
    releases/0.6.1.rst
    releases/0.6.0.rst
    releases/0.5.2.rst
    releases/0.5.1.rst
    releases/0.5.0.rst
    releases/0.4.4.rst
    releases/0.4.2.rst
    releases/0.4.1.rst
    releases/0.4.0.rst
    releases/0.3.0.rst
    releases/0.2.0.rst
    releases/0.1.0.rst

.. _roadmap:

Roadmap
=======

0.8.0 Goals (February 2015)
---------------------------

* R language binding
* server/widget/AR examples in gallery
* more charts
* CLI interface

  - streaming stocks plot
  - simple CLI examples

* Blaze integration

  - volume slicer
  - line downsampling
  - abstract rendering
  - crossfilter


Long-term TODO List
-------------------

Core Plotting
~~~~~~~~~~~~~

* BokehJS interface
* Backbuffering
* CSS styling/theming mechanism
* New layout capabilities

  - multiple axes
  - colorbar axes
  - plot (e.g., histogram axes)
  - better grid plots
  - improved annotations and legends

* Line and patch point hit testing
* Python -> JS function reflection

  - tool callbacks
  - animation
  - computed columns (e.g., jitter, colormapping, offsets)

* Better map projections
* Animation framework
* Improve rendering loop performance in BokehJS
* improved ticking & tick formatting
  - abbreviated ticking: 10:00   :05   :10  etc.
  - lat/long axes
  - explicit ticking

* Annotations

  - arrows
  - axis hover tooltips
  - data tooltips

* Graphs/trees
* GIS integrations
* Map projections
* Better save capability
* Offscreen render using Node.js
* Abstract Rendering server
* Publishing support for bokeh-server
* LaTeX support

Backends
~~~~~~~~

* More efficient binary data transfers to BokehJS
* Check compatibility with mobile browsers
* Streaming data sources
* Public cloud service


Interactions
~~~~~~~~~~~~


Docs & Testing
~~~~~~~~~~~~~~

* tests:

  - Unit tests,
  - image comparisons
  - regression tests
  - selenium UI test

* better docs/interactive gallery
* demo improvements

  * code simplification
  * option for static page generation
  * more demos


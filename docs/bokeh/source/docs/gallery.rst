:notoc:
:html_theme.sidebar_secondary.remove:

.. _gallery:

Gallery
#######

Explore interactive plots and their source code by category.
:ref:`Browse or search all examples <example_index>`.

.. tab-set::
    :class: bk-gallery-tabs

    .. tab-item:: Basic plotting
        :name: basic-plotting

        .. bokeh-gallery::

            basic/scatters
            basic/lines
            basic/data
            basic/axes
            basic/bars
            basic/areas
            basic/layouts
            basic/annotations

    .. tab-item:: Appearance
        :name: appearance

        .. bokeh-gallery::

            styling/plots
            styling/mathtext
            styling/themes

        ..  styling/visuals

    .. tab-item:: Topic guides
        :name: topic-guides

        .. bokeh-gallery::

            topics/images
            topics/contour
            topics/hex
            topics/categorical
            topics/hierarchical
            topics/geo
            topics/graph
            topics/timeseries
            topics/pie
            topics/stats

    .. tab-item:: Interaction
        :name: interaction

        Bokeh has many interactive tools and widgets. Only a subset have
        thumbnails here. For more information see the :ref:`ug_interaction`
        chapter of the users guide.

        .. bokeh-gallery::

            interaction/tools
            interaction/linking
            interaction/legends
            interaction/js_callbacks
            interaction/widgets

        .. interaction/python_callbacks
        .. interaction/tooltips

    .. tab-item:: Bokeh server
        :name: bokeh-server

        The thumbnails in this section link to live demos hosted at
        `demo.bokeh.org`_.

        .. bokeh-gallery::

            server/app

.. _demo.bokeh.org: https://demo.bokeh.org

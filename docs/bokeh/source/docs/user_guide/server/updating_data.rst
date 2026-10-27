.. _ug_server_updating_data:
.. _ug_server_apps_callbacks:

Updating data
=============

Callbacks update the models in a session's document. The same callback APIs
work in module apps and script apps.

Widget and event callbacks
--------------------------

Use ``model.on_change("property", callback)`` for property changes and
``model.on_event(event, callback)`` for events. A button also provides
``on_click(callback)``.

See :bokeh-tree:`examples/server/module_apps/getting_started/respond_to_events`
and :bokeh-tree:`examples/server/module_apps/getting_started/adjust_plot_with_sliders`.

Stream and patch
----------------

Use ``ColumnDataSource.stream()`` to append rows. Set ``rollover`` to bound the
number of rows retained. Use ``patch()`` to replace selected values without
sending the entire data source.

* :bokeh-tree:`examples/server/module_apps/updating_data/stream_data` streams
  one point at a time with a fixed rollover.
* :bokeh-tree:`examples/server/module_apps/updating_data/patch_data` patches
  existing arrays.

Periodic updates and batching
-----------------------------

``doc.add_periodic_callback(callback, period)`` schedules a callback at a period
in milliseconds. ``add_timeout_callback`` runs once after a delay.
``add_next_tick_callback`` schedules work on the document's event loop.
Remove a callback when it is no longer needed.

``doc.hold()`` collects changes until ``doc.unhold()``. See
:bokeh-tree:`examples/server/module_apps/updating_data/batch_document_updates`.
The contour and Fourier examples in the same directory use periodic updates.

For a producer shared by several sessions, see
:ref:`ug_server_shared_data`. That section covers startup, cleanup and updates
to independent session documents.

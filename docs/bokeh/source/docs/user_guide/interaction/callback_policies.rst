.. _ug_interaction_callback_policies:

Controlling property callback frequency
=======================================

Rapid browser interactions can otherwise run a JavaScript callback and send a
browser-to-server update for every property change. The ``on_change`` and
``js_on_change`` methods accept callback delivery policies that reduce this
work while leaving browser-side model state and rendering immediate.

.. list-table::
    :header-rows: 1
    :widths: 16 42 42

    * - Policy
      - Changes delivered to callbacks
      - Typical use
    * - Immediate
      - Every change
      - Inexpensive callbacks that need every value
    * - Throttle
      - The first change, periodic latest values, and the final value
      - Live previews during rapid interaction
    * - Debounce
      - The final value after changes stop
      - Search boxes and other pause-triggered work
    * - Committed
      - The final value when an active widget interaction finishes
      - Expensive slider or spinner recomputation

For example, throttle a slider to one update per 100 milliseconds:

.. code-block:: python

    from bokeh.model import Committed, Debounce, Throttle

    slider.on_change("value", update, policy=Throttle(100))

The same policies are available to JavaScript callbacks:

.. code-block:: python

    slider.js_on_change(
        "value",
        CustomJS(code="console.log(cb_obj.value)"),
        policy=Throttle(100),
    )

Throttling uses leading and trailing updates: it delivers the first value
immediately, then at most one latest value per interval, including the final
value. Debouncing is trailing-only: it waits for changes to stop and delivers
only the final value:

.. code-block:: python

    search.on_change("value", query, policy=Debounce(250))

Sliders and spinners can instead defer changes made during an active
interaction until it finishes:

.. code-block:: python

    slider.js_on_change("value", update_on_release, policy=Committed())

Timed intervals are in milliseconds. A policy applies only to the callbacks
registered in that call. This allows several delivery streams for one
property, including the common combination of a continuous callback and a
committed callback:

.. code-block:: python

    slider.on_change("value", update_preview)
    slider.on_change("value", expensive_update, policy=Committed())

Python and JavaScript callbacks can use different policies in the same way.
The same Python callable or ``CustomJS`` object can also be registered more
than once with different policies, which directly replaces registering it on
both ``value`` and ``value_throttled``. For Python callbacks,
``remove_on_change()`` removes all registrations of the given callback for
that property.

Browser-side model state, rendering, and internal BokehJS signal handlers
remain immediate. A JavaScript callback's policy applies to every property
change it observes, including changes received from a Python server. A Python
callback's policy controls browser-to-server delivery; property changes made
directly in Python still invoke registered Python callbacks immediately. This
includes assignments made inside another Python callback, so validation or
normalization callbacks can cause callbacks with other policies to run before
the browser interaction finishes.

Delaying browser-to-server delivery also means that the property value in the
server session remains at its last delivered value until the policy delivers
an update. Other Python callbacks, periodic callbacks, and request handlers
that read the property during that interval therefore see that earlier value.

The ``old`` and ``new`` arguments to Python callbacks reflect that callback's
delivered stream; skipped intermediate values are not observed. Omitting
``policy`` preserves immediate delivery. Create policy values with
``Throttle(milliseconds)``, ``Debounce(milliseconds)``, or ``Committed()``.

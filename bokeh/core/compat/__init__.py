''' Implement compatibility between Bokeh and Matplotlib.

All of the functions and classes in ``bokeh.core.compat`` are internal
implementation details, and not user-facing. For information on the public
API for MPL compatibility, see :ref:`bokeh.mpl`.

**THIS MODULE IN ITS CURRENT FORM IS NO LONGER MAINTAINED**

.. warning::

    Currently, compatibility is implemented using the third-party
    `mplexporter`_ library. This library does not provide a full interface
    to all of Matplotlib functionality, and is no longer being actively
    maintained. Accordingly Bokeh's Matplotlib compatibility is extremely
    limited.

    A full JSON serialization interface for Matplotlib is being planned in
    `MEP25`_. When this proposal is implemented is completed, work can
    proceed on a more comprehensive and maintainable integration. Until
    that time, no further improvements or fixes are planned for Bokeh MPL
    integration, and it is provided AS-IS, in case it happens to be useful.

.. _MEP25: https://github.com/matplotlib/matplotlib/wiki/MEP25
.. _mplexporter: https://github.com/mpld3/mplexporter/tree/master/mplexporter

'''

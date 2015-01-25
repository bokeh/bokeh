from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import Bool
from ..embed import notebook_div

class Widget(PlotObject):
    """ A base class for all interact widget types. ``Widget``
    is not generally useful to instantiate on its own.

    """

    disabled = Bool(False, help="""
    If ``True``, the widget is made disabled and will not respond to
    UI events.
    """)

    # XXX: Not yet, because it breaks plotting/notebook examples.
    # Rename to _repr_html_ if we decide to enable this by default.
    def __repr_html__(self):
        return notebook_div(self)

    @property
    def html(self):
        from IPython.core.display import HTML
        return HTML(self.__repr_html__())

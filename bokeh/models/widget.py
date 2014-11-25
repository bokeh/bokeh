from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import Bool
from ..embed import notebook_div

class Widget(PlotObject):
    disabled = Bool(False)

    # XXX: Not yet, because it breaks plotting/notebook examples.
    # Rename to _repr_html_ if we decide to enable this by default.
    def __repr_html__(self):
        return notebook_div(self)

    @property
    def html(self):
        from IPython.core.display import HTML
        return HTML(self.__repr_html__())

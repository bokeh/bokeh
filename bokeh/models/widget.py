from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import Bool
from ..embed import notebook_div

class Widget(PlotObject):
    disabled = Bool(False)

    def _repr_html_(self):
        return notebook_div(self)

    @property
    def html(self):
        from IPython.core.display import HTML
        return HTML(self._repr_html_())

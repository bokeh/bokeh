from __future__ import absolute_import

from ..model import Model
from ..properties import abstract
from ..properties import Bool
from ..embed import notebook_div

@abstract
class Component(Model):
    """ A base class for all embeddable models, i.e. plots and wigets. """

    disabled = Bool(False, help="""
    Whether the widget will be disabled when rendered. If ``True``,
    the widget will be greyed-out, and not respond to UI events.
    """)

    # TODO: (mp) Not yet, because it breaks plotting/notebook examples.
    # Rename to _repr_html_ if we decide to enable this by default.
    def __repr_html__(self):
        return notebook_div(self)

    @property
    def html(self):
        from IPython.core.display import HTML
        return HTML(self.__repr_html__())

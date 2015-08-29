from __future__ import absolute_import

from bokeh.properties import HasProps, Instance, List, String
from bokeh.models import GlyphRenderer


class Operation(HasProps):
    renderers = List(Instance(GlyphRenderer))
    name = String()
    method_name = String()

    def _apply(self):
        if len(self.renderers) > 0:
            for renderer in self.renderers:
                renderer
        else:
            raise AttributeError('%s must be applied to available renderers, none found.' %
                                 self.__class__.__name__)


class Stack(HasProps):
    name = 'stack'
    method_name = '__stack__'

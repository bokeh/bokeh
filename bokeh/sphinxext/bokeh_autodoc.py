""" Integrate Bokeh extensions into Sphinx autodoc.

Ensures that autodoc directives such as ``autoclass`` automatically
use Bokeh-specific directives (e.g., ``bokeh-prop`` and ``bokeh-model``)
when appropriate.

"""
from __future__ import absolute_import

from six import class_types
from sphinx.ext.autodoc import AttributeDocumenter, ClassDocumenter

from bokeh.plot_object import PlotObject
from bokeh.properties import Property

class PropDocumenter(AttributeDocumenter):
    directivetype = 'bokeh-prop'
    objtype = 'prop'
    priority = 20 # prefer over default autoattribute directive

    @classmethod
    def can_document_member(cls, member, membername, isattr, parent):
        # MetaHasProps creates instances even if user just
        # supplies property class name
        return isinstance(member, Property)

    def add_directive_header(self, sig):
        # Note: we are supplying our own version of this function because
        # bokeh-model should not be passed `sig` as an argument, and there is
        # no way to suppress this behaviour in the default version
        domain = getattr(self, 'domain', 'py')
        directive = getattr(self, 'directivetype', self.objtype)
        name = self.format_name()
        self.add_line(u'.. %s:%s:: %s.%s' % (domain, directive, self.modname, name),
                      '<autodoc>')
        if self.options.noindex:
            self.add_line(u'   :noindex:', '<autodoc>')

class ModelDocumenter(ClassDocumenter):
    directivetype = 'bokeh-model'
    objtype = 'model'
    priority = 20 # prefer over default autoclass directive

    @classmethod
    def can_document_member(cls, member, membername, isattr, parent):
        return isinstance(member, class_types) and issubclass(member, PlotObject)

    def add_directive_header(self, sig):
        # Note: we are supplying our own version of this function because
        # bokeh-model should not be passed `sig` as an argument, and there is
        # no way to suppress this behaviour in the default version
        domain = getattr(self, 'domain', 'py')
        directive = getattr(self, 'directivetype', self.objtype)
        name = self.format_name()
        self.add_line(u'.. %s:%s:: %s.%s' % (domain, directive, self.modname, name),
                      '<autodoc>')
        if self.options.noindex:
            self.add_line(u'   :noindex:', '<autodoc>')


def setup(app):
    app.add_autodocumenter(PropDocumenter)
    app.add_autodocumenter(ModelDocumenter)

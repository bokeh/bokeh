""" Integrate Bokeh extensions into Sphinx autodoc.

Ensures that autodoc directives such as ``autoclass`` automatically
use Bokeh-specific directives (e.g., ``bokeh-prop`` and ``bokeh-model``)
when appropriate.

"""
from __future__ import absolute_import, print_function

from six import class_types
from sphinx.ext.autodoc import AttributeDocumenter, ClassDocumenter

from bokeh.model import Model
from bokeh.properties import Property

def _add_directive_header(self, sig):
    # Note: we are supplying our own version of this function because
    # our directives should not be passed `sig` as an argument, and there
    # is no way to suppress this behavior in the default version
    domain = getattr(self, 'domain', 'py')
    directive = getattr(self, 'directivetype', self.objtype)
    name = self.format_name()
    self.add_line(u'.. %s:%s:: %s.%s' % (domain, directive, self.modname, name),
                  '<autodoc>')
    if self.options.noindex:
        self.add_line(u'   :noindex:', '<autodoc>')

class PropDocumenter(AttributeDocumenter):
    directivetype = 'bokeh-prop'
    objtype = 'prop'
    priority = 20

    @classmethod
    def can_document_member(cls, member, membername, isattr, parent):
        return isinstance(member, Property)

    add_directive_header = _add_directive_header

class ModelDocumenter(ClassDocumenter):
    directivetype = 'bokeh-model'
    objtype = 'model'
    priority = 20

    @classmethod
    def can_document_member(cls, member, membername, isattr, parent):
        return isinstance(member, class_types) and issubclass(member, Model)

    add_directive_header = _add_directive_header

def setup(app):
    app.add_autodocumenter(PropDocumenter)
    app.add_autodocumenter(ModelDocumenter)

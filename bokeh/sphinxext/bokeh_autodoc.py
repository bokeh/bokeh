""" Integrate Bokeh extensions into Sphinx autodoc.

Ensures that autodoc directives such as ``autoclass`` automatically
use Bokeh-specific directives (e.g., ``bokeh-prop`` and ``bokeh-model``)
when appropriate.

"""
from __future__ import absolute_import, print_function

from six import class_types
from sphinx.ext.autodoc import AttributeDocumenter, ClassDocumenter, ModuleLevelDocumenter

from bokeh.model import Model
from bokeh.core.enums import Enumeration
from bokeh.core.property.descriptors import PropertyDescriptor

class EnumDocumenter(ModuleLevelDocumenter):
    directivetype = 'bokeh-enum'
    objtype = 'enum'
    priority = 20

    @classmethod
    def can_document_member(cls, member, membername, isattr, parent):
        return isinstance(member, Enumeration)

class PropDocumenter(AttributeDocumenter):
    directivetype = 'bokeh-prop'
    objtype = 'prop'
    priority = 20

    @classmethod
    def can_document_member(cls, member, membername, isattr, parent):
        return isinstance(member, PropertyDescriptor)

class ModelDocumenter(ClassDocumenter):
    directivetype = 'bokeh-model'
    objtype = 'model'
    priority = 20

    @classmethod
    def can_document_member(cls, member, membername, isattr, parent):
        return isinstance(member, class_types) and issubclass(member, Model)

def setup(app):
    app.add_autodocumenter(EnumDocumenter)
    app.add_autodocumenter(PropDocumenter)
    app.add_autodocumenter(ModelDocumenter)

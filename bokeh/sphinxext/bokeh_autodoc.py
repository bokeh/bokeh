""" Integrate Bokeh extensions into Sphinx autodoc.

Ensures that autodoc directives such as ``autoclass`` automatically
use Bokeh-specific directives (e.g., ``bokeh-prop`` and ``bokeh-model``)
when appropriate.

"""
from __future__ import absolute_import, print_function

from six import class_types
from sphinx.ext.autodoc import AttributeDocumenter, ClassDocumenter

from bokeh.model import Model
from bokeh.core.properties import Property

class PropDocumenter(AttributeDocumenter):
    directivetype = 'bokeh-prop'
    objtype = 'prop'
    priority = 20

    @classmethod
    def can_document_member(cls, member, membername, isattr, parent):
        return isinstance(member, Property)

class ModelDocumenter(ClassDocumenter):
    directivetype = 'bokeh-model'
    objtype = 'model'
    priority = 20

    @classmethod
    def can_document_member(cls, member, membername, isattr, parent):
        return isinstance(member, class_types) and issubclass(member, Model)

def setup(app):
    app.add_autodocumenter(PropDocumenter)
    app.add_autodocumenter(ModelDocumenter)

""" Utilities for writing plugins.

This is different from bokeh.pluginutils because these are ways of
patching routes and objects directly into the bokeh server. You
would run this type of code using the --script option

"""

from __future__ import absolute_import

import uuid

from flask import abort, render_template

from bokeh.exceptions import DataIntegrityException
from bokeh.resources import Resources

from ..app import bokeh_app
from ..views.backbone import init_bokeh
from ..views.main import _makedoc
from ..settings import settings as server_settings

def object_page(prefix):
    """ Decorator for a function which turns an object into a web page

    from bokeh.server.app import bokeh_app
    @bokeh_app.route("/myapp")
    @object_page("mypage")
    def make_object():
        #make some bokeh object here
        return obj

    This decorator will
      - create a randomized title for a bokeh document using the prefix
      - initialize bokeh plotting libraries to use that document
      - call the function you pass in, add that object to the plot context
      - render that object in a web page

    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            ## setup the randomly titled document
            docname = prefix + str(uuid.uuid4())
            bokehuser = bokeh_app.current_user()
            try:
                doc = _makedoc(bokeh_app.servermodel_storage, bokehuser, docname)
                doc.published = True
                doc.save(bokeh_app.servermodel_storage)
            except DataIntegrityException as e:
                return abort(409, e.message)
            docid = doc.docid
            clientdoc = bokeh_app.backbone_storage.get_document(docid)

            ## initialize our plotting APIs to use that document

            init_bokeh(clientdoc)
            obj = func(*args, **kwargs)
            clientdoc.add(obj)
            bokeh_app.backbone_storage.store_document(clientdoc)
            if hasattr(obj, 'extra_generated_classes'):
                extra_generated_classes = obj.extra_generated_classes
            else:
                extra_generated_classes = []

            resources = Resources()
            return render_template("oneobj.html",
                                   elementid=str(uuid.uuid4()),
                                   docid=docid,
                                   objid=obj._id,
                                   hide_navbar=True,
                                   extra_generated_classes=extra_generated_classes,
                                   splitjs=server_settings.splitjs,
                                   public='true',
                                   loglevel=resources.log_level)
        wrapper.__name__ = func.__name__
        return wrapper

    return decorator

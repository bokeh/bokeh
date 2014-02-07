from ..app import bokeh_app
from .bbauth import (check_read_authentication_and_create_client,
                    check_write_authentication_and_create_client)

#@bokeh_app.route("/bokeh/bb/<docid>/reset", methods=['GET'])
#@check_write_authentication_and_create_client
# def reset(docid):
#     doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
#     sess = bokeh_app.backbone_storage.get_session(docid)        
#     sess.load_all()
#     for m in sess._models:
#         if not m.typename.endswith('PlotContext'):
#             sess.del_obj(m)
#         else:
#             m.children = []
#             sess.store_obj(m)
#     return 'success'

@app.route("/bokeh/data", methods=['GET'])
def list_data_sources():
    return bokeh_app.datamanager.list_data_sources()

@app.route("/bokeh/data/<data_url:path>", methods=['GET'])
def get_data(data_url):
    """
    get data, subject to query parameters
    this is also used to retrieve the data descriptor (columns) as well as 
    compute downsampling
    """
    return bokeh_app.datamanager.get_data(data_url)

@app.route("/bokeh/data/<data_url:path>", methods=['PATCH'])
def append_data(data_url):
    """
    create/append data
    """
    return bokeh_app.datamanager.append_data(data_url)



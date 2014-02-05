from flask import jsonify

from ..app import bokeh_app

@bokeh_app.route("/bokeh/data/<username>", methods=['GET'])
def list_sources(username):
    bokehuser = bokeh_app.authentication.current_user()
    request_username = bokehuser.username
    sources = bokeh_app.datamanager.list_data_sources(request_username, 
                                                      username)
    return jsonify(sources=sources)

    

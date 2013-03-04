from flask import current_app
def make_json(jsonstring):
    """like jsonify, except accepts string, so we can do our own custom
    json serialization.  should move this to continuumweb later
    """
    return current_app.response_class(jsonstring,
                                      mimetype='application/json')



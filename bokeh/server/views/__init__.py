from __future__ import absolute_import

from flask import current_app

def make_json(jsonstring, status_code=200, headers={}):
    """ Like jsonify, except accepts string, so we can do our own custom
    json serialization.  should move this to continuumweb later
    """
    return current_app.response_class(
        response=jsonstring,
        status=status_code,
        headers=headers,
        mimetype='application/json'
    )

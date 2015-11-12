import numpy as np

from datetime import timedelta
from functools import update_wrapper, wraps
from six import string_types

from bokeh.plotting import figure, show, output_file
from bokeh.models.sources import AjaxDataSource

output_file("ajax_source_realtime.html", title="ajax_source_realtime.py example")
source = AjaxDataSource(data_url='http://localhost:5050/data', mode="append",
                        if_modified=True, polling_interval=1000, max_size=125)
p = figure()
p.line('x', 'y', source=source)

import time
from threading import Thread
from collections import namedtuple, deque
import json

Entry = namedtuple('Entry', ['x', 'y', 'creation'])

entries = deque(maxlen=120)

def gen_entry():
    global entries
    x = 0
    while True:
        last_entry = Entry(x, np.sin(x*np.pi/10), time.time())
        entries.append(last_entry)
        x += 1
        if x > entries.maxlen and x % 10 == 0:
            time.sleep(2)



try:
    from flask import Flask, jsonify, make_response, request, current_app, Response
except ImportError:
    raise ImportError("You need Flask to run this example!")

t = Thread(target=gen_entry)
t.daemon = True
t.start()

show(p)

#########################################################
# Flask server related
#
# The following code has no relation to bokeh and it's only
# purpose is to serve data to the AjaxDataSource instantiated
# previously. Flask just happens to be one of the python
# web frameworks that makes it's easy and concise to do so
#########################################################

def crossdomain(origin=None, methods=None, headers=None,
                max_age=21600, attach_to_all=True,
                automatic_options=True):
    """
    Decorator to set crossdomain configuration on a Flask view

    For more details about it refer to:

    http://flask.pocoo.org/snippets/56/
    """
    if methods is not None:
        methods = ', '.join(sorted(x.upper() for x in methods))

    if headers is not None and not isinstance(headers, string_types):
        headers = ', '.join(x.upper() for x in headers)

    if not isinstance(origin, string_types):
        origin = ', '.join(origin)

    if isinstance(max_age, timedelta):
        max_age = max_age.total_seconds()

    def get_methods():
        return methods
        options_resp = current_app.make_default_options_response()
        return options_resp.headers['allow']

    def decorator(f):
        @wraps(f)
        def wrapped_function(*args, **kwargs):
            if automatic_options and request.method == 'OPTIONS':
                resp = current_app.make_default_options_response()
            else:
                resp = make_response(f(*args, **kwargs))
            if not attach_to_all and request.method != 'OPTIONS':
                return resp

            h = resp.headers

            h['Access-Control-Allow-Origin'] = origin
            h['Access-Control-Allow-Methods'] = get_methods()
            h['Access-Control-Max-Age'] = str(max_age)
            requested_headers = request.headers.get(
                'Access-Control-Request-Headers'
            )
            if headers is not None:
                h['Access-Control-Allow-Headers'] = headers
            elif requested_headers :
                h['Access-Control-Allow-Headers'] = requested_headers
            return resp
        f.provide_automatic_options = False
        return update_wrapper(wrapped_function, f)

    return decorator

app = Flask(__name__)

@app.route('/data', methods=['GET', 'OPTIONS', 'POST'])
@crossdomain(origin="*", methods=['GET', 'POST'])
def hello_world():
    global entries
    try:
        modified_since = float(request.headers.get('If-Modified-Since'))
    except TypeError:
        modified_since = 0

    new_entries = [e for e in entries if e.creation > modified_since]
    js = json.dumps({'x':[e.x for e in new_entries], 'y':[e.y for e in new_entries]})
    resp = Response(js, status=200, mimetype='application/json')

    if new_entries:
        resp.headers['Last-Modified'] = new_entries[-1].creation
    elif modified_since:
        resp.headers['Last-Modified'] = modified_since

    return resp

if __name__ ==  "__main__":
    app.run(port=5050)

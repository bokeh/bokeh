import numpy as np

from bokeh.plotting import figure, show, output_file
from bokeh.models.sources import AjaxDataSource

output_file("ajax_source_realtime.html", title="ajax_source_realtime.py example")
source = AjaxDataSource(data_url='http://localhost:5050/data', mode="append",
                        if_modified=True, polling_interval=1000, max_size=125)
p = figure()
p.line('x', 'y', source=source)
show(p)

import time
from threading import Thread
from collections import namedtuple, deque

Entry = namedtuple('Entry', ['x', 'y', 'creation'])

entries = deque(maxlen=120)

def gen_entry():
    global entries
    x = 0
    while True:
        last_entry = Entry(x, np.sin(x*np.pi/10), time.time())
        entries.append(last_entry)
        print("Entry generated: %s" % str(last_entry))
        x += 1
        if x > entries.maxlen and x % 10 == 0:
            time.sleep(2)

t = Thread(target=gen_entry)
t.daemon = True
t.start()

import json
from flask import Flask, Response, request
from bokeh.server.crossdomain import crossdomain

app = Flask(__name__)

@app.route('/data', methods=['GET', 'OPTIONS'])
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

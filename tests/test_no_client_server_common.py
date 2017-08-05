from __future__ import print_function

import subprocess

basic_imports = [
    "import bokeh.charts",  # TODO (bev) remove at 1.0
    "import bokeh.embed",
    "import bokeh.io",
    "import bokeh.models",
    "import bokeh.plotting",
]

def test_no_tornado_common():
    code = "import sys; %s; sys.exit(1 if any(('bokeh.client' in x or 'bokeh.server' in x) for x in sys.modules.keys()) else 0)"
    proc = subprocess.Popen(["python", "-c", code % ";".join(basic_imports)],stdout=subprocess.PIPE)
    proc.wait()
    if proc.returncode != 0:
        assert False

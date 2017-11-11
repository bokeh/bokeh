from __future__ import print_function

import subprocess

basic_imports = [
    "import bokeh.application",
    "import bokeh.client",
    "import bokeh.embed",
    "import bokeh.io",
    "import bokeh.models",
    "import bokeh.plotting",
    "import bokeh.server",
]

def test_no_ipython_common():
    proc = subprocess.Popen([
        "python", "-c", "import sys; %s; sys.exit(1 if any('IPython' in x for x in sys.modules.keys()) else 0)" % ";".join(basic_imports)
    ],stdout=subprocess.PIPE)
    out, errs = proc.communicate()
    proc.wait()
    if proc.returncode != 0:
        assert False

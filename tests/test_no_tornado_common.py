from __future__ import print_function

import subprocess

basic_imports = [
    "import bokeh.charts",
    "import bokeh.client",
    "import bokeh.embed",
    "import bokeh.io",
    "import bokeh.models",
    "import bokeh.plotting",
]

def test_no_tornado_common():
    proc = subprocess.Popen([
        "python", "-c", "import sys; %s; sys.exit(1 if any('tornado' in x for x in sys.modules.keys()) else 0)" % ";".join(basic_imports)
    ],stdout=subprocess.PIPE)
    out, errs = proc.communicate()
    proc.wait()
    if proc.returncode != 0:
        assert False

from __future__ import print_function

import os
import subprocess

def test_python_execution_with_OO():

    # running python with -OO will discard docstrings -> __doc__ is None
    # We have this test to make sure that the deployed code will still run.

    # If you ever encounter a new problem with docstrings being formatted try using format_docstring.

    imports = []
    for path, dirs, files in os.walk("bokeh"):

        if "tests" in path: continue

        for file in files:
            if not file.endswith(".py"):
                continue
            if file.endswith("__main__.py"):
                continue

            if file.endswith("__init__.py"):
                mod = path.replace("/", ".")
            else:
                mod = path.replace("/", ".") + "." + file[:-3]

            imports.append("import " + mod)

    test_env = os.environ.copy()
    test_env['BOKEH_DOCS_MISSING_API_KEY_OK'] = 'yes'

    proc = subprocess.Popen(["python", "-OO", "-c", ";".join(imports), ''], stdout=subprocess.PIPE, env=test_env)
    out, errs = proc.communicate()
    proc.wait()

    if proc.returncode != 0:
        assert False

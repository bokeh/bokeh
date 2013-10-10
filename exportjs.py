#!/usr/bin/env python
import shutil
import subprocess

subprocess.check_call(
    "hem build -d -s slug.json",
    shell=True,
    cwd="bokeh/server"
)
shutil.copy("bokeh/server/static/js/application.js", "jsbuild/application.js")

# subprocess.check_call(
#     "hem build -d -s slug.notebook.json",
#     shell=True,
#     cwd="bokeh/server"
# )
# shutil.copy("bokeh/server/static/js/bokehnotebook.js", "jsbuild/bokehnotebook.js")



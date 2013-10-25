#!/usr/bin/env python
import shutil
import subprocess

subprocess.check_call(
    "hem build -d -s slug.json",
    shell=True,
    cwd="bokeh/server"
)
in_ = open("bokeh/server/static/js/application.js").read()
in_ += open("bokeh/server/static/js/post_application.js").read()
open("bokeh/server/static/js/application.js", "w").write(in_)

shutil.copy("bokeh/server/static/js/application.js", "jsbuild/application_tmp.js")






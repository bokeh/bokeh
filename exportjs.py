#!/usr/bin/env python
import argparse
import shutil
from os.path import join
import subprocess

parser = argparse.ArgumentParser("export js to your local bokehjs-build repo")
parser.add_argument("path", help="path to bokehjs-build repo")
args = parser.parse_args()

subprocess.check_call("hem build -d -s slug.json",
                 shell=True, cwd="bokeh/server")
shutil.copy("bokeh/server/static/js/application.js", args.path)

# subprocess.check_call("hem build -s slug.json",
#                  shell=True, cwd="bokeh/server")
# shutil.copy("bokeh/server/static/js/application.js",
#             join(args.path, "application.min.js"))
            
subprocess.check_call("hem build -d -s slug.notebook.json",
                 shell=True, cwd="bokeh/server")
shutil.copy("bokeh/server/static/js/bokehnotebook.js", args.path)

# subprocess.check_call("hem build -s slug.notebook.json",
#                  shell=True, cwd="bokeh/server")
# shutil.copy("bokeh/server/static/js/bokehnotebook.js",
#             join(args.path, "bokehnotebook.min.js"))




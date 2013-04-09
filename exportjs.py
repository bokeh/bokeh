#!/usr/bin/env python
import argparse
import shutil
from os.path import join
import subprocess
import json
import boto
    
subprocess.check_call("hem build -d -s slug.json",
                 shell=True, cwd="bokeh/server")
shutil.copy("bokeh/server/static/js/application.js", "jsbuild/application.js")
# subprocess.check_call("hem build -s slug.json",
#                  shell=True, cwd="bokeh/server")
subprocess.check_call("hem build -d -s slug.notebook.json",
                 shell=True, cwd="bokeh/server")
shutil.copy("bokeh/server/static/js/bokehnotebook.js", "jsbuild/bokehnotebook.js")
# subprocess.check_call("hem build -s slug.notebook.json",
#                  shell=True, cwd="bokeh/server")



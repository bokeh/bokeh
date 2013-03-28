#!/usr/bin/env python
import argparse
import shutil
from os.path import join
import subprocess
import json
import boto
    
parser = argparse.ArgumentParser("export js to your s3")
parser.add_argument("path", help="path to s3 keys")
args = parser.parse_args()
with open(args.path) as f:
    keys = json.load(f)
from boto.s3.connection import S3Connection
from boto.s3.key import Key
conn = S3Connection(keys['AWS_ACCESS_KEY'], keys['AWS_SECRET_KEY'])
bucket = conn.get_bucket('bokeh-builds')

subprocess.check_call("hem build -d -s slug.json",
                 shell=True, cwd="bokeh/server")
k = Key(bucket)
k.key = "/application.js"
k.set_contents_from_filename("bokeh/server/static/js/application.js")
bucket.set_acl('public-read', k.key)

# subprocess.check_call("hem build -s slug.json",
#                  shell=True, cwd="bokeh/server")
subprocess.check_call("hem build -d -s slug.notebook.json",
                 shell=True, cwd="bokeh/server")
k = Key(bucket)
k.key = "/bokehnotebook.js"
k.set_contents_from_filename("bokeh/server/static/js/bokehnotebook.js")
bucket.set_acl('public-read', k.key)

# subprocess.check_call("hem build -s slug.notebook.json",
#                  shell=True, cwd="bokeh/server")



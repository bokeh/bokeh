from __future__ import absolute_import
import ast, os, copy, subprocess

from bokeh.util.api_crawler import api_crawler, differ


def diff_versions(old_version, new_version, output_file):
    subprocess.call("git stash && git checkout tags/%s -- bokeh" % old_version, shell=True)
    old = api_crawler("bokeh").get_crawl_dict()
    subprocess.call("git checkout tags/%s -- bokeh" % new_version, shell=True)
    new = api_crawler("bokeh").get_crawl_dict()

    # Reset HEAD to initial state.
    subprocess.call("git checkout HEAD -- bokeh", shell=True)
    subprocess.call("git reset HEAD -- bokeh", shell=True)
    subprocess.call("git stash apply", shell=True)

    # Combine items removed and added into a single text file.
    diff = differ(old, new).get_diff()

    with open(output_file, "w") as f:
        for x in diff:
            f.write("%s\n" % x)

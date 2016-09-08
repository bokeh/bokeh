from __future__ import absolute_import
import ast, os, copy, subprocess, sys

from bokeh.util.api_crawler import api_crawler, differ


def diff_versions(old_version, new_version):
    subprocess.check_output("git stash && git checkout tags/%s -- bokeh" % old_version, shell=True)
    old = api_crawler("bokeh").get_crawl_dict()
    subprocess.check_output("git checkout tags/%s -- bokeh" % new_version, shell=True)
    new = api_crawler("bokeh").get_crawl_dict()

    # Reset HEAD to initial state.
    subprocess.check_output("git checkout HEAD -- bokeh", shell=True)
    subprocess.check_output("git reset HEAD -- bokeh", shell=True)
    subprocess.check_output("git stash apply", shell=True)

    # Combine items removed and added into a single text file.
    diff = differ(old, new)
    pretty_diff = "\n".join(diff.get_diff()) + "\n"

    return pretty_diff


if __name__ == "__main__":
    if len(sys.argv) >= 3:
        sys.stdout.write(diff_versions(sys.argv[1], sys.argv[2]))
    else:
        print("Please provide an old version and a new version.")

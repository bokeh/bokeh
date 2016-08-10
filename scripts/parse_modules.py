import ast, os, copy, subprocess

from bokeh.util.api_crawler import api_crawler



def diff_versions(old_version, new_version, output_file):
    subprocess.call("git checkout tags/%s -- bokeh" % old_version, shell=True)
    old = api_crawler("bokeh").get_crawl_dict()
    subprocess.call("git checkout tags/%s -- bokeh" % new_version, shell=True)
    new = api_crawler("bokeh").get_crawl_dict()

    # Reset HEAD to initial state.
    subprocess.call("git checkout HEAD -- bokeh", shell=True)
    subprocess.call("git reset HEAD -- bokeh", shell=True)

    # Combine items removed and added into a single text file.
    removed = api_crawler.diff_modules(old, new)
    added = api_crawler.diff_modules(new, old)
    diff = api_crawler.parse_diff(removed) + api_crawler.parse_diff(added, added=True)

    with open(output_file, "w") as f:
        for x in diff:
            f.write("%s\n" % x)

import json
import re
import sys
from distutils.version import StrictVersion
from glob import glob
from os.path import abspath, basename, dirname, join
from subprocess import PIPE, Popen

TOP = abspath(join(dirname(__file__), ".."))

VERSION = re.compile(r"^(\d+\.\d+\.\d+)$")


def compute_single_hash(path):
    assert path.endswith(".js")

    digest = f"openssl dgst -sha384 -binary {path}".split()
    p1 = Popen(digest, stdout=PIPE)

    b64 = "openssl base64 -A".split()
    p2 = Popen(b64, stdin=p1.stdout, stdout=PIPE)

    out, _ = p2.communicate()
    return out.decode("utf-8").strip()


def compute_hashes_for_paths(paths, version):
    hashes = []
    for path in paths:
        name, suffix = basename(path).split(".", 1)
        filename = f"{name}-{version}.{suffix}"
        sri_hash = compute_single_hash(path)
        hashes.append((filename, sri_hash))
    return dict(sorted(hashes))


def get_current_package_json():
    tmp = json.load(open(join(TOP, "src", "bokeh", "_sri.json")))
    items = sorted(tmp.items(), key=lambda item: StrictVersion(item[0]), reverse=True)
    return {key: dict(val) for key, val in items}


def write_package_json(data):
    with open(join(TOP, "src", "bokeh", "_sri.json"), "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def update_package(version):
    current = get_current_package_json()

    assert (
        version not in current
    ), f"Version {version} already exists in the hash data file"

    paths = glob(join(TOP, "src/bokeh/server/static/js/bokeh*.js"))
    hashes = compute_hashes_for_paths(paths, version)

    new = {version: hashes}
    new.update(current)

    write_package_json(new)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: python sri.py <new-version>")
        sys.exit(1)

    version = sys.argv[1]

    assert VERSION.match(version), f"{version!r} is not a valid Bokeh release version string"

    update_package(version)

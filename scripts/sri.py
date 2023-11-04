import json
import re
import sys
from pathlib import Path
from subprocess import PIPE, Popen

BOKEH = Path(__file__).resolve().parents[1] / "src" / "bokeh"

JS_DIR = BOKEH /  "server" / "static" / "js"

SRI_DIR = BOKEH / "_sri"

VERSION = re.compile(r"^(\d+\.\d+\.\d+)$")


def compute_single_hash(path: Path) -> str:
    digest = f"openssl dgst -sha384 -binary {path}".split()
    p1 = Popen(digest, stdout=PIPE)

    b64 = "openssl base64 -A".split()
    p2 = Popen(b64, stdin=p1.stdout, stdout=PIPE)

    out, _ = p2.communicate()
    return out.decode("utf-8").strip()


def dump_hash_file(version: str) -> None:
    json_path = SRI_DIR / f"{version}.json"

    assert not json_path.exists(), f"{json_path} already exists"

    hashes = {}

    paths = set(JS_DIR.glob("bokeh*.js")) - set(JS_DIR.glob("*.esm.*"))
    for path in paths:
        base, _, suffix = path.name.partition(".")
        hashes[f"{base}-{version}.{suffix}"] = compute_single_hash(path)

    with open(json_path, "w") as f:
        json.dump(dict(sorted(hashes.items())), f, indent=2)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: python sri.py <new-version>")
        sys.exit(1)

    version = sys.argv[1]

    assert VERSION.match(version), f"{version!r} is not a valid Bokeh release version string"

    dump_hash_file(version)

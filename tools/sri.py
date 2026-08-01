# Standard library imports
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
    digest = ["openssl", "dgst", "-sha384", "-binary", str(path)]
    p1 = Popen(digest, stdout=PIPE)

    b64 = ["openssl", "base64", "-A"]
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
        f.write("\n")


def main(argv: list[str] | None = None) -> None:
    argv = sys.argv[1:] if argv is None else argv

    if len(argv) != 1:
        print("usage: python -m tools.sri <new-version>")
        sys.exit(1)

    version = argv[0]

    assert VERSION.match(version), f"{version!r} is not a valid Bokeh release version string"

    dump_hash_file(version)


if __name__ == "__main__":
    main()

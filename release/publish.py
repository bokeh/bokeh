# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
import glob
from io import BytesIO
from subprocess import CalledProcessError
from typing import Any

# External imports
import boto
from packaging.version import Version as V

# Bokeh imports
from .config import Config
from .system import System
from .ui import failed, skipped

__all__ = (
    "publish_anaconda",
    "publish_cdn",
    "publish_docs",
    "publish_npm",
    "publish_pypi",
)


def upload_file_to_cdn(local_path: str, cdn_path: str, content_type: str, bucket: Any, binary: bool = False) -> None:
    print(f":uploading to CDN: {cdn_path}")
    key = boto.s3.key.Key(bucket, cdn_path)
    key.metadata = {"Cache-Control": "max-age=31536000", "Content-Type": content_type}
    if binary:
        data = open(local_path, "rb").read()
    else:
        data = open(local_path).read().encode("utf-8")
    fp = BytesIO(data)
    key.set_contents_from_file(fp)


def publish_cdn(config: Config, system: System) -> None:
    subdir = "dev" if V(config.version).is_prerelease else "release"
    version = config.version

    access_key_id, secret_access_key = config.credentials["AWS"]

    buckets = []
    for bucket_name, bucket_region in [("cdn.bokeh.org", "us-east-1"), ("cdn-backup.bokeh.org", "us-west-2")]:
        conn = boto.s3.connect_to_region(
            bucket_region,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            calling_format=boto.s3.connection.OrdinaryCallingFormat(),
        )
        buckets.append(conn.get_bucket(bucket_name))

    content_type = "application/javascript"
    for name in ("bokeh", "bokeh-api", "bokeh-widgets", "bokeh-tables", "bokeh-gl"):
        for suffix in ("js", "min.js"):
            local_path = f"bokehjs/build/js/{name}.{suffix}"
            cdn_path = f"bokeh/{subdir}/{name}-{version}.{suffix}"
            for bucket in buckets:
                upload_file_to_cdn(local_path, cdn_path, content_type, bucket)


def publish_anaconda(config: Config, system: System) -> None:
    if V(config.version).is_prerelease:
        cmd = "anaconda -t %s upload -u bokeh %s -l dev --force --no-progress"
    else:
        cmd = "anaconda -t %s upload -u bokeh %s -l dev -l main --force --no-progress"

    try:
        conda_base_dir = system.run("conda info --base").strip()
    except CalledProcessError as e:
        failed("Could not get conda base dir", str(e).split("\n"))
        config.abort()

    token = config.credentials["ANACONDA"]
    files = glob.glob(f"{conda_base_dir}/conda-bld/noarch/bokeh*.tar.bz2")
    for file in files:
        system.run(cmd % (token, file), fake_cmd=cmd % ("<hidden>", file))

    files = glob.glob("dist/bokeh*.tar.gz")
    for file in files:
        system.run(cmd % (token, file), fake_cmd=cmd % ("<hidden>", file))


def publish_pypi(config: Config, system: System) -> None:
    if V(config.version).is_prerelease:
        skipped("Not updating PyPI package for pre-releases")
        return

    token = config.credentials["PYPI"]
    cmd = "twine upload -u __token__ -p %s %s"
    files = glob.glob("dist/bokeh*.tar.gz")
    for file in files:
        system.run(cmd % (token, file), fake_cmd=cmd % ("<hidden>", file))


def publish_docs(config: Config, system: System) -> None:
    system.cd("sphinx")
    sync_cmd = "aws s3 sync build/html s3://docs.bokeh.org/en/%s/ --acl bucket-owner-full-control --cache-control max-age=31536000,public"
    invalidate_cmd = "aws cloudfront create-invalidation --distribution-id E2OC6Q27H5UQ63 --paths %s"

    if V(config.version).is_prerelease:
        system.run(sync_cmd % "dev")
        system.run(invalidate_cmd % "/en/dev*")
    else:
        system.run(sync_cmd % config.version)
        system.run(sync_cmd % "latest")
        paths = "/en/latest* /versions.json"
        system.run(invalidate_cmd % paths)
    system.cd("..")


def publish_npm(config: Config, system: System) -> None:
    if V(config.version).is_prerelease:
        skipped("Not updating NPM package for pre-releases")
        return

    system.cd("bokehjs")
    system.run("npm publish")
    system.cd("..")

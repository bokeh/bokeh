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
from typing import Any, Callable

# External imports
import boto
from packaging.version import Version as V

# Bokeh imports
from .config import Config, StepType
from .enums import ActionStatus
from .system import cd, run
from .ui import failed, passed, skipped

__all__ = (
    "publish_anaconda",
    "publish_cdn",
    "publish_docs",
    "publish_npm",
    "publish_pypi",
)


def upload_wrapper(name: str) -> Callable[[StepType], StepType]:
    def decorator(func: StepType) -> StepType:
        def wrapper(config: Config) -> None:
            try:
                config.upload_status[name] = ActionStatus.STARTED
                func(config)
                passed(f"Upload for {name!r} finished")
            except Exception as e:
                failed(f"Upload for {name!r} did NOT succeed", str(e).split("\n"))
                config.abort()
            config.upload_status[name] = ActionStatus.COMPLETED

        return wrapper

    return decorator


def upload_file_to_cdn(local_path: str, cdn_path: str, content_type: str, bucket: Any, binary: bool = False) -> None:
    print(":uploading to CDN: %s" % cdn_path)
    key = boto.s3.key.Key(bucket, cdn_path)
    key.metadata = {"Cache-Control": "max-age=31536000", "Content-Type": content_type}
    if binary:
        data = open(local_path, "rb").read()
    else:
        data = open(local_path).read().encode("utf-8")
    fp = BytesIO(data)
    key.set_contents_from_file(fp)


@upload_wrapper("cdn")
def publish_cdn(config: Config) -> None:
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
            local_path = "bokehjs/build/js/%s.%s" % (name, suffix)
            cdn_path = "bokeh/%s/%s-%s.%s" % (subdir, name, version, suffix)
            for bucket in buckets:
                upload_file_to_cdn(local_path, cdn_path, content_type, bucket)


@upload_wrapper("anaconda")
def publish_anaconda(config: Config) -> None:
    if V(config.version).is_prerelease:
        cmd = "anaconda -t %s upload -u bokeh %s -l dev --force --no-progress"
    else:
        cmd = "anaconda -t %s upload -u bokeh %s -l dev -l main --force --no-progress"

    try:
        conda_base_dir = run("conda info --base").strip()
    except CalledProcessError as e:
        failed("Could not get conda base dir", str(e).split("\n"))
        config.abort()

    token = config.credentials["ANACONDA"]
    files = glob.glob(f"{conda_base_dir}/conda-bld/noarch/bokeh*.tar.bz2")
    for file in files:
        run(cmd % (token, file), fake_cmd=cmd % ("<hidden>", file), silent=False)

    files = glob.glob("dist/bokeh*.tar.gz")
    for file in files:
        run(cmd % (token, file), fake_cmd=cmd % ("<hidden>", file), silent=False)


@upload_wrapper("pypi")
def publish_pypi(config: Config) -> None:
    if V(config.version).is_prerelease:
        skipped("Not updating PyPI package for pre-releases")
        return

    token = config.credentials["PYPI"]
    cmd = "twine upload -u __token__ -p %s %s"
    files = glob.glob("dist/bokeh*.tar.gz")
    for file in files:
        run(cmd % (token, file), fake_cmd=cmd % ("<hidden>", file))


@upload_wrapper("docs")
def publish_docs(config: Config) -> None:
    cd("sphinx")
    sync_cmd = "aws s3 sync build/html s3://docs.bokeh.org/en/%s/ --acl bucket-owner-full-control --cache-control max-age=31536000,public"
    invalidate_cmd = "aws cloudfront create-invalidation --distribution-id E2OC6Q27H5UQ63 --paths %s"

    if V(config.version).is_prerelease:
        run(sync_cmd % "dev")
        run(invalidate_cmd % "/en/dev*")
    else:
        run(sync_cmd % config.version)
        run(sync_cmd % "latest")
        paths = "/en/latest* /versions.json"
        run(invalidate_cmd % paths)
    cd("..")


@upload_wrapper("npm")
def publish_npm(config: Config) -> None:
    if V(config.version).is_prerelease:
        skipped("Not updating NPM package for pre-releases")
        return

    cd("bokehjs")
    run("npm publish")
    cd("..")

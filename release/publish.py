# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
from io import BytesIO
from typing import Any

# External imports
import boto
from packaging.version import Version as V

# Bokeh imports
from .action import FAILED, PASSED, ActionReturn
from .config import Config
from .logger import LOG
from .system import System

__all__ = ("publish_bokehjs_to_cdn", "upload_deployment_tarball")


def _upload_file_to_cdn(local_path: str, cdn_path: str, content_type: str, bucket: Any, binary: bool = False) -> None:
    LOG.record(f":uploading to CDN: {cdn_path}")
    key = boto.s3.key.Key(bucket, cdn_path)
    key.metadata = {"Cache-Control": "max-age=31536000", "Content-Type": content_type}
    if binary:
        data = open(local_path, "rb").read()
    else:
        data = open(local_path).read().encode("utf-8")
    fp = BytesIO(data)
    key.set_contents_from_file(fp)


def publish_bokehjs_to_cdn(config: Config, system: System) -> ActionReturn:
    subdir = "dev" if V(config.version).is_prerelease else "release"
    version = config.version

    access_key_id = config.secrets["AWS_ACCESS_KEY_ID"]
    secret_access_key = config.secrets["AWS_SECRET_ACCESS_KEY"]

    try:
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
        for name in ("bokeh", "bokeh-api", "bokeh-widgets", "bokeh-tables"):
            for suffix in ("js", "min.js", "legacy.js", "legacy.min.js"):
                local_path = f"bokehjs/build/js/{name}.{suffix}"
                cdn_path = f"bokeh/{subdir}/{name}-{version}.{suffix}"
                for bucket in buckets:
                    _upload_file_to_cdn(local_path, cdn_path, content_type, bucket)
        return PASSED("Uploaded BokehJS to CDN")
    except Exception as e:
        return FAILED("BokehJS CDN upload failed", details=e.args)


def upload_deployment_tarball(config: Config, system: System) -> ActionReturn:
    try:
        system.run(f"aws s3 cp deployment-{config.version}.tgz s3://bokeh-deployments/")
        return PASSED("Uploaded deployment tarball")
    except RuntimeError as e:
        return FAILED("Could NOT upload deployment tarball", details=e.args)

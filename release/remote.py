# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
from itertools import product

# External imports
import boto3
from packaging.version import Version as V

# Bokeh imports
from . import BOKEHJS_BUCKETS
from .action import FAILED, PASSED, ActionReturn
from .config import Config
from .logger import LOG
from .system import System

__all__ = ("download_deployment_tarball", "publish_bokehjs_to_cdn", "upload_deployment_tarball")


def download_deployment_tarball(config: Config, system: System) -> ActionReturn:
    try:
        system.run(f"aws s3 cp s3://bokeh-deployments/deployment-{config.version}.tgz . --region us-east-1")
        return PASSED("Downloaded deployment tarball")
    except RuntimeError as e:
        return FAILED("Could NOT download deployment tarball", details=e.args)


def publish_bokehjs_to_cdn(config: Config, system: System) -> ActionReturn:
    version = config.version
    subdir = "dev" if V(version).is_prerelease else "release"

    access_key_id = config.secrets["AWS_ACCESS_KEY_ID"]
    secret_access_key = config.secrets["AWS_SECRET_ACCESS_KEY"]

    file_names = ("bokeh", "bokeh-gl", "bokeh-api", "bokeh-widgets", "bokeh-tables", "bokeh-mathjax")
    suffixes = ("js", "min.js", "esm.js", "esm.min.js")

    try:
        for bucket, region_name in BOKEHJS_BUCKETS:
            s3 = boto3.client(
                "s3",
                region_name=region_name,
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_access_key,
            )

            for name, suffix in product(file_names, suffixes):
                local_path = f"bokehjs/build/js/{name}.{suffix}"
                cdn_path = f"bokeh/{subdir}/{name}-{version}.{suffix}"

                with open(local_path) as f:
                    data = f.read().encode("utf-8")

                LOG.record(f":uploading to CDN [{bucket}]: {cdn_path}")

                s3.put_object(
                    Bucket=bucket,
                    Key=cdn_path,
                    Body=data,
                    ContentType="application/javascript",
                    CacheControl="max-age=31536000",
                )

        return PASSED("Uploaded BokehJS to CDN")

    except Exception as e:
        return FAILED(f"BokehJS CDN upload failed: {e}", details=e.args)


def upload_deployment_tarball(config: Config, system: System) -> ActionReturn:
    try:
        system.run(f"aws s3 cp deployment-{config.version}.tgz s3://bokeh-deployments/ --region us-east-1")
        return PASSED("Uploaded deployment tarball")
    except RuntimeError as e:
        return FAILED(f"Could NOT upload deployment tarball: {e}", details=e.args)

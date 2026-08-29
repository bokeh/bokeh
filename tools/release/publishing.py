# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
import logging
from itertools import product

# External imports
import boto3  # pyright: ignore[reportMissingModuleSource]
from packaging.version import Version as V

# Bokeh imports
from . import BOKEHJS_BUCKETS
from .action import FAILED, PASSED, ActionReturn
from .config import Config
from .system import System

__all__ = (
    "publish_bokehjs_to_cdn",
    "publish_documentation",
)

CLOUDFRONT_ID = "E2OC6Q27H5UQ63"
REGION = "--region us-east-1"

log = logging.getLogger(__name__)


def publish_bokehjs_to_cdn(config: Config, system: System) -> ActionReturn:
    version = config.version
    subdir = "dev" if V(version).is_prerelease else "release"

    file_names = ("bokeh", "bokeh-gl", "bokeh-api", "bokeh-widgets", "bokeh-tables", "bokeh-mathjax")
    suffixes = ("js", "min.js", "esm.js", "esm.min.js")

    try:
        for bucket, region_name in BOKEHJS_BUCKETS:
            s3 = boto3.client("s3", region_name=region_name)

            for name, suffix in product(file_names, suffixes):
                local_path = f"bokehjs/build/js/{name}.{suffix}"
                cdn_path = f"bokeh/{subdir}/{name}-{version}.{suffix}"

                with open(local_path) as f:
                    data = f.read().encode("utf-8")

                log.info(":uploading to CDN [%s]: %s", bucket, cdn_path)

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


def publish_documentation(config: Config, system: System) -> ActionReturn:
    version, release_level = config.version, config.release_level
    path = f"deployment-{version}/docs/bokeh/build/html"
    flags = "--only-show-errors"
    switcher = f"deployment-{version}/docs/bokeh/switcher.json"
    # CloudFront invalidations cannot evict copies already stored by browsers, so
    # the switcher must be revalidated on every use. Its dedicated /switcher.json
    # behavior uses Managed-CachingDisabled and Managed-CORS-S3Origin to disable
    # CDN caching and preserve S3's CORS handling.
    switcher_cache = "--cache-control no-cache,max-age=0,must-revalidate"
    WEEK = 3600 * 24 * 7
    YEAR = 3600 * 24 * 365

    def cache(max_age: int) -> str:
        return f"--cache-control max-age={max_age},public"

    try:
        if config.prerelease:
            system.run(f"aws s3 sync {path} s3://docs.bokeh.org/en/dev-{release_level}/ --delete {flags} {cache(YEAR)} {REGION}")
            system.run(f"aws s3 cp {switcher} s3://docs.bokeh.org/ {flags} {switcher_cache} {REGION}")
            system.run(f'aws cloudfront create-invalidation --distribution-id {CLOUDFRONT_ID} --paths "/en/dev-{release_level}*" "/switcher.json" {REGION}')
        else:
            system.run(f"aws s3 sync {path} s3://docs.bokeh.org/en/{version}/ {flags} {cache(YEAR)} {REGION}")
            system.run(f"aws s3 sync {path} s3://docs.bokeh.org/en/latest/ --delete {flags} {cache(WEEK)} {REGION}")
            system.run(f"aws s3 cp {switcher} s3://docs.bokeh.org/ {flags} {switcher_cache} {REGION}")
            system.run(f'aws cloudfront create-invalidation --distribution-id {CLOUDFRONT_ID} --paths "/en/latest*" "/en/{version}*" "/switcher.json" {REGION}')
        return PASSED("Publish to documentation site succeeded")
    except RuntimeError as e:
        return FAILED("Could NOT publish to documentation site", details=e.args)

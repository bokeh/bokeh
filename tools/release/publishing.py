# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
from itertools import product
from xml.etree.ElementTree import ParseError

# External imports
from packaging.version import Version as V

# Bokeh imports
from . import BOKEHJS_BUCKETS
from .action import FAILED, PASSED, ActionReturn
from .config import Config
from .docs import publish_docs
from .system import System

__all__ = (
    "publish_bokehjs_to_cdn",
    "publish_documentation",
)


def publish_bokehjs_to_cdn(config: Config, system: System) -> ActionReturn:
    version = config.version
    subdir = "dev" if V(version).is_prerelease else "release"

    file_names = ("bokeh", "bokeh-gl", "bokeh-api", "bokeh-widgets", "bokeh-tables", "bokeh-mathjax")
    suffixes = ("js", "min.js", "esm.js", "esm.min.js")
    assets = (
        *product(file_names, suffixes),
        ("bokeh-embed-bootstrap", "js"),
        ("bokeh-embed-bootstrap", "min.js"),
    )

    try:
        for bucket, region_name in BOKEHJS_BUCKETS:
            for name, suffix in assets:
                local_path = f"bokehjs/build/js/{name}.{suffix}"
                cdn_path = f"bokeh/{subdir}/{name}-{version}.{suffix}"
                system.run(
                    f"aws s3 cp {local_path} s3://{bucket}/{cdn_path} "
                    f"--content-type application/javascript --cache-control max-age=31536000 --region {region_name}",
                )

        return PASSED("Uploaded BokehJS to CDN")

    except RuntimeError as e:
        return FAILED(f"BokehJS CDN upload failed: {e}", details=e.args)


def publish_documentation(config: Config, system: System) -> ActionReturn:
    try:
        publish_docs(config, system)
        return PASSED("Publish to documentation site succeeded")
    except (OSError, RuntimeError, ValueError, KeyError, ParseError) as e:
        return FAILED("Could NOT publish to documentation site", details=e.args)

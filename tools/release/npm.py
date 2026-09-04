# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
from __future__ import annotations

__all__ = ("NPM_PACKAGES",)

# Dependency order is also publication order.
NPM_PACKAGES = (
    ("", "bokeh-bokehjs"),
    ("frameworks/base", "bokeh-framework"),
    ("frameworks/angular", "bokeh-angular"),
    ("frameworks/react", "bokeh-react"),
    ("frameworks/svelte", "bokeh-svelte"),
    ("frameworks/vue", "bokeh-vue"),
    ("frameworks/web-component", "bokeh-web-component"),
)

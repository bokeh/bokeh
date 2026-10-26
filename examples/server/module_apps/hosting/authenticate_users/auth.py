"""Example bearer-header authentication policy. See the hosting guide."""

import os
from hmac import compare_digest

from bokeh.server.auth import AuthPolicy

expected_token = os.environ["APP_ACCESS_TOKEN"]
if not expected_token:
    raise ValueError("APP_ACCESS_TOKEN must not be empty")


def authenticate(request):
    authorization = request.headers.get("Authorization", "")
    return "engineer" if compare_digest(authorization.encode("utf-8"), ("Bearer " + expected_token).encode("utf-8")) else None


policy = AuthPolicy(authenticate)

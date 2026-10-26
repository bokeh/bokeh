# Authenticate users

Explore a sine wave behind a bearer-header authentication policy.

Set `APP_ACCESS_TOKEN` to a strong random secret before starting. For signed
sessions, also set `BOKEH_SIGN_SESSIONS=yes` and `BOKEH_SECRET_KEY` to a separate
strong random secret.

Run from the repository root:

```sh
python -m uvicorn examples.server.module_apps.hosting.authenticate_users.server:app
```

The policy requires an Authorization bearer header on both HTTP and WebSocket
requests. A client or trusted gateway must supply it. An ordinary browser tab
does not add the header. The host excludes Authorization from session tokens.
Use TLS for credentials. Interactive login belongs to a parent website or an
external identity provider.

Compare the [script version](../../../script_apps/authenticate_users/).
Both use the same bearer-header policy. This module version configures the
policy in `server.py`, while the script version supplies it to `bokeh serve`.

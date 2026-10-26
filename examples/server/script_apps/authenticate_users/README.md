# Authenticate users

Set `APP_ACCESS_TOKEN` to a strong random secret before starting. For signed
sessions, also set `BOKEH_SIGN_SESSIONS=yes` and `BOKEH_SECRET_KEY` to a separate
strong random secret.

Run from the repository root:

```sh
bokeh serve examples/server/script_apps/authenticate_users --auth-policy examples.server.script_apps.authenticate_users.auth:policy
```

The policy requires an Authorization bearer header on both HTTP and WebSocket
requests. A client or trusted gateway must supply it. An ordinary browser tab
does not add the header. The host excludes Authorization from session tokens.
Use TLS for credentials. Interactive login belongs to a parent website or an
external identity provider.

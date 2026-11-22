# Live Bokeh applications

These examples display an animated wave-interference image from a Python Bokeh
server. One embeds the whole application with `server_document()`. The other
uses React to place and manage its plots and controls independently.

## Run the examples

From the repository root, install the dependencies and enter the environment:

```sh
pixi run --locked setup
pixi shell --locked
```

Build the local JavaScript packages:

```sh
cd bokehjs
node make build
cd ..
```

Start the Python server:

```sh
python -m uvicorn react_mount:app --app-dir examples/server/api/asgi --host 127.0.0.1 --port 8000
```

Alternatively, use Tornado:

```sh
python examples/server/api/asgi/react_mount.py --tornado --port 8000
```

In a second terminal, enter `pixi shell --locked` from the repository root and
start the frontend:

```sh
cd bokehjs/examples/frameworks/react-vite
../../../node_modules/.bin/vite
```

Open either page:

- [App URL example](http://127.0.0.1:5173/server.html): embed an application using
  its URL and a target element.
- [React example](http://127.0.0.1:5173/live.html): place the same application's
  plots and controls in separate React-owned slots.

## Try it

Change the second wave's amplitude and switch between Viridis, Inferno, and
Turbo. Python updates the image every second. Amplitudes of 5 or more display an
additional message. Lowering the amplitude removes it.

In the React example, **Detach plot** removes just the image and its colormap
control. **Dispose borrowed views** removes all Bokeh views while the React
control and server counter keep working. Reattach or remount to see the current
state. In either example, disconnecting closes the connection. Connecting again
starts a new session.

## Use the API

To embed a running Bokeh application:

```ts
import {server_document} from "@bokeh/bokehjs"

const mounted = server_document("/bkapp", "#plot")
await mounted.ready

// When removing the application:
await mounted.dispose()
```

Built-in models are registered automatically. The returned mount owns the
connection, client document, and views, and releases them together on disposal.

For React applications, `BokehSession` and `BokehRoot` let you place named roots
independently. See [the React source](src/live.tsx) and
[the React adapter guide](../../../frameworks/react/README.md) for usage and
connection ownership options.

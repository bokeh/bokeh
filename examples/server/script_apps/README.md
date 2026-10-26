# Script apps

These scripts and directory apps demonstrate the quick script workflow.
The main teaching collection is [module apps](../module_apps/).

Run from the repository root. Directory apps use `main.py` and can discover
hooks, templates, themes and static assets. ``BokehASGI`` can load the same files by path without changing their application form.

| Example | Run |
|---|---|
| [adjust_plot_with_sliders.py](adjust_plot_with_sliders.py) | `bokeh serve examples/server/script_apps/adjust_plot_with_sliders.py --show` |
| [animate_contours.py](animate_contours.py) | `bokeh serve examples/server/script_apps/animate_contours.py --show` |
| [animate_fourier_series.py](animate_fourier_series.py) | `bokeh serve examples/server/script_apps/animate_fourier_series.py --show` |
| [apply_a_theme.py](apply_a_theme.py) | `bokeh serve examples/server/script_apps/apply_a_theme.py --show` |
| [authenticate_users](authenticate_users) | See the [authentication instructions](authenticate_users/README.md) |
| [batch_document_updates.py](batch_document_updates.py) | `bokeh serve examples/server/script_apps/batch_document_updates.py --show` |
| [display_live_audio](display_live_audio) | `bokeh serve examples/server/script_apps/display_live_audio --show` |
| [lock_document_callbacks.py](lock_document_callbacks.py) | `bokeh serve examples/server/script_apps/lock_document_callbacks.py --show` |
| [patch_data.py](patch_data.py) | `bokeh serve examples/server/script_apps/patch_data.py --show` |
| [respond_to_events.py](respond_to_events.py) | `bokeh serve examples/server/script_apps/respond_to_events.py --show` |
| [switch_light_dark_theme.py](switch_light_dark_theme.py) | `bokeh serve examples/server/script_apps/switch_light_dark_theme.py --show` |
| [toggle_line_visibility.py](toggle_line_visibility.py) | `bokeh serve examples/server/script_apps/toggle_line_visibility.py --show` |
| [track_stocks](track_stocks) | `bokeh serve examples/server/script_apps/track_stocks --show` |

The authentication example also requires `--auth-policy` and credentials.
See its [README](authenticate_users/README.md). The audio example uses generated
audio unless PyAudio and an input device are available. Stocks use bundled
historical data and do not download prices during startup.

Several examples have deliberate module counterparts. Use the
[slider pair](../module_apps/getting_started/adjust_plot_with_sliders/) to compare
document construction and callbacks. Use the
[authentication pair](../module_apps/hosting/authenticate_users/) to compare
command-line and explicit host configuration. These pairs demonstrate the
application forms without tying server apps to either hosting method.

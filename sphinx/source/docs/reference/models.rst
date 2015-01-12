

.. contents::
    :local:
    :depth: 2

Models
------

.. _bokeh_dot_models_dot_axes:

``bokeh.models.axes``
---------------------

.. autoclass:: bokeh.models.axes.Axis
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "axis_label": null,
          "axis_label_standoff": null,
          "axis_label_text_align": "left",
          "axis_label_text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "axis_label_text_baseline": "bottom",
          "axis_label_text_color": {
            "value": "#444444"
          },
          "axis_label_text_font": "Helvetica",
          "axis_label_text_font_size": "12pt",
          "axis_label_text_font_style": "normal",
          "axis_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "axis_line_cap": "butt",
          "axis_line_color": {
            "value": "black"
          },
          "axis_line_dash": [],
          "axis_line_dash_offset": 0,
          "axis_line_join": "miter",
          "axis_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "bounds": "auto",
          "doc": null,
          "formatter": null,
          "id": "82e70647-df2d-49f8-8a6a-4113c7adf532",
          "location": "auto",
          "major_label_orientation": "horizontal",
          "major_label_standoff": null,
          "major_label_text_align": "left",
          "major_label_text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "major_label_text_baseline": "bottom",
          "major_label_text_color": {
            "value": "#444444"
          },
          "major_label_text_font": "Helvetica",
          "major_label_text_font_size": "12pt",
          "major_label_text_font_style": "normal",
          "major_tick_in": null,
          "major_tick_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "major_tick_line_cap": "butt",
          "major_tick_line_color": {
            "value": "black"
          },
          "major_tick_line_dash": [],
          "major_tick_line_dash_offset": 0,
          "major_tick_line_join": "miter",
          "major_tick_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "major_tick_out": null,
          "minor_tick_in": null,
          "minor_tick_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "minor_tick_line_cap": "butt",
          "minor_tick_line_color": {
            "value": "black"
          },
          "minor_tick_line_dash": [],
          "minor_tick_line_dash_offset": 0,
          "minor_tick_line_join": "miter",
          "minor_tick_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "minor_tick_out": null,
          "name": null,
          "plot": null,
          "tags": [],
          "ticker": null,
          "x_range_name": "default",
          "y_range_name": "default"
        },
        "id": "82e70647-df2d-49f8-8a6a-4113c7adf532",
        "type": "Axis"
      }
    ]

.. autoclass:: bokeh.models.axes.CategoricalAxis
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "c5a7e1b7-aa1d-4fc4-a1f0-2ea331fa9fad",
          "name": null,
          "num_minor_ticks": 5,
          "tags": []
        },
        "id": "c5a7e1b7-aa1d-4fc4-a1f0-2ea331fa9fad",
        "type": "CategoricalTicker"
      },
      {
        "attributes": {
          "doc": null,
          "id": "4be27a79-8dea-46a0-9bb9-252961ae1bb4",
          "name": null,
          "tags": []
        },
        "id": "4be27a79-8dea-46a0-9bb9-252961ae1bb4",
        "type": "CategoricalTickFormatter"
      },
      {
        "attributes": {
          "axis_label": null,
          "axis_label_standoff": null,
          "axis_label_text_align": "left",
          "axis_label_text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "axis_label_text_baseline": "bottom",
          "axis_label_text_color": {
            "value": "#444444"
          },
          "axis_label_text_font": "Helvetica",
          "axis_label_text_font_size": "12pt",
          "axis_label_text_font_style": "normal",
          "axis_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "axis_line_cap": "butt",
          "axis_line_color": {
            "value": "black"
          },
          "axis_line_dash": [],
          "axis_line_dash_offset": 0,
          "axis_line_join": "miter",
          "axis_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "bounds": "auto",
          "doc": null,
          "formatter": {
            "id": "4be27a79-8dea-46a0-9bb9-252961ae1bb4",
            "type": "CategoricalTickFormatter"
          },
          "id": "d1ad96d3-4514-4250-a6eb-b006abcfef49",
          "location": "auto",
          "major_label_orientation": "horizontal",
          "major_label_standoff": null,
          "major_label_text_align": "left",
          "major_label_text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "major_label_text_baseline": "bottom",
          "major_label_text_color": {
            "value": "#444444"
          },
          "major_label_text_font": "Helvetica",
          "major_label_text_font_size": "12pt",
          "major_label_text_font_style": "normal",
          "major_tick_in": null,
          "major_tick_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "major_tick_line_cap": "butt",
          "major_tick_line_color": {
            "value": "black"
          },
          "major_tick_line_dash": [],
          "major_tick_line_dash_offset": 0,
          "major_tick_line_join": "miter",
          "major_tick_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "major_tick_out": null,
          "minor_tick_in": null,
          "minor_tick_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "minor_tick_line_cap": "butt",
          "minor_tick_line_color": {
            "value": "black"
          },
          "minor_tick_line_dash": [],
          "minor_tick_line_dash_offset": 0,
          "minor_tick_line_join": "miter",
          "minor_tick_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "minor_tick_out": null,
          "name": null,
          "plot": null,
          "tags": [],
          "ticker": {
            "id": "c5a7e1b7-aa1d-4fc4-a1f0-2ea331fa9fad",
            "type": "CategoricalTicker"
          },
          "x_range_name": "default",
          "y_range_name": "default"
        },
        "id": "d1ad96d3-4514-4250-a6eb-b006abcfef49",
        "type": "CategoricalAxis"
      }
    ]

.. autoclass:: bokeh.models.axes.ContinuousAxis
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "axis_label": null,
          "axis_label_standoff": null,
          "axis_label_text_align": "left",
          "axis_label_text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "axis_label_text_baseline": "bottom",
          "axis_label_text_color": {
            "value": "#444444"
          },
          "axis_label_text_font": "Helvetica",
          "axis_label_text_font_size": "12pt",
          "axis_label_text_font_style": "normal",
          "axis_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "axis_line_cap": "butt",
          "axis_line_color": {
            "value": "black"
          },
          "axis_line_dash": [],
          "axis_line_dash_offset": 0,
          "axis_line_join": "miter",
          "axis_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "bounds": "auto",
          "doc": null,
          "formatter": null,
          "id": "b87f1174-bf82-44df-8385-bdf664998ea6",
          "location": "auto",
          "major_label_orientation": "horizontal",
          "major_label_standoff": null,
          "major_label_text_align": "left",
          "major_label_text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "major_label_text_baseline": "bottom",
          "major_label_text_color": {
            "value": "#444444"
          },
          "major_label_text_font": "Helvetica",
          "major_label_text_font_size": "12pt",
          "major_label_text_font_style": "normal",
          "major_tick_in": null,
          "major_tick_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "major_tick_line_cap": "butt",
          "major_tick_line_color": {
            "value": "black"
          },
          "major_tick_line_dash": [],
          "major_tick_line_dash_offset": 0,
          "major_tick_line_join": "miter",
          "major_tick_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "major_tick_out": null,
          "minor_tick_in": null,
          "minor_tick_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "minor_tick_line_cap": "butt",
          "minor_tick_line_color": {
            "value": "black"
          },
          "minor_tick_line_dash": [],
          "minor_tick_line_dash_offset": 0,
          "minor_tick_line_join": "miter",
          "minor_tick_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "minor_tick_out": null,
          "name": null,
          "plot": null,
          "tags": [],
          "ticker": null,
          "x_range_name": "default",
          "y_range_name": "default"
        },
        "id": "b87f1174-bf82-44df-8385-bdf664998ea6",
        "type": "ContinuousAxis"
      }
    ]

.. autoclass:: bokeh.models.axes.DatetimeAxis
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "formats": {},
          "id": "e27d5b26-2153-4a6d-9f4b-af3cc4a74b24",
          "name": null,
          "tags": []
        },
        "id": "e27d5b26-2153-4a6d-9f4b-af3cc4a74b24",
        "type": "DatetimeTickFormatter"
      },
      {
        "attributes": {
          "axis_label": "date",
          "axis_label_standoff": null,
          "axis_label_text_align": "left",
          "axis_label_text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "axis_label_text_baseline": "bottom",
          "axis_label_text_color": {
            "value": "#444444"
          },
          "axis_label_text_font": "Helvetica",
          "axis_label_text_font_size": "12pt",
          "axis_label_text_font_style": "normal",
          "axis_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "axis_line_cap": "butt",
          "axis_line_color": {
            "value": "black"
          },
          "axis_line_dash": [],
          "axis_line_dash_offset": 0,
          "axis_line_join": "miter",
          "axis_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "bounds": "auto",
          "char_width": 10,
          "doc": null,
          "fill_ratio": 0.3,
          "formatter": {
            "id": "e27d5b26-2153-4a6d-9f4b-af3cc4a74b24",
            "type": "DatetimeTickFormatter"
          },
          "id": "d473f1e9-7fcf-41ce-978d-83993c243188",
          "location": "auto",
          "major_label_orientation": "horizontal",
          "major_label_standoff": null,
          "major_label_text_align": "left",
          "major_label_text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "major_label_text_baseline": "bottom",
          "major_label_text_color": {
            "value": "#444444"
          },
          "major_label_text_font": "Helvetica",
          "major_label_text_font_size": "12pt",
          "major_label_text_font_style": "normal",
          "major_tick_in": null,
          "major_tick_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "major_tick_line_cap": "butt",
          "major_tick_line_color": {
            "value": "black"
          },
          "major_tick_line_dash": [],
          "major_tick_line_dash_offset": 0,
          "major_tick_line_join": "miter",
          "major_tick_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "major_tick_out": null,
          "minor_tick_in": null,
          "minor_tick_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "minor_tick_line_cap": "butt",
          "minor_tick_line_color": {
            "value": "black"
          },
          "minor_tick_line_dash": [],
          "minor_tick_line_dash_offset": 0,
          "minor_tick_line_join": "miter",
          "minor_tick_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "minor_tick_out": null,
          "name": null,
          "num_labels": 8,
          "plot": null,
          "scale": "time",
          "tags": [],
          "ticker": {
            "id": "2741ae1b-fc98-4974-8b0f-0d99de55a9c7",
            "type": "DatetimeTicker"
          },
          "x_range_name": "default",
          "y_range_name": "default"
        },
        "id": "d473f1e9-7fcf-41ce-978d-83993c243188",
        "type": "DatetimeAxis"
      },
      {
        "attributes": {
          "doc": null,
          "id": "2741ae1b-fc98-4974-8b0f-0d99de55a9c7",
          "name": null,
          "num_minor_ticks": 5,
          "tags": []
        },
        "id": "2741ae1b-fc98-4974-8b0f-0d99de55a9c7",
        "type": "DatetimeTicker"
      }
    ]

.. autoclass:: bokeh.models.axes.LinearAxis
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "base": 10.0,
          "doc": null,
          "id": "6e03e94a-a8fc-4dbf-a3fa-56d2929699cd",
          "mantissas": [
            2,
            5,
            10
          ],
          "max_interval": 100.0,
          "min_interval": 0.0,
          "name": null,
          "num_minor_ticks": 5,
          "tags": []
        },
        "id": "6e03e94a-a8fc-4dbf-a3fa-56d2929699cd",
        "type": "BasicTicker"
      },
      {
        "attributes": {
          "doc": null,
          "id": "fa74df38-f524-4402-94a0-fdec38116aa7",
          "name": null,
          "power_limit_high": 5,
          "power_limit_low": -3,
          "precision": "auto",
          "tags": [],
          "use_scientific": true
        },
        "id": "fa74df38-f524-4402-94a0-fdec38116aa7",
        "type": "BasicTickFormatter"
      },
      {
        "attributes": {
          "axis_label": null,
          "axis_label_standoff": null,
          "axis_label_text_align": "left",
          "axis_label_text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "axis_label_text_baseline": "bottom",
          "axis_label_text_color": {
            "value": "#444444"
          },
          "axis_label_text_font": "Helvetica",
          "axis_label_text_font_size": "12pt",
          "axis_label_text_font_style": "normal",
          "axis_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "axis_line_cap": "butt",
          "axis_line_color": {
            "value": "black"
          },
          "axis_line_dash": [],
          "axis_line_dash_offset": 0,
          "axis_line_join": "miter",
          "axis_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "bounds": "auto",
          "doc": null,
          "formatter": {
            "id": "fa74df38-f524-4402-94a0-fdec38116aa7",
            "type": "BasicTickFormatter"
          },
          "id": "29bd4a11-9a78-43b0-b733-09f14e4aa23c",
          "location": "auto",
          "major_label_orientation": "horizontal",
          "major_label_standoff": null,
          "major_label_text_align": "left",
          "major_label_text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "major_label_text_baseline": "bottom",
          "major_label_text_color": {
            "value": "#444444"
          },
          "major_label_text_font": "Helvetica",
          "major_label_text_font_size": "12pt",
          "major_label_text_font_style": "normal",
          "major_tick_in": null,
          "major_tick_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "major_tick_line_cap": "butt",
          "major_tick_line_color": {
            "value": "black"
          },
          "major_tick_line_dash": [],
          "major_tick_line_dash_offset": 0,
          "major_tick_line_join": "miter",
          "major_tick_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "major_tick_out": null,
          "minor_tick_in": null,
          "minor_tick_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "minor_tick_line_cap": "butt",
          "minor_tick_line_color": {
            "value": "black"
          },
          "minor_tick_line_dash": [],
          "minor_tick_line_dash_offset": 0,
          "minor_tick_line_join": "miter",
          "minor_tick_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "minor_tick_out": null,
          "name": null,
          "plot": null,
          "tags": [],
          "ticker": {
            "id": "6e03e94a-a8fc-4dbf-a3fa-56d2929699cd",
            "type": "BasicTicker"
          },
          "x_range_name": "default",
          "y_range_name": "default"
        },
        "id": "29bd4a11-9a78-43b0-b733-09f14e4aa23c",
        "type": "LinearAxis"
      }
    ]

.. autoclass:: bokeh.models.axes.LogAxis
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "base": 10.0,
          "doc": null,
          "id": "a5bc55be-c806-4fb6-b2f0-07f77059ef23",
          "mantissas": [
            2,
            5,
            10
          ],
          "max_interval": 100.0,
          "min_interval": 0.0,
          "name": null,
          "num_minor_ticks": 10,
          "tags": []
        },
        "id": "a5bc55be-c806-4fb6-b2f0-07f77059ef23",
        "type": "LogTicker"
      },
      {
        "attributes": {
          "axis_label": null,
          "axis_label_standoff": null,
          "axis_label_text_align": "left",
          "axis_label_text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "axis_label_text_baseline": "bottom",
          "axis_label_text_color": {
            "value": "#444444"
          },
          "axis_label_text_font": "Helvetica",
          "axis_label_text_font_size": "12pt",
          "axis_label_text_font_style": "normal",
          "axis_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "axis_line_cap": "butt",
          "axis_line_color": {
            "value": "black"
          },
          "axis_line_dash": [],
          "axis_line_dash_offset": 0,
          "axis_line_join": "miter",
          "axis_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "bounds": "auto",
          "doc": null,
          "formatter": {
            "id": "213291b1-efaa-4b89-8ac1-e3daf604af8d",
            "type": "LogTickFormatter"
          },
          "id": "9b0ebf16-15a1-42af-9d4a-639565822d70",
          "location": "auto",
          "major_label_orientation": "horizontal",
          "major_label_standoff": null,
          "major_label_text_align": "left",
          "major_label_text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "major_label_text_baseline": "bottom",
          "major_label_text_color": {
            "value": "#444444"
          },
          "major_label_text_font": "Helvetica",
          "major_label_text_font_size": "12pt",
          "major_label_text_font_style": "normal",
          "major_tick_in": null,
          "major_tick_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "major_tick_line_cap": "butt",
          "major_tick_line_color": {
            "value": "black"
          },
          "major_tick_line_dash": [],
          "major_tick_line_dash_offset": 0,
          "major_tick_line_join": "miter",
          "major_tick_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "major_tick_out": null,
          "minor_tick_in": null,
          "minor_tick_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "minor_tick_line_cap": "butt",
          "minor_tick_line_color": {
            "value": "black"
          },
          "minor_tick_line_dash": [],
          "minor_tick_line_dash_offset": 0,
          "minor_tick_line_join": "miter",
          "minor_tick_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "minor_tick_out": null,
          "name": null,
          "plot": null,
          "tags": [],
          "ticker": {
            "id": "a5bc55be-c806-4fb6-b2f0-07f77059ef23",
            "type": "LogTicker"
          },
          "x_range_name": "default",
          "y_range_name": "default"
        },
        "id": "9b0ebf16-15a1-42af-9d4a-639565822d70",
        "type": "LogAxis"
      },
      {
        "attributes": {
          "doc": null,
          "id": "213291b1-efaa-4b89-8ac1-e3daf604af8d",
          "name": null,
          "tags": [],
          "ticker": {
            "id": "a5bc55be-c806-4fb6-b2f0-07f77059ef23",
            "type": "LogTicker"
          }
        },
        "id": "213291b1-efaa-4b89-8ac1-e3daf604af8d",
        "type": "LogTickFormatter"
      }
    ]

.. _bokeh_dot_models_dot_formatters:

``bokeh.models.formatters``
---------------------------

.. autoclass:: bokeh.models.formatters.BasicTickFormatter
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "5652a13a-6cca-4b0c-af05-f475f6a0b080",
          "name": null,
          "power_limit_high": 5,
          "power_limit_low": -3,
          "precision": "auto",
          "tags": [],
          "use_scientific": true
        },
        "id": "5652a13a-6cca-4b0c-af05-f475f6a0b080",
        "type": "BasicTickFormatter"
      }
    ]

.. autoclass:: bokeh.models.formatters.CategoricalTickFormatter
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "556b9976-1eee-420a-9419-3d05b3608c70",
          "name": null,
          "tags": []
        },
        "id": "556b9976-1eee-420a-9419-3d05b3608c70",
        "type": "CategoricalTickFormatter"
      }
    ]

.. autoclass:: bokeh.models.formatters.DatetimeTickFormatter
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "formats": {},
          "id": "8878104a-1704-4dde-aaef-594e65bd7e47",
          "name": null,
          "tags": []
        },
        "id": "8878104a-1704-4dde-aaef-594e65bd7e47",
        "type": "DatetimeTickFormatter"
      }
    ]

.. autoclass:: bokeh.models.formatters.LogTickFormatter
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "8815c0ad-d315-4c9b-83a6-1fb9c6a77786",
          "name": null,
          "tags": [],
          "ticker": null
        },
        "id": "8815c0ad-d315-4c9b-83a6-1fb9c6a77786",
        "type": "LogTickFormatter"
      }
    ]

.. autoclass:: bokeh.models.formatters.TickFormatter
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "f439fd63-81d2-4866-9ad3-b6f747c48069",
          "name": null,
          "tags": []
        },
        "id": "f439fd63-81d2-4866-9ad3-b6f747c48069",
        "type": "TickFormatter"
      }
    ]

.. _bokeh_dot_models_dot_glyphs:

``bokeh.models.glyphs``
-----------------------

.. autoclass:: bokeh.models.glyphs.AnnularWedge
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "direction": "clock",
          "doc": null,
          "end_angle": {
            "field": "end_angle",
            "units": "data"
          },
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "3d4701fd-168d-42c0-b925-2a4f8e8b7cb7",
          "inner_radius": null,
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "outer_radius": null,
          "start_angle": {
            "field": "start_angle",
            "units": "data"
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "3d4701fd-168d-42c0-b925-2a4f8e8b7cb7",
        "type": "AnnularWedge"
      }
    ]

.. autoclass:: bokeh.models.glyphs.Annulus
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "c2ac7ef0-083d-4897-a245-e1ec8b0a0f1f",
          "inner_radius": null,
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "outer_radius": null,
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "c2ac7ef0-083d-4897-a245-e1ec8b0a0f1f",
        "type": "Annulus"
      }
    ]

.. autoclass:: bokeh.models.glyphs.Arc
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "direction": "clock",
          "doc": null,
          "end_angle": {
            "field": "end_angle",
            "units": "data"
          },
          "id": "a888b5e1-5564-42be-ab80-aad8268fc766",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "radius": null,
          "start_angle": {
            "field": "start_angle",
            "units": "data"
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "a888b5e1-5564-42be-ab80-aad8268fc766",
        "type": "Arc"
      }
    ]

.. autoclass:: bokeh.models.glyphs.Bezier
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "cx0": {
            "field": "cx0",
            "units": "data"
          },
          "cx1": {
            "field": "cx1",
            "units": "data"
          },
          "cy0": {
            "field": "cy0",
            "units": "data"
          },
          "cy1": {
            "field": "cy1",
            "units": "data"
          },
          "doc": null,
          "id": "72d9fc0e-b21c-48d0-bdee-0d8c2cb381f1",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "tags": [],
          "visible": null,
          "x0": {
            "field": "x0",
            "units": "data"
          },
          "x1": {
            "field": "x1",
            "units": "data"
          },
          "y0": {
            "field": "y0",
            "units": "data"
          },
          "y1": {
            "field": "y1",
            "units": "data"
          }
        },
        "id": "72d9fc0e-b21c-48d0-bdee-0d8c2cb381f1",
        "type": "Bezier"
      }
    ]

.. autoclass:: bokeh.models.glyphs.Gear
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "angle": {
            "units": "data",
            "value": 0
          },
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "cdf85bc8-a78a-40dd-95ae-04c742d74046",
          "internal": {
            "units": "data",
            "value": false
          },
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "module": {
            "field": "module",
            "units": "data"
          },
          "name": null,
          "pressure_angle": {
            "units": "data",
            "value": 20
          },
          "shaft_size": {
            "units": "data",
            "value": 0.3
          },
          "tags": [],
          "teeth": {
            "field": "teeth",
            "units": "data"
          },
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "cdf85bc8-a78a-40dd-95ae-04c742d74046",
        "type": "Gear"
      }
    ]

.. autoclass:: bokeh.models.glyphs.Glyph
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "88c2a308-f9c8-4f89-88ec-9dba0fd2c2b5",
          "name": null,
          "tags": [],
          "visible": null
        },
        "id": "88c2a308-f9c8-4f89-88ec-9dba0fd2c2b5",
        "type": "Glyph"
      }
    ]

.. autoclass:: bokeh.models.glyphs.Image
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "color_mapper": null,
          "dh": {
            "field": "dh",
            "units": "data"
          },
          "dilate": false,
          "doc": null,
          "dw": {
            "field": "dw",
            "units": "data"
          },
          "id": "ae12ae92-b676-4b73-a5c9-5c32ccc04db6",
          "image": {
            "field": "image",
            "units": "data"
          },
          "name": null,
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "ae12ae92-b676-4b73-a5c9-5c32ccc04db6",
        "type": "Image"
      }
    ]

.. autoclass:: bokeh.models.glyphs.ImageRGBA
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "anchor": "top_left",
          "cols": {
            "field": "cols",
            "units": "data"
          },
          "dh": {
            "field": "dh",
            "units": "data"
          },
          "dilate": false,
          "doc": null,
          "dw": {
            "field": "dw",
            "units": "data"
          },
          "id": "a839906b-726d-44e1-b94d-d31862216764",
          "image": {
            "field": "image",
            "units": "data"
          },
          "name": null,
          "rows": {
            "field": "rows",
            "units": "data"
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "a839906b-726d-44e1-b94d-d31862216764",
        "type": "ImageRGBA"
      }
    ]

.. autoclass:: bokeh.models.glyphs.ImageURL
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "anchor": "top_left",
          "angle": {
            "units": "data",
            "value": 0
          },
          "dilate": false,
          "doc": null,
          "h": {
            "field": "h",
            "units": "data"
          },
          "id": "cf7fe692-8857-4986-9b4f-d6a8a733cb24",
          "name": null,
          "tags": [],
          "url": {
            "field": "url",
            "units": "data"
          },
          "visible": null,
          "w": {
            "field": "w",
            "units": "data"
          },
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "cf7fe692-8857-4986-9b4f-d6a8a733cb24",
        "type": "ImageURL"
      }
    ]

.. autoclass:: bokeh.models.glyphs.Line
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "81b30583-e432-4c45-a202-ffdc4ec48490",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "81b30583-e432-4c45-a202-ffdc4ec48490",
        "type": "Line"
      }
    ]

.. autoclass:: bokeh.models.glyphs.MultiLine
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "548591a7-553d-4452-92fc-575b69a86288",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "tags": [],
          "visible": null,
          "xs": {
            "field": "xs",
            "units": "data"
          },
          "ys": {
            "field": "ys",
            "units": "data"
          }
        },
        "id": "548591a7-553d-4452-92fc-575b69a86288",
        "type": "MultiLine"
      }
    ]

.. autoclass:: bokeh.models.glyphs.Oval
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "angle": {
            "field": "angle",
            "units": "data"
          },
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "height": {
            "field": "height",
            "units": "data"
          },
          "id": "b3603842-75b8-48cd-9048-70cd7cf6d565",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "tags": [],
          "visible": null,
          "width": {
            "field": "width",
            "units": "data"
          },
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "b3603842-75b8-48cd-9048-70cd7cf6d565",
        "type": "Oval"
      }
    ]

.. autoclass:: bokeh.models.glyphs.Patch
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "5e5cfe82-f56f-40ae-a84c-306d44069730",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "5e5cfe82-f56f-40ae-a84c-306d44069730",
        "type": "Patch"
      }
    ]

.. autoclass:: bokeh.models.glyphs.Patches
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "cb335f7b-3fb3-4fe2-bbed-41f26a86c366",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "tags": [],
          "visible": null,
          "xs": {
            "field": "xs",
            "units": "data"
          },
          "ys": {
            "field": "ys",
            "units": "data"
          }
        },
        "id": "cb335f7b-3fb3-4fe2-bbed-41f26a86c366",
        "type": "Patches"
      }
    ]

.. autoclass:: bokeh.models.glyphs.Quad
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "bottom": {
            "field": "bottom",
            "units": "data"
          },
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "407e156d-34a8-4a61-80d3-60dc2b947072",
          "left": {
            "field": "left",
            "units": "data"
          },
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "right": {
            "field": "right",
            "units": "data"
          },
          "tags": [],
          "top": {
            "field": "top",
            "units": "data"
          },
          "visible": null
        },
        "id": "407e156d-34a8-4a61-80d3-60dc2b947072",
        "type": "Quad"
      }
    ]

.. autoclass:: bokeh.models.glyphs.Quadratic
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "cx": {
            "field": "cx",
            "units": "data"
          },
          "cy": {
            "field": "cy",
            "units": "data"
          },
          "doc": null,
          "id": "0f59bb28-295f-4c6a-8c28-a402f92d2976",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "tags": [],
          "visible": null,
          "x0": {
            "field": "x0",
            "units": "data"
          },
          "x1": {
            "field": "x1",
            "units": "data"
          },
          "y0": {
            "field": "y0",
            "units": "data"
          },
          "y1": {
            "field": "y1",
            "units": "data"
          }
        },
        "id": "0f59bb28-295f-4c6a-8c28-a402f92d2976",
        "type": "Quadratic"
      }
    ]

.. autoclass:: bokeh.models.glyphs.Ray
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "angle": {
            "field": "angle",
            "units": "data"
          },
          "doc": null,
          "id": "ebfd362b-359c-4650-acee-772e73f99d75",
          "length": null,
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "ebfd362b-359c-4650-acee-772e73f99d75",
        "type": "Ray"
      }
    ]

.. autoclass:: bokeh.models.glyphs.Rect
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "angle": {
            "field": "angle",
            "units": "data"
          },
          "dilate": false,
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "height": {
            "field": "height",
            "units": "data"
          },
          "id": "968096ec-48c6-4417-bcd7-17b62c70bd27",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "tags": [],
          "visible": null,
          "width": {
            "field": "width",
            "units": "data"
          },
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "968096ec-48c6-4417-bcd7-17b62c70bd27",
        "type": "Rect"
      }
    ]

.. autoclass:: bokeh.models.glyphs.Segment
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "e8baa778-6f41-4153-b459-20f387080223",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "tags": [],
          "visible": null,
          "x0": {
            "field": "x0",
            "units": "data"
          },
          "x1": {
            "field": "x1",
            "units": "data"
          },
          "y0": {
            "field": "y0",
            "units": "data"
          },
          "y1": {
            "field": "y1",
            "units": "data"
          }
        },
        "id": "e8baa778-6f41-4153-b459-20f387080223",
        "type": "Segment"
      }
    ]

.. autoclass:: bokeh.models.glyphs.Text
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "angle": {
            "units": "data",
            "value": 0
          },
          "doc": null,
          "id": "3c52f6ce-7450-4350-9614-6524ea18fc20",
          "name": null,
          "tags": [],
          "text": {
            "field": "text",
            "units": "data"
          },
          "text_align": "left",
          "text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "text_baseline": "bottom",
          "text_color": {
            "value": "#444444"
          },
          "text_font": "Helvetica",
          "text_font_size": "12pt",
          "text_font_style": "normal",
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "x_offset": {
            "units": "screen",
            "value": 0
          },
          "y": {
            "field": "y",
            "units": "data"
          },
          "y_offset": {
            "units": "screen",
            "value": 0
          }
        },
        "id": "3c52f6ce-7450-4350-9614-6524ea18fc20",
        "type": "Text"
      }
    ]

.. autoclass:: bokeh.models.glyphs.Wedge
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "direction": "clock",
          "doc": null,
          "end_angle": {
            "field": "end_angle",
            "units": "data"
          },
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "3af1795b-109d-4f4a-85a7-90f19e25527c",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "radius": null,
          "start_angle": {
            "field": "start_angle",
            "units": "data"
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "3af1795b-109d-4f4a-85a7-90f19e25527c",
        "type": "Wedge"
      }
    ]

.. _bokeh_dot_models_dot_grids:

``bokeh.models.grids``
----------------------

.. autoclass:: bokeh.models.grids.Grid
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "bounds": "auto",
          "dimension": 0,
          "doc": null,
          "grid_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "grid_line_cap": "butt",
          "grid_line_color": {
            "value": "black"
          },
          "grid_line_dash": [],
          "grid_line_dash_offset": 0,
          "grid_line_join": "miter",
          "grid_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "id": "e7b4b5dd-2a94-4a08-b52a-25f6d201c447",
          "name": null,
          "plot": null,
          "tags": [],
          "ticker": null,
          "x_range_name": "default",
          "y_range_name": "default"
        },
        "id": "e7b4b5dd-2a94-4a08-b52a-25f6d201c447",
        "type": "Grid"
      }
    ]

.. _bokeh_dot_models_dot_map_plots:

``bokeh.models.map_plots``
--------------------------

.. autoclass:: bokeh.models.map_plots.GMapPlot
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "geometries": [],
          "id": "ced0542d-2175-4bc4-817c-e464726554e5",
          "name": null,
          "tags": []
        },
        "id": "ced0542d-2175-4bc4-817c-e464726554e5",
        "type": "ToolEvents"
      },
      {
        "attributes": {
          "above": [],
          "background_fill": "white",
          "below": [],
          "border_fill": "white",
          "disabled": false,
          "doc": null,
          "extra_x_ranges": {},
          "extra_y_ranges": {},
          "h_symmetry": true,
          "id": "372c94d7-9540-48c2-8049-1d4559702395",
          "left": [],
          "logo": "normal",
          "map_options": null,
          "min_border": 50,
          "min_border_bottom": 50,
          "min_border_left": 50,
          "min_border_right": 50,
          "min_border_top": 50,
          "name": null,
          "outline_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "outline_line_cap": "butt",
          "outline_line_color": {
            "value": "black"
          },
          "outline_line_dash": [],
          "outline_line_dash_offset": 0,
          "outline_line_join": "miter",
          "outline_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "plot_height": 600,
          "plot_width": 600,
          "renderers": [],
          "right": [],
          "tags": [],
          "title": "",
          "title_text_align": "left",
          "title_text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "title_text_baseline": "bottom",
          "title_text_color": {
            "value": "#444444"
          },
          "title_text_font": "Helvetica",
          "title_text_font_size": "12pt",
          "title_text_font_style": "normal",
          "tool_events": {
            "id": "ced0542d-2175-4bc4-817c-e464726554e5",
            "type": "ToolEvents"
          },
          "toolbar_location": "above",
          "tools": [],
          "v_symmetry": false,
          "x_mapper_type": "auto",
          "x_range": null,
          "y_mapper_type": "auto",
          "y_range": null
        },
        "id": "372c94d7-9540-48c2-8049-1d4559702395",
        "type": "GMapPlot"
      }
    ]

.. autoclass:: bokeh.models.map_plots.GeoJSPlot
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "above": [],
          "background_fill": "white",
          "below": [],
          "border_fill": "white",
          "disabled": false,
          "doc": null,
          "extra_x_ranges": {},
          "extra_y_ranges": {},
          "h_symmetry": true,
          "id": "d4e6a1b5-c1f3-4591-a2c7-cbc9cdaec17d",
          "left": [],
          "logo": "normal",
          "map_options": null,
          "min_border": 50,
          "min_border_bottom": 50,
          "min_border_left": 50,
          "min_border_right": 50,
          "min_border_top": 50,
          "name": null,
          "outline_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "outline_line_cap": "butt",
          "outline_line_color": {
            "value": "black"
          },
          "outline_line_dash": [],
          "outline_line_dash_offset": 0,
          "outline_line_join": "miter",
          "outline_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "plot_height": 600,
          "plot_width": 600,
          "renderers": [],
          "right": [],
          "tags": [],
          "title": "",
          "title_text_align": "left",
          "title_text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "title_text_baseline": "bottom",
          "title_text_color": {
            "value": "#444444"
          },
          "title_text_font": "Helvetica",
          "title_text_font_size": "12pt",
          "title_text_font_style": "normal",
          "tool_events": {
            "id": "6d33edce-3405-49d3-a812-e992852e041c",
            "type": "ToolEvents"
          },
          "toolbar_location": "above",
          "tools": [],
          "v_symmetry": false,
          "x_mapper_type": "auto",
          "x_range": null,
          "y_mapper_type": "auto",
          "y_range": null
        },
        "id": "d4e6a1b5-c1f3-4591-a2c7-cbc9cdaec17d",
        "type": "GeoJSPlot"
      },
      {
        "attributes": {
          "doc": null,
          "geometries": [],
          "id": "6d33edce-3405-49d3-a812-e992852e041c",
          "name": null,
          "tags": []
        },
        "id": "6d33edce-3405-49d3-a812-e992852e041c",
        "type": "ToolEvents"
      }
    ]

.. _bokeh_dot_models_dot_mappers:

``bokeh.models.mappers``
------------------------

.. autoclass:: bokeh.models.mappers.ColorMapper
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "a2c00451-1672-411b-9ced-06606a2bd02b",
          "name": null,
          "tags": []
        },
        "id": "a2c00451-1672-411b-9ced-06606a2bd02b",
        "type": "ColorMapper"
      }
    ]

.. autoclass:: bokeh.models.mappers.LinearColorMapper
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "high": null,
          "id": "2dd5f261-2987-403f-ad34-edf6bcbe28bb",
          "low": null,
          "name": null,
          "palette": null,
          "reserve_color": "#ffffff",
          "reserve_val": null,
          "tags": []
        },
        "id": "2dd5f261-2987-403f-ad34-edf6bcbe28bb",
        "type": "LinearColorMapper"
      }
    ]

.. _bokeh_dot_models_dot_markers:

``bokeh.models.markers``
------------------------

.. autoclass:: bokeh.models.markers.Asterisk
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "9cef475e-d115-4af4-9d27-4cf3fd9b1017",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "size": {
            "units": "screen",
            "value": 4
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "9cef475e-d115-4af4-9d27-4cf3fd9b1017",
        "type": "Asterisk"
      }
    ]

.. autoclass:: bokeh.models.markers.Circle
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "1715cc4d-9e0c-487a-9c9b-89e04d801741",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "radius": null,
          "size": {
            "units": "screen",
            "value": 4
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "1715cc4d-9e0c-487a-9c9b-89e04d801741",
        "type": "Circle"
      }
    ]

.. autoclass:: bokeh.models.markers.CircleCross
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "f3dbf21d-9a9c-4df6-9db9-4dc59b2d45cb",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "size": {
            "units": "screen",
            "value": 4
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "f3dbf21d-9a9c-4df6-9db9-4dc59b2d45cb",
        "type": "CircleCross"
      }
    ]

.. autoclass:: bokeh.models.markers.CircleX
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "4bfb9769-4878-454d-a004-4342945137a6",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "size": {
            "units": "screen",
            "value": 4
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "4bfb9769-4878-454d-a004-4342945137a6",
        "type": "CircleX"
      }
    ]

.. autoclass:: bokeh.models.markers.Cross
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "38e55806-72c0-4b82-aaa2-91a7110078ff",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "size": {
            "units": "screen",
            "value": 4
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "38e55806-72c0-4b82-aaa2-91a7110078ff",
        "type": "Cross"
      }
    ]

.. autoclass:: bokeh.models.markers.Diamond
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "c3070848-ed21-4162-bfb8-80414819cfa0",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "size": {
            "units": "screen",
            "value": 4
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "c3070848-ed21-4162-bfb8-80414819cfa0",
        "type": "Diamond"
      }
    ]

.. autoclass:: bokeh.models.markers.DiamondCross
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "44712656-2260-48df-a6be-6e0dc36a16b0",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "size": {
            "units": "screen",
            "value": 4
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "44712656-2260-48df-a6be-6e0dc36a16b0",
        "type": "DiamondCross"
      }
    ]

.. autoclass:: bokeh.models.markers.InvertedTriangle
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "5353290d-8fc8-4867-942b-997eaddb59dd",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "size": {
            "units": "screen",
            "value": 4
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "5353290d-8fc8-4867-942b-997eaddb59dd",
        "type": "InvertedTriangle"
      }
    ]

.. autoclass:: bokeh.models.markers.Marker
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "759bdf26-1b6e-428d-8f99-154dc8de33e7",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "size": {
            "units": "screen",
            "value": 4
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "759bdf26-1b6e-428d-8f99-154dc8de33e7",
        "type": "Marker"
      }
    ]

.. autoclass:: bokeh.models.markers.Square
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "angle": {
            "field": "angle",
            "units": "data"
          },
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "f192e3eb-213b-41fa-8931-d0f87011c60d",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "size": {
            "units": "screen",
            "value": 4
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "f192e3eb-213b-41fa-8931-d0f87011c60d",
        "type": "Square"
      }
    ]

.. autoclass:: bokeh.models.markers.SquareCross
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "b2c97c70-62e4-42a1-b10a-c3a703de8134",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "size": {
            "units": "screen",
            "value": 4
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "b2c97c70-62e4-42a1-b10a-c3a703de8134",
        "type": "SquareCross"
      }
    ]

.. autoclass:: bokeh.models.markers.SquareX
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "2b8141a4-e58a-49ed-a692-2afe05ecdbcc",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "size": {
            "units": "screen",
            "value": 4
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "2b8141a4-e58a-49ed-a692-2afe05ecdbcc",
        "type": "SquareX"
      }
    ]

.. autoclass:: bokeh.models.markers.Triangle
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "8517f033-b811-47eb-93a8-8e7f4a2622e3",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "size": {
            "units": "screen",
            "value": 4
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "8517f033-b811-47eb-93a8-8e7f4a2622e3",
        "type": "Triangle"
      }
    ]

.. autoclass:: bokeh.models.markers.X
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "fill_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "fill_color": {
            "value": "gray"
          },
          "id": "009a5479-0fe3-4b8e-bd78-9e7681e07649",
          "line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "line_cap": "butt",
          "line_color": {
            "value": "black"
          },
          "line_dash": [],
          "line_dash_offset": 0,
          "line_join": "miter",
          "line_width": {
            "field": "line_width",
            "units": "data"
          },
          "name": null,
          "size": {
            "units": "screen",
            "value": 4
          },
          "tags": [],
          "visible": null,
          "x": {
            "field": "x",
            "units": "data"
          },
          "y": {
            "field": "y",
            "units": "data"
          }
        },
        "id": "009a5479-0fe3-4b8e-bd78-9e7681e07649",
        "type": "X"
      }
    ]

.. _bokeh_dot_models_dot_plots:

``bokeh.models.plots``
----------------------

.. autoclass:: bokeh.models.plots.GridPlot
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "geometries": [],
          "id": "1b5c07db-90b7-4180-b286-c1f687bf9e09",
          "name": null,
          "tags": []
        },
        "id": "1b5c07db-90b7-4180-b286-c1f687bf9e09",
        "type": "ToolEvents"
      },
      {
        "attributes": {
          "above": [],
          "background_fill": "white",
          "below": [],
          "border_fill": "white",
          "border_space": 0,
          "children": [],
          "disabled": false,
          "doc": null,
          "extra_x_ranges": {},
          "extra_y_ranges": {},
          "h_symmetry": true,
          "id": "390c4acc-4b13-465b-9ca6-f4aa2092cb39",
          "left": [],
          "logo": "normal",
          "min_border": 50,
          "min_border_bottom": 50,
          "min_border_left": 50,
          "min_border_right": 50,
          "min_border_top": 50,
          "name": null,
          "outline_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "outline_line_cap": "butt",
          "outline_line_color": {
            "value": "black"
          },
          "outline_line_dash": [],
          "outline_line_dash_offset": 0,
          "outline_line_join": "miter",
          "outline_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "plot_height": 600,
          "plot_width": 600,
          "renderers": [],
          "right": [],
          "tags": [],
          "title": "",
          "title_text_align": "left",
          "title_text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "title_text_baseline": "bottom",
          "title_text_color": {
            "value": "#444444"
          },
          "title_text_font": "Helvetica",
          "title_text_font_size": "12pt",
          "title_text_font_style": "normal",
          "tool_events": {
            "id": "1b5c07db-90b7-4180-b286-c1f687bf9e09",
            "type": "ToolEvents"
          },
          "toolbar_location": "above",
          "tools": [],
          "v_symmetry": false,
          "x_mapper_type": "auto",
          "x_range": null,
          "y_mapper_type": "auto",
          "y_range": null
        },
        "id": "390c4acc-4b13-465b-9ca6-f4aa2092cb39",
        "type": "GridPlot"
      }
    ]

.. autoclass:: bokeh.models.plots.Plot
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "above": [],
          "background_fill": "white",
          "below": [],
          "border_fill": "white",
          "disabled": false,
          "doc": null,
          "extra_x_ranges": {},
          "extra_y_ranges": {},
          "h_symmetry": true,
          "id": "84e91fd6-3631-45dc-b949-08b5c9bb31a0",
          "left": [],
          "logo": "normal",
          "min_border": 50,
          "min_border_bottom": 50,
          "min_border_left": 50,
          "min_border_right": 50,
          "min_border_top": 50,
          "name": null,
          "outline_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "outline_line_cap": "butt",
          "outline_line_color": {
            "value": "black"
          },
          "outline_line_dash": [],
          "outline_line_dash_offset": 0,
          "outline_line_join": "miter",
          "outline_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "plot_height": 600,
          "plot_width": 600,
          "renderers": [],
          "right": [],
          "tags": [],
          "title": "",
          "title_text_align": "left",
          "title_text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "title_text_baseline": "bottom",
          "title_text_color": {
            "value": "#444444"
          },
          "title_text_font": "Helvetica",
          "title_text_font_size": "12pt",
          "title_text_font_style": "normal",
          "tool_events": {
            "id": "43aa5a55-1efb-4eef-872d-76db813c2981",
            "type": "ToolEvents"
          },
          "toolbar_location": "above",
          "tools": [],
          "v_symmetry": false,
          "x_mapper_type": "auto",
          "x_range": null,
          "y_mapper_type": "auto",
          "y_range": null
        },
        "id": "84e91fd6-3631-45dc-b949-08b5c9bb31a0",
        "type": "Plot"
      },
      {
        "attributes": {
          "doc": null,
          "geometries": [],
          "id": "43aa5a55-1efb-4eef-872d-76db813c2981",
          "name": null,
          "tags": []
        },
        "id": "43aa5a55-1efb-4eef-872d-76db813c2981",
        "type": "ToolEvents"
      }
    ]

.. autoclass:: bokeh.models.plots.PlotContext
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "children": [],
          "doc": null,
          "id": "df6f0782-1525-4ec3-971e-d43bfca3b12b",
          "name": null,
          "tags": []
        },
        "id": "df6f0782-1525-4ec3-971e-d43bfca3b12b",
        "type": "PlotContext"
      }
    ]

.. autoclass:: bokeh.models.plots.PlotList
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "children": [],
          "doc": null,
          "id": "1b72c981-6b72-447b-8679-997ffeec7ebd",
          "name": null,
          "tags": []
        },
        "id": "1b72c981-6b72-447b-8679-997ffeec7ebd",
        "type": "PlotList"
      }
    ]

.. _bokeh_dot_models_dot_ranges:

``bokeh.models.ranges``
-----------------------

.. autoclass:: bokeh.models.ranges.DataRange
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "123a367c-563b-47c9-995f-80091c713d2e",
          "name": null,
          "sources": [],
          "tags": []
        },
        "id": "123a367c-563b-47c9-995f-80091c713d2e",
        "type": "DataRange"
      }
    ]

.. autoclass:: bokeh.models.ranges.DataRange1d
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "end": null,
          "id": "b97516f7-52f5-45ca-9d3d-98853d2d7fd0",
          "name": null,
          "rangepadding": 0.1,
          "sources": [],
          "start": null,
          "tags": []
        },
        "id": "b97516f7-52f5-45ca-9d3d-98853d2d7fd0",
        "type": "DataRange1d"
      }
    ]

.. autoclass:: bokeh.models.ranges.FactorRange
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "factors": [],
          "id": "e0f2aafa-0c10-4802-876f-b1e250784838",
          "name": null,
          "tags": []
        },
        "id": "e0f2aafa-0c10-4802-876f-b1e250784838",
        "type": "FactorRange"
      }
    ]

.. autoclass:: bokeh.models.ranges.Range
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "2dd2ab7e-9f14-46e7-99b1-ede87bb67e34",
          "name": null,
          "tags": []
        },
        "id": "2dd2ab7e-9f14-46e7-99b1-ede87bb67e34",
        "type": "Range"
      }
    ]

.. autoclass:: bokeh.models.ranges.Range1d
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "end": null,
          "id": "8d6f3585-aaa7-4962-9d16-c1d421ed27b8",
          "name": null,
          "start": null,
          "tags": []
        },
        "id": "8d6f3585-aaa7-4962-9d16-c1d421ed27b8",
        "type": "Range1d"
      }
    ]

.. _bokeh_dot_models_dot_renderers:

``bokeh.models.renderers``
--------------------------

.. autoclass:: bokeh.models.renderers.GlyphRenderer
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "data_source": null,
          "doc": null,
          "glyph": null,
          "id": "6ca062c9-d6f8-433d-9dcb-f8aaaf0c2d55",
          "name": null,
          "nonselection_glyph": null,
          "selection_glyph": null,
          "server_data_source": null,
          "tags": [],
          "units": "screen",
          "x_range_name": "default",
          "y_range_name": "default"
        },
        "id": "6ca062c9-d6f8-433d-9dcb-f8aaaf0c2d55",
        "type": "GlyphRenderer"
      }
    ]

.. autoclass:: bokeh.models.renderers.GuideRenderer
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "e45f6dbe-05fa-424e-b334-ec46ed2f52d7",
          "name": null,
          "plot": null,
          "tags": []
        },
        "id": "e45f6dbe-05fa-424e-b334-ec46ed2f52d7",
        "type": "GuideRenderer"
      }
    ]

.. autoclass:: bokeh.models.renderers.Legend
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "border_line_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "border_line_cap": "butt",
          "border_line_color": {
            "value": "black"
          },
          "border_line_dash": [],
          "border_line_dash_offset": 0,
          "border_line_join": "miter",
          "border_line_width": {
            "field": "line_width",
            "units": "data"
          },
          "doc": null,
          "glyph_height": 20,
          "glyph_width": 20,
          "id": "5ac2610e-ac9a-4ea2-ad2c-bd000ba725df",
          "label_height": 20,
          "label_standoff": 15,
          "label_text_align": "left",
          "label_text_alpha": {
            "field": 1.0,
            "units": "data"
          },
          "label_text_baseline": "bottom",
          "label_text_color": {
            "value": "#444444"
          },
          "label_text_font": "Helvetica",
          "label_text_font_size": "12pt",
          "label_text_font_style": "normal",
          "label_width": 50,
          "legend_padding": 10,
          "legend_spacing": 3,
          "legends": [],
          "name": null,
          "orientation": "top_right",
          "plot": null,
          "tags": []
        },
        "id": "5ac2610e-ac9a-4ea2-ad2c-bd000ba725df",
        "type": "Legend"
      }
    ]

.. autoclass:: bokeh.models.renderers.Renderer
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "29658d69-f5e5-4c1f-b2bf-a0a5f988cf54",
          "name": null,
          "tags": []
        },
        "id": "29658d69-f5e5-4c1f-b2bf-a0a5f988cf54",
        "type": "Renderer"
      }
    ]

.. _bokeh_dot_models_dot_sources:

``bokeh.models.sources``
------------------------

.. autoclass:: bokeh.models.sources.ColumnDataSource
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "column_names": [],
          "data": {},
          "doc": null,
          "id": "9b10654c-0364-4896-9a65-76ea72f76ee6",
          "name": null,
          "selected": [],
          "tags": []
        },
        "id": "9b10654c-0364-4896-9a65-76ea72f76ee6",
        "type": "ColumnDataSource"
      }
    ]

.. autoclass:: bokeh.models.sources.DataSource
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "column_names": [],
          "doc": null,
          "id": "233d544e-3dd0-4b1c-abce-2fc1bc9ad1e3",
          "name": null,
          "selected": [],
          "tags": []
        },
        "id": "233d544e-3dd0-4b1c-abce-2fc1bc9ad1e3",
        "type": "DataSource"
      }
    ]

.. autoclass:: bokeh.models.sources.ServerDataSource
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "column_names": [],
          "data": {},
          "data_url": null,
          "doc": null,
          "id": "2ab633eb-b5b1-4e13-a1e8-1bbd5a68c585",
          "name": null,
          "owner_username": null,
          "selected": [],
          "tags": [],
          "transform": {}
        },
        "id": "2ab633eb-b5b1-4e13-a1e8-1bbd5a68c585",
        "type": "ServerDataSource"
      }
    ]

.. _bokeh_dot_models_dot_tickers:

``bokeh.models.tickers``
------------------------

.. autoclass:: bokeh.models.tickers.AdaptiveTicker
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "base": 10.0,
          "doc": null,
          "id": "7cb9bab0-c114-4438-ae04-4cb4d25e4391",
          "mantissas": [
            2,
            5,
            10
          ],
          "max_interval": 100.0,
          "min_interval": 0.0,
          "name": null,
          "num_minor_ticks": 5,
          "tags": []
        },
        "id": "7cb9bab0-c114-4438-ae04-4cb4d25e4391",
        "type": "AdaptiveTicker"
      }
    ]

.. autoclass:: bokeh.models.tickers.BasicTicker
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "base": 10.0,
          "doc": null,
          "id": "857ff52a-161f-4e3f-b6fa-c6ec655550ea",
          "mantissas": [
            2,
            5,
            10
          ],
          "max_interval": 100.0,
          "min_interval": 0.0,
          "name": null,
          "num_minor_ticks": 5,
          "tags": []
        },
        "id": "857ff52a-161f-4e3f-b6fa-c6ec655550ea",
        "type": "BasicTicker"
      }
    ]

.. autoclass:: bokeh.models.tickers.CategoricalTicker
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "5daefdda-b482-4e19-85ed-e1a0b312a200",
          "name": null,
          "num_minor_ticks": 5,
          "tags": []
        },
        "id": "5daefdda-b482-4e19-85ed-e1a0b312a200",
        "type": "CategoricalTicker"
      }
    ]

.. autoclass:: bokeh.models.tickers.CompositeTicker
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "af503c4a-13da-4398-bff1-cc5ab0cf512c",
          "name": null,
          "num_minor_ticks": 5,
          "tags": [],
          "tickers": []
        },
        "id": "af503c4a-13da-4398-bff1-cc5ab0cf512c",
        "type": "CompositeTicker"
      }
    ]

.. autoclass:: bokeh.models.tickers.DatetimeTicker
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "e6efafa0-36b6-4fab-9914-5479c50a25b2",
          "name": null,
          "num_minor_ticks": 5,
          "tags": []
        },
        "id": "e6efafa0-36b6-4fab-9914-5479c50a25b2",
        "type": "DatetimeTicker"
      }
    ]

.. autoclass:: bokeh.models.tickers.DaysTicker
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "days": [],
          "doc": null,
          "id": "4eabad69-8b13-43d1-a112-fb345b4d21ff",
          "interval": null,
          "name": null,
          "num_minor_ticks": 5,
          "tags": []
        },
        "id": "4eabad69-8b13-43d1-a112-fb345b4d21ff",
        "type": "DaysTicker"
      }
    ]

.. autoclass:: bokeh.models.tickers.LogTicker
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "base": 10.0,
          "doc": null,
          "id": "2ded7eb1-3117-42f1-aa59-4ca6dfbb4bf4",
          "mantissas": [
            2,
            5,
            10
          ],
          "max_interval": 100.0,
          "min_interval": 0.0,
          "name": null,
          "num_minor_ticks": 5,
          "tags": []
        },
        "id": "2ded7eb1-3117-42f1-aa59-4ca6dfbb4bf4",
        "type": "LogTicker"
      }
    ]

.. autoclass:: bokeh.models.tickers.MonthsTicker
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "4dc62809-99bd-482f-bfe9-0ee78a77295a",
          "interval": null,
          "months": [],
          "name": null,
          "num_minor_ticks": 5,
          "tags": []
        },
        "id": "4dc62809-99bd-482f-bfe9-0ee78a77295a",
        "type": "MonthsTicker"
      }
    ]

.. autoclass:: bokeh.models.tickers.SingleIntervalTicker
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "3b004847-c776-42a5-a23e-942e512dd068",
          "interval": null,
          "name": null,
          "num_minor_ticks": 5,
          "tags": []
        },
        "id": "3b004847-c776-42a5-a23e-942e512dd068",
        "type": "SingleIntervalTicker"
      }
    ]

.. autoclass:: bokeh.models.tickers.Ticker
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "3c6cf35c-e06b-4d27-84ea-48f5f8d99a06",
          "name": null,
          "num_minor_ticks": 5,
          "tags": []
        },
        "id": "3c6cf35c-e06b-4d27-84ea-48f5f8d99a06",
        "type": "Ticker"
      }
    ]

.. autoclass:: bokeh.models.tickers.YearsTicker
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "7a1759b2-5923-468a-8730-d03482bf3d63",
          "interval": null,
          "name": null,
          "num_minor_ticks": 5,
          "tags": []
        },
        "id": "7a1759b2-5923-468a-8730-d03482bf3d63",
        "type": "YearsTicker"
      }
    ]

.. _bokeh_dot_models_dot_tools:

``bokeh.models.tools``
----------------------

.. autoclass:: bokeh.models.tools.BoxSelectTool
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "dimensions": [
            "width",
            "height"
          ],
          "doc": null,
          "id": "eebce4c7-c9e6-49cf-a687-995b0f3267c0",
          "name": null,
          "names": [],
          "plot": null,
          "renderers": [],
          "select_every_mousemove": true,
          "tags": []
        },
        "id": "eebce4c7-c9e6-49cf-a687-995b0f3267c0",
        "type": "BoxSelectTool"
      }
    ]

.. autoclass:: bokeh.models.tools.BoxSelectionOverlay
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "ca007588-4d82-4975-b59d-ec96e0b8f35f",
          "name": null,
          "tags": [],
          "tool": null
        },
        "id": "ca007588-4d82-4975-b59d-ec96e0b8f35f",
        "type": "BoxSelection"
      }
    ]

.. autoclass:: bokeh.models.tools.BoxZoomTool
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "e7b722ed-ce1c-4336-bbcd-7580ca064abf",
          "name": null,
          "plot": null,
          "tags": []
        },
        "id": "e7b722ed-ce1c-4336-bbcd-7580ca064abf",
        "type": "BoxZoomTool"
      }
    ]

.. autoclass:: bokeh.models.tools.CrosshairTool
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "fd6c707c-e298-4eb7-8742-6101cf0f6962",
          "name": null,
          "plot": null,
          "tags": []
        },
        "id": "fd6c707c-e298-4eb7-8742-6101cf0f6962",
        "type": "CrosshairTool"
      }
    ]

.. autoclass:: bokeh.models.tools.HoverTool
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "always_active": true,
          "doc": null,
          "id": "8a002e27-ede2-4742-972b-69de56ccf9ab",
          "name": null,
          "names": [],
          "plot": null,
          "renderers": [],
          "snap_to_data": true,
          "tags": [],
          "tooltips": []
        },
        "id": "8a002e27-ede2-4742-972b-69de56ccf9ab",
        "type": "HoverTool"
      }
    ]

.. autoclass:: bokeh.models.tools.LassoSelectTool
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "27ec007b-456f-4cbe-a23b-b95621489d8f",
          "name": null,
          "names": [],
          "plot": null,
          "renderers": [],
          "select_every_mousemove": true,
          "tags": []
        },
        "id": "27ec007b-456f-4cbe-a23b-b95621489d8f",
        "type": "LassoSelectTool"
      }
    ]

.. autoclass:: bokeh.models.tools.PanTool
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "dimensions": [
            "width",
            "height"
          ],
          "doc": null,
          "id": "8393c568-3139-42c0-8eff-cf12c0889a2a",
          "name": null,
          "plot": null,
          "tags": []
        },
        "id": "8393c568-3139-42c0-8eff-cf12c0889a2a",
        "type": "PanTool"
      }
    ]

.. autoclass:: bokeh.models.tools.PolySelectTool
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "30c407d1-b414-4861-8226-73225150fc9e",
          "name": null,
          "names": [],
          "plot": null,
          "renderers": [],
          "tags": []
        },
        "id": "30c407d1-b414-4861-8226-73225150fc9e",
        "type": "PolySelectTool"
      }
    ]

.. autoclass:: bokeh.models.tools.PreviewSaveTool
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "bf1be86c-6ced-4ba5-ad93-50e6484d7689",
          "name": null,
          "plot": null,
          "tags": []
        },
        "id": "bf1be86c-6ced-4ba5-ad93-50e6484d7689",
        "type": "PreviewSaveTool"
      }
    ]

.. autoclass:: bokeh.models.tools.ResetTool
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "fbe1f9b0-ce17-4052-ae32-d170d3841b3a",
          "name": null,
          "plot": null,
          "tags": []
        },
        "id": "fbe1f9b0-ce17-4052-ae32-d170d3841b3a",
        "type": "ResetTool"
      }
    ]

.. autoclass:: bokeh.models.tools.ResizeTool
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "185bd998-55db-4a90-8ddd-92b7e24344a3",
          "name": null,
          "plot": null,
          "tags": []
        },
        "id": "185bd998-55db-4a90-8ddd-92b7e24344a3",
        "type": "ResizeTool"
      }
    ]

.. autoclass:: bokeh.models.tools.TapTool
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "always_active": true,
          "doc": null,
          "id": "181c4fb7-a7af-46ed-ae9d-347c7996e402",
          "name": null,
          "names": [],
          "plot": null,
          "tags": []
        },
        "id": "181c4fb7-a7af-46ed-ae9d-347c7996e402",
        "type": "TapTool"
      }
    ]

.. autoclass:: bokeh.models.tools.Tool
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "id": "6f5d1c63-03e2-4777-9efb-7937e10289a9",
          "name": null,
          "plot": null,
          "tags": []
        },
        "id": "6f5d1c63-03e2-4777-9efb-7937e10289a9",
        "type": "Tool"
      }
    ]

.. autoclass:: bokeh.models.tools.ToolEvents
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "doc": null,
          "geometries": [],
          "id": "9713f0fe-309c-40e3-964a-a5cf75ad99a5",
          "name": null,
          "tags": []
        },
        "id": "9713f0fe-309c-40e3-964a-a5cf75ad99a5",
        "type": "ToolEvents"
      }
    ]

.. autoclass:: bokeh.models.tools.WheelZoomTool
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "dimensions": [
            "width",
            "height"
          ],
          "doc": null,
          "id": "ed5541e8-d7b0-4b16-86fd-f3f31045944d",
          "name": null,
          "plot": null,
          "tags": []
        },
        "id": "ed5541e8-d7b0-4b16-86fd-f3f31045944d",
        "type": "WheelZoomTool"
      }
    ]

.. _bokeh_dot_models_dot_widget:

``bokeh.models.widget``
-----------------------

.. autoclass:: bokeh.models.widget.Widget
    :members:


.. code-block:: javascript

    [
      {
        "attributes": {
          "disabled": false,
          "doc": null,
          "id": "b2044fbc-c544-4a7a-96b1-f297a057c0de",
          "name": null,
          "tags": []
        },
        "id": "b2044fbc-c544-4a7a-96b1-f297a057c0de",
        "type": "Widget"
      }
    ]


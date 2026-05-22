import Bokeh from "/static/js/bokeh.esm.js"
import "/static/js/bokeh-widgets.esm.js"
import "/static/js/bokeh-api.esm.js"

export namespace I18nLines {
  import plt = Bokeh.Plotting

  Bokeh.set_log_level("info")
  Bokeh.logger.info(`Bokeh ${Bokeh.version}`)

  const p = plt.figure()

  p.title = "Multi-line plot translation example"
  p.xaxis.axis_label = "X-Axis"
  p.yaxis.axis_label = "Y-Axis"
  p.line([1, 2, 3], [1, 3, 2], {color: "orange", legend_label: "orange", line_width: 4})
  p.line([1, 2, 3], [3, 4, 3], {color: "red", legend_label: "red", line_width: 4})
  p.line([3, 2, 1], [3, 2, 1], {color: "blue", legend_label: "blue", line_width: 4})
  p.legend.title = new Bokeh.TranslatableText({content: "Available colors"})

  const language_dropdown = new Bokeh.Widgets.LanguageDropdown()

  void plt.show(new Bokeh.Column({children: [language_dropdown, p]}))

  Bokeh.documents[0].config.i18n.set_config(
    ["en", "es-CO", "pl-PL", "fr-FR", "de-DE", "hi-IN", "pt-BR", "ar"],
    `{
      "en": {},
      "es-CO": {},
      "pl-PL": {},
      "fr-FR": {},
      "de-DE": {},
      "hi-IN": {},
      "pt-BR": {}
     }`,
    [
      ["English", "en"],
      ["Español (CO)", "es-CO"],
      ["Polski (PL)", "pl-PL"],
      ["Français (FR)", "fr-FR"],
      ["Deutsch (DE)", "de-DE"],
      ["हिन्दी", "hi-IN"],
      ["Português (BR)", "pt-BR"],
      ["اَلْعَرَبِيَّةُ", "ar"],
    ],
    "en",
    true,
  )
}

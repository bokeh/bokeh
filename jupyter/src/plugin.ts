import {JupyterFrontEnd, JupyterFrontEndPlugin} from "@jupyterlab/application"

import {installExportInterceptor} from "./export"
import {NotebookExtension} from "./notebook"

export const extension: JupyterFrontEndPlugin<void> = {
  id: "@bokeh/bokeh-jupyter:renderer",
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    const notebooks = new NotebookExtension(app.serviceManager.contents)
    app.docRegistry.addWidgetExtension("Notebook", notebooks)
    installExportInterceptor(app, notebooks)
  },
}

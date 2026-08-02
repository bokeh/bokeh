import {CUSTOM_ELEMENTS_SCHEMA, Component} from "@angular/core"
import {bootstrapApplication} from "@angular/platform-browser"
import {defineBokehElement} from "@bokeh/web-component"
import {Plotting} from "@bokeh/bokehjs"

defineBokehElement()

@Component({
  selector: "app-root",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<bokeh-plot [model]="plot"></bokeh-plot>`,
})
class App {
  readonly plot = Plotting.figure({title: "BokehJS with Angular", width: 500, height: 300})

  constructor() {
    this.plot.line([1, 2, 3, 4], [2, 5, 3, 6], {line_width: 3})
  }
}

void bootstrapApplication(App)

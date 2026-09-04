import {Component} from "@angular/core"
import {bootstrapApplication} from "@angular/platform-browser"
import {BokehComponent} from "@bokeh/angular"
import {Plotting} from "@bokeh/bokehjs"

@Component({
  selector: "app-root",
  imports: [BokehComponent],
  template: `<bokeh-plot [model]="plot"></bokeh-plot>`,
})
class App {
  readonly plot = Plotting.figure({title: "BokehJS with Angular", width: 500, height: 300})

  constructor() {
    this.plot.line([1, 2, 3, 4], [2, 5, 3, 6], {line_width: 3})
  }
}

void bootstrapApplication(App)

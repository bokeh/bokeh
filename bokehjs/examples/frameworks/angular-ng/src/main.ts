import {Component} from "@angular/core"
import {bootstrapApplication} from "@angular/platform-browser"
import {BokehDocumentComponent, BokehRootDirective} from "@bokeh/angular"
import {ColumnDataSource, Plotting} from "@bokeh/bokehjs"

const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const baseline = [2, 2.8, 4.2, 5.1, 4.7, 3.8, 3.2, 4.1, 5.6, 6.3, 5.7, 7]
const response = [0.8, 0.2, -0.8, -1.4, -0.4, 1.2, 1.8, 0.7, -0.9, -1.6, 0.5, -1.2]

@Component({
  selector: "app-root",
  imports: [BokehDocumentComponent, BokehRootDirective],
  template: `
    <main class="app-shell">
      <p class="eyebrow">Framework integration example</p>
      <h1>BokehJS + Angular</h1>
      <p class="intro">A native Angular control updates linked Bokeh roots placed in separate page sections.</p>
      <bokeh-document [models]="plots">
        <section class="demo-card" aria-label="Interactive Bokeh line plot example">
          <div class="control-row">
            <label for="variation">Signal variation</label>
            <input id="variation" data-bokeh-control type="range" min="0.5" max="2" step="0.25"
              [value]="variation" (input)="update($event)">
            <output data-bokeh-output for="variation">{{variation.toFixed(2)}}×</output>
          </div>
          <div class="plot-host" [bokehRoot]="plot"></div>
        </section>
        <p class="note">This ordinary Angular content sits between two roots in the same Bokeh document.</p>
        <section class="demo-card" aria-label="Linked Bokeh detail plot example">
          <div class="plot-host" [bokehRoot]="detail"></div>
        </section>
      </bokeh-document>
    </main>
  `,
})
class App {
  readonly source = ColumnDataSource.create({data: {x, y: baseline}})
  readonly plot = Plotting.figure({title: "BokehJS with Angular", width: 560, height: 300})
  readonly detail = Plotting.figure({title: "Linked detail", width: 560, height: 240, x_range: this.plot.x_range})
  readonly plots = [this.plot, this.detail]
  variation = 1

  constructor() {
    this.plot.line({field: "x"}, {field: "y"}, {source: this.source, line_width: 3})
    this.detail.scatter({field: "x"}, {field: "y"}, {source: this.source, size: 10})
  }

  update(event: Event) {
    this.variation = (event.currentTarget as HTMLInputElement).valueAsNumber
    this.source.data = {x, y: baseline.map((value, index) => value + (this.variation - 1)*response[index])}
  }
}

void bootstrapApplication(App)

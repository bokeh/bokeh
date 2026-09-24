# `@bokeh/angular`

Standalone Angular components and directives for mounting BokehJS models with
automatic cleanup.

```sh
npm install @bokeh/bokehjs @bokeh/angular @angular/core
```

Import `BokehComponent` and render it with a Bokeh model:

```html
<bokeh-plot [model]="plot"></bokeh-plot>
```

The package also exports `BokehDocumentComponent` and `BokehRootDirective` for
shared multi-root documents. It is versioned and released with
`@bokeh/bokehjs`. See the
[BokehJS framework integration guide](https://docs.bokeh.org/en/latest/docs/user_guide/advanced/bokehjs.html)
for the lifecycle contract.

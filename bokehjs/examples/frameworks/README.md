# BokehJS framework examples

These projects are intentionally small enough to use as documentation examples.
Each one creates the same plot and shows only the integration code required by
its framework or bundler.

| Project | Integration | User-facing entry point |
| --- | --- | --- |
| [React + Vite](react-vite/) | `@bokeh/react` component | [`App.tsx`](react-vite/src/App.tsx) |
| [Vue + Vite](vue-vite/) | `@bokeh/vue` component | [`App.vue`](vue-vite/src/App.vue) |
| [Svelte + Vite](svelte-vite/) | `@bokeh/svelte` action | [`App.svelte`](svelte-vite/src/App.svelte) |
| [Angular](angular-ng/) | `@bokeh/angular` standalone component | [`main.ts`](angular-ng/src/main.ts) |
| [Web Component + Webpack](web-component-webpack/) | `@bokeh/web-component` custom element | [`main.ts`](web-component-webpack/src/main.ts) |
| [Vanilla + Vite](vanilla-vite/) | direct `mount()` | [`main.ts`](vanilla-vite/src/main.ts) |
| [Vanilla + Webpack](vanilla-webpack/) | direct `mount()` | [`main.ts`](vanilla-webpack/src/main.ts) |
| [Vanilla + Rspack](vanilla-rspack/) | direct `mount()` | [`main.ts`](vanilla-rspack/src/main.ts) |
| [Node.js SSR compatibility](node-ssr-compat/) | DOM-free import and model construction | [`main.mjs`](node-ssr-compat/main.mjs) |

All projects are npm workspaces in the BokehJS repository. The framework test
matrix also copies these projects to an isolated directory, installs packed
BokehJS and adapter tarballs, and builds them there. This keeps the examples
readable while continuously checking that the published package shape works.

# BokehJS framework examples

These projects are intentionally small enough to use as documentation examples.
Each browser project places the same plot in a modest application shell and uses
a native range input to update its `ColumnDataSource`. This demonstrates that the
framework owns the surrounding UI and state while BokehJS updates the existing
plot without a remount. The Node.js example remains DOM-free by design.

| Project | Integration | User-facing entry point |
| --- | --- | --- |
| [React + Next.js](react-next/) | `@bokeh/react` client component in an App Router page | [`BokehExample.tsx`](react-next/app/BokehExample.tsx) |
| [React + Vite](react-vite/) | `@bokeh/react` component | [`App.tsx`](react-vite/src/App.tsx) |
| [Vue + Vite](vue-vite/) | `@bokeh/vue` component | [`App.vue`](vue-vite/src/App.vue) |
| [Svelte + Vite](svelte-vite/) | `@bokeh/svelte` action | [`App.svelte`](svelte-vite/src/App.svelte) |
| [Web Component + Webpack](web-component-webpack/) | `@bokeh/web-component` custom element | [`main.ts`](web-component-webpack/src/main.ts) |
| [Vanilla + Vite](vanilla-vite/) | direct `mount()` | [`main.ts`](vanilla-vite/src/main.ts) |
| [Vanilla + Webpack](vanilla-webpack/) | direct `mount()` | [`main.ts`](vanilla-webpack/src/main.ts) |
| [Vanilla + Rspack](vanilla-rspack/) | direct `mount()` | [`main.ts`](vanilla-rspack/src/main.ts) |
| [Node.js SSR compatibility](node-ssr-compat/) | DOM-free import and model construction | [`main.mjs`](node-ssr-compat/main.mjs) |

All projects are npm workspaces in the BokehJS repository. The framework test
matrix also copies these projects to an isolated directory, installs packed
BokehJS and adapter tarballs, and builds them there. This keeps the examples
readable while continuously checking that the published package shape works.
The browser smoke test also drives every range input and verifies that both the
page output and rendered Bokeh canvas change.

The TypeScript examples use the native TypeScript 7 compiler. Webpack and Rspack
examples compile their TypeScript sources before bundling the emitted JavaScript.
The Vue example uses `vue-tsc` with
[`typescript-native-bridge`](https://github.com/johnsoncodehk/typescript-native-bridge),
maintained by Vue's language-tools author. The bridge runs the TypeScript 7 checker
while providing the classic JavaScript compiler API needed to check `.vue` scripts
and templates.
Its version includes `6.0.3` for the API compatibility layer and `tsgo.7.0.2` for
the checker. The example's check script selects the bridge explicitly, so other
tools continue to use Microsoft's TypeScript 7 package without npm overrides.

The bridge uses a native development dependency with prebuilt macOS, Windows,
and Linux binaries. On Linux it requires glibc 2.35 or later; Alpine/musl is not
supported. It is not included in Bokeh's browser bundles or Python package.

The local `file:` dependencies in these projects connect them to packages in
this repository. In an external application, install the corresponding
published packages from npm instead, for example
`npm install @bokeh/bokehjs @bokeh/react`.

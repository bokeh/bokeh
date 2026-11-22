import fs from "node:fs"
import less from "postcss-less"

// The plugin's `importFrom` only understands *.css, so collect custom
// properties from *.less files here.
function custom_properties_from(...paths) {
  const customProperties = {}
  for (const path of paths) {
    less.parse(fs.readFileSync(new URL(path, import.meta.url), "utf-8")).walkDecls(/^--/, (decl) => {
      customProperties[decl.prop] = decl.value
    })
  }
  return customProperties
}

// Set from TypeScript via style.setProperty() or inline styles.
const runtime_custom_properties = Object.fromEntries([
  "--max-width",                                // plot_canvas.ts
  "--nrows", "--ncols",                         // legend.ts
  "--item-background-color",
  "--item-background-hatch",
  "--item-background-hatch-scale",
  "--item-background-inactive-color",
  "--item-background-inactive-hatch",
  "--item-background-inactive-hatch-scale",
  "--size",                                     // builtin_icon.ts
].map((prop) => [prop, "initial"]))

// `vars.css` is adopted by every shadow root; other sheets only where listed.
function known_custom_properties(...paths) {
  return ["csstools/value-no-unknown-custom-properties", [true, {
    importFrom: [{
      customProperties: {
        ...custom_properties_from("src/less/vars.less", ...paths),
        ...runtime_custom_properties,
      },
    }],
  }]]
}

/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-recommended"],
  customSyntax: "postcss-less",
  plugins: [
    "stylelint-value-no-unknown-custom-properties",
    "stylelint-no-unsupported-browser-features",
    "stylelint-declaration-strict-value",
  ],
  ignoreFiles: ["**/node_modules/**", "build/**"],
  rules: {
    "declaration-property-value-no-unknown": true,
    // repeated `:host` etc. blocks are used to group rules by concern
    "no-duplicate-selectors": null,
    // ignores properties, so it reports base rules following state variants (e.g.
    // `.x` after `:host(.bk-active) .x`), even when they set different properties
    "no-descending-specificity": null,
    // TODO remove when `@import (less) "..."` is gone
    "at-rule-prelude-no-invalid": [true, {ignoreAtRules: ["import"]}],
    ...Object.fromEntries([known_custom_properties()]),
    "plugin/no-unsupported-browser-features": [true, {
      browsers: ["baseline widely available"],
      ignorePartialSupport: true,
      ignore: [
        "css3-cursors",     // no cursors on touch devices
        "css-touch-action", // desktop Safari has no touch input
        "css-resize",       // no resize handles on iOS
      ],
    }],
    "scale-unlimited/declaration-strict-value": [
      ["color", "background-color", "border-color", "fill", "stroke"], {
        ignoreValues: ["inherit", "initial", "unset", "transparent", "currentColor", "none"],
        severity: "warning",
      },
    ],
  },
  overrides: [{
    files: ["src/less/notifications.less"], // see models/ui/notifications.ts
    rules: Object.fromEntries([known_custom_properties("src/less/buttons.less")]),
  }],
}

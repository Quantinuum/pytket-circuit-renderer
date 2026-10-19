# pytket-circuit-renderer

This is a Vue 3 component for rendering pytket circuits.

## Installation
Via package manager:
```
npm install pytket-circuit-renderer
```

Or include directly in a script tag. Make sure to also load the css.
```
<script type="application/javascript" src="https://unpkg.com/pytket-circuit-renderer@latest/dist/pytket-circuit-renderer.umd.js"></script>
<link rel="stylesheet" href="https://unpkg.com/pytket-circuit-renderer@latest/dist/pytket-circuit-renderer.css">
```

## Usage
Note that this component depends on Vue 3.
If using a package manager, simply import and use as normal:
```import { circuitDisplayContainer } from "pytket-circuit-renderer"```

If loading the script directly, locate the module as below:
```const circuitDisplayContainer = window["pytket-circuit-renderer"].default```

You can then include the circuit display as a component in your vue app:
```
const app = {
    components: { circuitDisplayContainer },
    ...
};
```
If using v0.3.0 or later (or v0.2.1), make sure to also enable a required config option in your vue app before mounting:
```
app.config.unwrapInjectedRef = true
```

The component will be exposed as `<circuit-display-component>`.

You can either render json passed directly via the `circuit-raw` prop:
```
<circuit-display-container :circuit-raw="circuitJson"></circuit-display-container>
```

Or collect it from an element on the page by specifying the query string:
```
<circuit-display-container :circuit-element-str="'#circuit-json-to-display'"></circuit-display-container>
```

You can supply either a single circuit or a list of circuits. In the case of a list, the circuits will be displayed
alongside each other. The stacking orientation is controlled by the `viewFormat` prop, 
and can be either `row` (default) or `column`.

Note that the display container includes a choice of rendering options. You can choose to specify 
default options when first mounting the component:
```
<circuit-display-container :circuit-raw="circuitJson" :init-render-options="{'zxStyle': true, ...}"></circuit-display>
```

The render options you can specify are the following:
- `zxStyle`: Render gates as zx-spiders where applicable.
- `condenseCBits`: Display classical wires as a single wire.
- `recursive`: Display nested circuits recursively where possible.
- `condensed`: Display the circuit on one line only, rather than wrapping around.
- `darkTheme` : Default to dark mode if not in system theme mode.
- `systemTheme` : Default to system theme. On by default.
- `transparentBg`: Display the circuit with a transparent background. 
- `cropParams`: Crop long gate parameters. 
- `interpretMath`: Render math names and parameters via latex.
 
It is advised that you also set the theme to avoid clashes.

Check the example folder for a basic sample app that uses this component.


## Development
Use Node.js 22 for development, then install the npm dependencies via `npm install`.

The dependency overrides in `package.json` keep transitive dependencies on patched versions while the Vue CLI and Storybook dependency ranges lag behind. Keep these overrides when refreshing the lockfile, and check the library build, Storybook build, and Cypress tests when changing them.

### Test
You should then be able to run storybook to manually inspect the components via `npm run storybook`.
Automated tests via cypress can be run using `npm run test`.

### Build
To compile the component library use `npm run parser` then `npm run build-lib`.
Opening `test\index.html` gives an example app that uses the locally built circuit renderer.
Note that you must be serving the local files, for example by first running `serve .` in the project root directory.

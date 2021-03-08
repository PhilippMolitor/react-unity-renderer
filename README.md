# React Unity Renderer

<p align="center">

<img src="https://github.com/PhilippMolitor/react-unity-renderer/actions/workflows/ci-dev.yaml/badge.svg?branch=dev">
<img src="https://github.com/PhilippMolitor/react-unity-renderer/actions/workflows/release-npmjs.yaml/badge.svg">
<img src="https://img.shields.io/npm/l/react-unity-renderer">
<img src="https://img.shields.io/npm/dw/react-unity-renderer">
<img src="https://img.shields.io/github/stars/PhilippMolitor/react-unity-renderer">
<img src="https://img.shields.io/npm/v/react-unity-renderer">
<img src="https://img.shields.io/bundlephobia/minzip/react-unity-renderer">

</p>

> This project is heavily inspired by [react-unity-webgl](https://github.com/elraccoone/react-unity-webgl) made by Jeffrey Lanters.
> This is a modernized, `FunctionComponent` based interpretation of his ideas.

## Introduction

TODO

## Installation

NPM

```
npm install --save react-unity-renderer
```

Yarn

```
yarn add react-unity-renderer
```

**Version compatability**

| Unity version     | NPM version |
| ----------------- | ----------- |
| `2020` and `2021` | `2020.*`    |

## Example usage

TypeScript

```tsx
import { VFC, useState } from 'react';
import {
  UnityContext,
  UnityRenderer,
  UnityLoaderConfig,
} from 'react-unity-renderer';

// get those URLs from your Unity WebGL build.
// you *could* put a JSON in your WebGL template containing this information
// and load that with fetch or axios to assemble your config.
const config: UnityLoaderConfig = {
  loaderUrl: '...',
  frameworkUrl: '...',
  codeUrl: '...',
  dataUrl: '...',
  // everything from here on is optional
  memoryUrl: '',
  symbolsUrl: '',
  streamingAssetsUrl: '',
  companyName: '',
  productName: '',
  productVersion: '',
  modules: {},
};

export const UnityGameComponent: VFC = (): JSX.Element => {
  // your need to construct a config or pass it from the props
  const [ctx] = useState<UnityContext>(new UnityContext(config));

  // You can keep track of the game progress and ready state like this.
  const [progress, setProgress] = useState<number>(0);
  const [ready, setReady] = useState<boolean>(false);

  // Attach some event handlers to the context
  useEffect(() => {
    ctx.on('message', (m: string) => console.log(message));
  }, []);

  return (
    <UnityRenderer
      context={ctx}
      // optional state information callbacks
      onUnityProgressChange={(p) => setProgress(p)}
      onUnityReadyStateChange={(s) => setReady(s)}
      onUnityError={(e) => console.error(e)}
      // <UnityRenderer> has every prop (except ref) from HTMLCanvasElement.
      // This means you can use something like style!
      // Also it works perfectly with styled-components.
      style={{ width: '100%', height: '100%' }} // optional, but a good idea.
    />
  );
};
```

## Mitigating the "keyboard capturing issue"

By default, Unity WebGL builds capture the keyboard as soon as they are loaded. This means that all keyboard input on the website is captured by the game, and rendering all `<input>`, `<textarea>` and similar input methods useless.

To solve this problem, two changes have to be made:

1. Inside your Unity project, add the following code at some point that gets called early in your game:

```cs
#if !UNITY_EDITOR && UNITY_WEBGL
WebGLInput.captureAllKeyboardInput = false;
#endif
```

2. Set the prop `tabIndex={1}` (may need an ESLint ignore rule) on the `<UnityRenderer>` component to enable focus on click.

3. Now clicking the game enables game keyboard input, and clicking the website enables keyboard input on the website.

For more details on the issue, see [this Stack Overflow answer](https://stackoverflow.com/a/60854680).

## Creating a fetchable config from a Unity WebGL template

In order to create a fetchable build config that contains all required keys for `UnityLoaderConfig`, you could add the following to a Unity WebGL template and upload it to a `CORS`-enabled web host (for example Amazon AWS S3).

`build.json`

```json
{
  "loaderUrl": "Build/{{{ LOADER_FILENAME }}}",
  "frameworkUrl": "Build/{{{ FRAMEWORK_FILENAME }}}",
  "codeUrl": "Build/{{{ CODE_FILENAME }}}",
#if MEMORY_FILENAME
  "memoryUrl": "Build/{{{ MEMORY_FILENAME }}}",
#endif
#if SYMBOLS_FILENAME
  "symbolsUrl": "Build/{{{ SYMBOLS_FILENAME }}}",
#endif
  "dataUrl": "Build/{{{ DATA_FILENAME }}}",
  "streamingAssetsUrl": "StreamingAssets",
  "companyName": "{{{ COMPANY_NAME }}}",
  "productName": "{{{ PRODUCT_NAME }}}",
  "productVersion": "{{{ PRODUCT_VERSION }}}"
}

```

Take the following example using `fetch`:

`unity-api.ts`

```ts
import { UnityLoaderConfig } from 'react-unity-renderer';

export async function fetchLoaderConfig(
  baseUrl: string
): Promise<UnityLoaderConfig> {
  // set the URL of where we expect the loader config to be and disable caching
  const url = `${baseUrl}/build.json?t=${new Date().getTime()}`;

  let response: Response | undefined;

  // network or request error
  try {
    response = await window.fetch(url, { method: 'GET' });
  } catch (ex) {
    throw new Error('unable to load build info');
  }

  // invalid response
  if (!response || !response.ok) throw new Error('unable to load build info');

  // force the type we expect
  const data = (await response.json()) as UnityLoaderConfig;

  return {
    loaderUrl: `${baseUrl}/${data.loaderUrl}`,
    frameworkUrl: `${baseUrl}/${data.frameworkUrl}`,
    codeUrl: `${baseUrl}/${data.codeUrl}`,
    dataUrl: `${baseUrl}/${data.dataUrl}`,
    memoryUrl: `${baseUrl}/${data.memoryUrl}`,
    symbolsUrl: `${baseUrl}/${data.symbolsUrl}`,
    streamingAssetsUrl: `${baseUrl}/${data.streamingAssetsUrl}`,
    companyName: `${data.companyName}`,
    productName: `${data.productName}`,
    productVersion: `${data.productVersion}`,
  };
}
```

You can then use it to construct a `UnityContext` and pass this context to your `UnityRenderer` via the `context` prop.

## Sending events from Unity

In order to send events from Unity to the react application, use the global method for that in your `*.jslib` mapping file:

```javascript
mergeInto(LibraryManager.library, {
  RunSomeActionInJavaScript: function (message, number) {
    // surround with try/catch to make unity not crash in case the method is
    // not defined in the global scope yet
    try {
      window.UnityBridge('event-name')(Pointer_stringify(message), number);
    } catch (e) {}
  },
});
```

If the event name has no registered event handlers, the `UnityBridge(event: string)` function will log a warning via `console.warn(...)`.

## Module augmentation

Take the following example:

```typescript
// create some context
const ctx = new UnityContext({ ... });

// handles some "info" event with one parameter of type string
ctx.on('info', (message: string) => {
  console.log(message);
});
```

The parameter `message` has to be explicitly defined as `string` each time a handler of for the event name `info` would be registered.
In order to make use of TypeScript to its fullest extent, you can augment an Interface of the library to get autocompletion and type-safety features here.

Put this either in a file importing `react-unity-renderer` or create a new `unity.d.ts` somewhere in your `src` or (if you have that) `typings` directory:

```typescript
// must be imported, else the module will be redefined,
// and this causes all sorts of errors.
import 'react-unity-renderer';

// module augmentation
declare module 'react-unity-renderer' {
  // this is the interface providing autocompletion
  interface EventSignatures {
    // "info" is the event name
    // the type on the right side is anything that would match TypeScript's
    // Parameters<> helper type
    info: [message: string];

    // also possible:
    info: [string];
    'some-event': [number, debug: string];
    // note that all parametrs names are just labels, so they are fully optional.
  }
}
```

Now, any defined event will be auto-completed with its types for `UnityContext.on(...)`:

```typescript
// create some context
const ctx = new UnityContext({ ... });

// "info" will be suggested by your IDE
// "message" is now of type string
ctx.on('info', (message) => {
  console.log(message);
});
```

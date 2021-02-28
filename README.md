# React Unity Renderer

<p align="center">

<img src="https://img.shields.io/npm/l/react-unity-renderer?style=flat-square">
<img src="https://img.shields.io/npm/dw/react-unity-renderer?style=flat-square">
<img src="https://img.shields.io/github/stars/PhilippMolitor/react-unity-renderer?style=flat-square">
<img src="https://img.shields.io/npm/v/react-unity-renderer?style=flat-square">

</p>

> This project is heavily inspired by [react-unity-webgl](https://github.com/elraccoone/react-unity-webgl) made by Jeffrey Lanters.
> This is a modernized, `FunctionComponent` based interpretation of his ideas.

## Introduction

TODO

## Installation

NPM

```
npm install --save-dev react-unity-renderer
```

Yarn

```
yarn add react-unity-renderer
```

## Example usage

TypeScript

```tsx
import { VFC, useState } from 'react';
import {
  UnityContext,
  UnityRenderer,
  UnityLoaderConfig,
} from 'react-unity-webgl';

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
  const [ctx] = useState<UnityContext>(new UnityContext(config));

  // You can keep track of the game progress and ready state like this.
  const [progress, setProgress] = useState<number>(0);
  const [ready, setReady] = useState<boolean>(false);

  return (
    <UnityRenderer
      context={ctx}
      onUnityProgressChange={(p) => setProgress(p)}
      onUnityReadyStateChange={(s) => setReady(s)}
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

3. Now clicking the game enables game keyboard input, and clicking the website enabled keyboard input on the website.

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

Take the following example using `axios`:

`unity-api.ts`

```ts
import axios, { AxiosResponse } from 'axios';
import { UnityLoaderConfig } from 'react-unity-renderer';

function fetchLoaderConfig(baseUrl: string): Promise<UnityLoaderConfig> {
  let result: AxiosResponse<UnityLoaderConfig>;

  try {
    const url = `${baseUrl}/build.json?t=${new Date().getTime()}`;
    result = await axios.get<UnityLoaderConfig>(url);
  } catch (ex) {
    // network or request error
    throw new Error('unable to load build info');
  }

  const { status, data } = result;

  // invalid response
  if (status < 200 || status >= 400) {
    throw new Error('unable to load build info');
  }

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

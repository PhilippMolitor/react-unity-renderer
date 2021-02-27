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
  const [progress, setProgress] = useState<number>(0);
  const [ready, setReady] = useState<boolean>(false);

  return (
    <GameRenderer
      context={ctx}
      onUnityProgressChange={(p) => setProgress(p)}
      onUnityReadyStateChange={(s) => setReady(s)}
      style={{ width: '100%', height: '100%' }} // fully optional
    />
  );
};
```

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

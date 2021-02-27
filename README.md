# React Unity Renderer

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
  loaderUrl: '',
  frameworkUrl: '',
  codeUrl: '',
  dataUrl: '',
  // everything from here on is optional
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

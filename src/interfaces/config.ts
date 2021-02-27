export type UnityInstanceConfig = {
  frameworkUrl: string;
  codeUrl: string;
  dataUrl: string;
  memoryUrl?: string;
  symbolsUrl?: string;
  streamingAssetsUrl?: string;
  companyName?: string;
  productName?: string;
  productVersion?: string;
  modules?: Object;
};

export type UnityLoaderConfig = UnityInstanceConfig & {
  loaderUrl: string;
};

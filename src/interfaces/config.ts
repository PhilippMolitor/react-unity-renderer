export type UnityInstanceConfig = {
  dataUrl: string;

  frameworkUrl: string;

  codeUrl: string;

  streamingAssetsUrl?: string;

  companyName?: string;

  productName?: string;

  productVersion?: string;

  modules?: Object;
};

export type UnityLoaderConfig = UnityInstanceConfig & {
  loaderUrl: string;
};

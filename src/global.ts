// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Window {
  UnityBridge: (name: string) => (...params: any) => void;

  createUnityInstance(
    element: HTMLCanvasElement,
    parameters: {
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
    },
    onProgress?: (progression: number) => void
  ): Promise<UnityInstance>;
}

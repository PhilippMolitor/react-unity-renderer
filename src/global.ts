// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Window {
  UnityBridge: {
    [event: string]: (...params: any) => void;
  };

  createUnityInstance(
    element: HTMLCanvasElement,
    parameters: {
      dataUrl: string;

      frameworkUrl: string;

      codeUrl: string;

      streamingAssetsUrl?: string;

      companyName?: string;

      productName?: string;

      productVersion?: string;

      modules?: Object;
    },
    onProgress?: (progression: number) => void
  ): Promise<UnityInstance>;
}

declare class UnityInstance {
  constructor();

  public SendMessage(
    objectName: string,
    methodName: string,
    value?: string | number
  ): void;

  public SetFullscreen(fullScreen: number): void;

  public Quit(): Promise<void>;
}

declare interface Window {
  UnityBridge: (name: string) => (...params: any) => void;

  createUnityInstance(
    element: HTMLCanvasElement,
    parameters: UnityInstanceConfig,
    onProgress?: (progress: number) => void
  ): Promise<UnityInstance>;
}

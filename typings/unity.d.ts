declare class UnityInstance {
  constructor();

  public SendMessage(
    objectName: string,
    methodName: string,
    value?: string | number | boolean
  ): void;

  public SetFullscreen(fullScreen: number): void;

  public Quit(): Promise<void>;
}

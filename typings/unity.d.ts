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

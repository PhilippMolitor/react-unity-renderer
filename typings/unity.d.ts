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
  /**
   * Global function returning a callback for the requested event.
   * Will `console.warn()` and return a dummy callback in case the specified event
   * name has no registered handler.
   *
   * @param {string} name name of the event
   */
  UnityBridge(name: string): (...params: any) => void;

  /**
   * A global collection of all registered event handlers across all instances.
   *
   * **For internal use only!**
   */
  __UnityBridgeRegistry__: {
    [name: string]: ((...params: any) => void)[];
  };

  /**
   * Mapper to the native JavaScript function from Unity's loader script,
   * which loads and renders a WebGL build inside a `<canvas>` element.
   *
   * @param {HTMLCanvasElement} canvas The `<canvas>` object to which the game
   * should be rendered.
   * @param {UnityInstanceConfig} parameters The configuration containing all
   * required information to load a WebGL build.
   * @param {(progress: number) => void} [onProgress] Callback function
   * for Unity loading progress changes. Ranges from `0` to `1.0`.
   */
  createUnityInstance(
    canvas: HTMLCanvasElement,
    config: {
      codeUrl: string;
      frameworkUrl: string;
      dataUrl: string;
      memoryUrl?: string;
      symbolsUrl?: string;
      streamingAssetsUrl?: string;
      companyName?: string;
      productName?: string;
      productVersion?: string;
    },
    onProgress?: (progress: number) => void
  ): Promise<UnityInstance>;
}

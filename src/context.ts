import './global';
import { UnityLoaderConfig } from './interfaces/config';

export class UnityContext {
  private instance?: UnityInstance;

  private config: UnityLoaderConfig;

  constructor(config: UnityLoaderConfig) {
    this.config = config;
    if (!window.UnityBridge) window.UnityBridge = {};
  }

  public getConfig(): UnityLoaderConfig {
    return this.config;
  }

  public setInstance(unityInstance: UnityInstance): void {
    this.instance = unityInstance;
  }

  public shutdown(onShutdownFinished?: () => void): void {
    if (!this.instance) return;

    this.instance
      .Quit()
      .then(() => {
        this.instance = undefined;
        this.unregisterAllEventHandlers();

        if (onShutdownFinished) onShutdownFinished();
      })
      .catch((e) =>
        // eslint-disable-next-line no-console
        console.error('error while shutting down webgl instance', e)
      );
  }

  public emitUnityEvent(
    objectName: string,
    methodName: string,
    value?: string | number | boolean
  ): void {
    if (!this.instance) return;

    this.instance.SendMessage(objectName, methodName, value);
  }

  public on<T extends (...params: any) => void = () => void>(
    name: string,
    callback: T
  ): void {
    window.UnityBridge[name] = callback;
  }

  public off(name: string) {
    if (name in window.UnityBridge) window.UnityBridge[name] = () => undefined;
  }

  public setFullscreen(enabled: boolean): void {
    if (!this.instance) return;
    this.instance.SetFullscreen(enabled ? 1 : 0);
  }

  private unregisterAllEventHandlers() {
    if (!window.UnityBridge || typeof window.UnityBridge !== 'object') return;
    Object.keys(window.UnityBridge).forEach((k) => this.off(k));
  }
}

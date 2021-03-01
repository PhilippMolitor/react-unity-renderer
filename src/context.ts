import './global';
import { UnityLoaderConfig } from './interfaces/config';

export type UnityEventCallback = (...params: any) => void;

/**
 * Defines a Unity WebGL context.
 *
 * The context is responsible for the initial startup parameters of the
 * `UnityRenderer`, as well as receiving events and emitting RPCs to Unity.
 *
 */
export class UnityContext {
  private config: UnityLoaderConfig;

  private instance?: UnityInstance;

  private eventCallbacks: { [name: string]: UnityEventCallback } = {};

  /**
   * Creates a new `UnityContext` and registers the global event callback.
   *
   * @param {UnityLoaderConfig} config A loader configuration object.
   */
  constructor(config: UnityLoaderConfig) {
    this.config = config;

    // callback is needed so it can access the actual eventCallbacks object
    if (!window.UnityBridge)
      window.UnityBridge = (name: string) => this.bridgeCallback(name);
  }

  /**
   * Retrieves the currently activte loader configuration.
   *
   * @returns {UnityLoaderConfig} The current loader configuration object.
   */
  public getConfig(): UnityLoaderConfig {
    return this.config;
  }

  /**
   * Sets the Unity instance this `UnityContext` is responsible for.
   *
   * @param {UnityInstance} instance The running Unity instance
   */
  public setInstance(instance: UnityInstance): void {
    this.instance = instance;
  }

  /**
   * Shuts down the running Unity instance, then unregisters the existing
   * event handlers.
   *
   * @param {() => void} onShutdownFinished Callback to execute when the
   * shutdown has been completed.
   *
   * @returns {void} void
   */
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

  /**
   * Emits a remote procedure call towards the running Unity instance.
   *
   * @param {string} objectName The `GameObject` on which to call the method.
   * @param {string} methodName The name of the method which should be invoked.
   * @param {(string | number)} value The value to pass to the method
   * as the first parameter.
   * @returns {void} void
   */
  public emit(
    objectName: string,
    methodName: string,
    value?: string | number
  ): void {
    if (!this.instance) return;

    this.instance.SendMessage(objectName, methodName, value);
  }

  /**
   * Delegates an event handler to handle an event (from Unity) by using a
   * callback function.
   *
   * @param {string} name The (unique) name of the event.
   * @param {UnityEventCallback} callback The callback which should be invoked
   * upon the occurence of this event.
   */
  public on<T extends UnityEventCallback>(name: string, callback: T): void {
    this.eventCallbacks[name] = callback;
  }

  /**
   * Enables or disables fullscreen mode.
   *
   * @param {booolean} enabled Whether to enable or disable fullscreen.
   * @returns {void} void
   */
  public setFullscreen(enabled: boolean): void {
    if (!this.instance) return;
    this.instance.SetFullscreen(enabled ? 1 : 0);
  }

  /**
   * The internal handler for any incoming event.
   * Logs a warning for events with names that are not registered.
   *
   * @param {string} name The name of the event.
   * @returns {UnityEventCallback} The  callback which should
   * handle the event.
   */
  private bridgeCallback(name: string): UnityEventCallback {
    if (this.eventCallbacks && this.eventCallbacks[name])
      return this.eventCallbacks[name];

    // eslint-disable-next-line no-console
    console.warn(`called event "${name}" which currently is not registered`);
    return () => undefined;
  }

  /**
   * Unregisters all event handlers.
   */
  private unregisterAllEventHandlers() {
    this.eventCallbacks = {};
  }
}

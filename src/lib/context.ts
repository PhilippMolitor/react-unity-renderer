/* eslint no-underscore-dangle: ["error", { "allow": ["__UnityBridgeHandlers__"] }] */

export interface UnityInstanceConfig {
  codeUrl: string;
  frameworkUrl: string;
  dataUrl: string;
  memoryUrl?: string;
  symbolsUrl?: string;
  streamingAssetsUrl?: string;
  companyName?: string;
  productName?: string;
  productVersion?: string;
  modules?: { [key: string]: any };
}

export interface UnityLoaderConfig extends UnityInstanceConfig {
  loaderUrl: string;
}

/**
 * An interface containing event names and their handler parameter signatures.
 * This interface is supposed to be augmented via module augmentation by the
 * user.
 */
export interface EventSignatures {}

/**
 * Defines a weak union type, which can fallback to another type.
 */
type WeakUnion<T, F> = T | (F & {});

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

  private handlers: { [name: string]: (...params: any) => void } = {};

  /**
   * Creates a new `UnityContext` and registers the global event callback.
   *
   * @param {UnityLoaderConfig} config A loader configuration object.
   */
  constructor(config: UnityLoaderConfig) {
    this.config = config;

    this.mountGlobalEventRegistry();
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
    if (!this.instance) {
      if (onShutdownFinished) onShutdownFinished();
      return;
    }

    this.instance
      .Quit()
      .then(() => {
        this.instance = undefined;
        // remove all instance event handlers
        Object.keys(this.handlers).forEach((name) => this.off(name));

        if (onShutdownFinished) onShutdownFinished();
      })
      .catch((e) =>
        // eslint-disable-next-line no-console
        console.error('error while shutting down webgl instance', e)
      );
  }

  /**
   * Emits a message to the running Unity instance.
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
  public on<T extends WeakUnion<keyof EventSignatures, string>>(
    name: WeakUnion<keyof EventSignatures, T>,
    callback: (
      ...params: T extends keyof EventSignatures ? EventSignatures[T] : any
    ) => void
  ): void {
    // unregister any old event handler
    if (this.handlers[name]) this.off(name);

    // set new event handler
    this.handlers[name] = callback;

    // create global registry key if needed
    if (window.__UnityBridgeHandlers__ && !window.__UnityBridgeHandlers__[name])
      window.__UnityBridgeHandlers__[name] = [];
    // add callback to event registry
    window.__UnityBridgeHandlers__[name].push(callback);
  }

  /**
   * Removes a instance-local event handler from the global event registry.
   *
   * @param {string} name Name of the local event handler.
   */
  public off<T extends WeakUnion<keyof EventSignatures, string>>(
    name: WeakUnion<keyof EventSignatures, T>
  ): void {
    if (
      window.__UnityBridgeHandlers__ &&
      window.__UnityBridgeHandlers__[name] &&
      Array.isArray(window.__UnityBridgeHandlers__[name])
    )
      window.__UnityBridgeHandlers__[name] = window.__UnityBridgeHandlers__[
        name
      ].filter((cb) => cb !== this.handlers[name]);
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
   * Creates a global event registry and a lookup handler for use in Unity.
   * This enables fairly fail-safe multi-tenancy event handling.
   *
   * If no event handler is registered for an event that is received, a
   * warning will be logged to the console.
   *
   * @returns {void} void
   */
  private mountGlobalEventRegistry(): void {
    // create global handler registry if there is none
    if (
      window.__UnityBridgeHandlers__ !== null ||
      typeof window.__UnityBridgeHandlers__ !== 'object'
    )
      window.__UnityBridgeHandlers__ = {};

    // create global lookup handler which uses the regisry
    if (!window.UnityBridge && typeof window.UnityBridge !== 'function')
      window.UnityBridge = (name: string) => {
        if (
          window.__UnityBridgeHandlers__ &&
          window.__UnityBridgeHandlers__[name] &&
          Array.isArray(window.__UnityBridgeHandlers__[name]) &&
          window.__UnityBridgeHandlers__[name].length > 0
        ) {
          // return a function taking any params and executing them on all
          // registred event handlers
          return (...params: any) => {
            window.__UnityBridgeHandlers__[name].forEach((handler) =>
              handler(...params)
            );
          };
        }

        // dummy handler
        return () =>
          // eslint-disable-next-line no-console
          console.warn(`received event "${name}": no handlers registered`);
      };
  }
}

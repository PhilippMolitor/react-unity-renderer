/* eslint no-underscore-dangle: ["error", { "allow": ["__UnityBridgeRegistry__"] }] */

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
    this.mountGlobalLookupHandler();
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
    if (!this.instance) {
      // eslint-disable-next-line no-console
      console.error('cannot emit unity event: missing instance');
      return;
    }

    try {
      this.instance.SendMessage(objectName, methodName, value);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('failed to emit event to unity instance:', e);
    }
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
    if (
      window.__UnityBridgeRegistry__ &&
      (!window.__UnityBridgeRegistry__[name] || // key does not exist
        (window.__UnityBridgeRegistry__[name] && // key is not an array
          !Array.isArray(window.__UnityBridgeRegistry__[name])))
    )
      window.__UnityBridgeRegistry__[name] = [];

    // add callback to event registry
    window.__UnityBridgeRegistry__[name].push(callback);
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
      window.__UnityBridgeRegistry__ &&
      window.__UnityBridgeRegistry__[name] &&
      Array.isArray(window.__UnityBridgeRegistry__[name])
    )
      window.__UnityBridgeRegistry__[name] = window.__UnityBridgeRegistry__[
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
   * Creates a global event registry which holds a list of callbacks for
   * each registered event name.
   * This enables fairly fail-safe multi-tenancy event handling.
   *
   * @returns {void} void
   */
  private mountGlobalEventRegistry(): void {
    // create global handler registry if there is none
    if (
      window.__UnityBridgeRegistry__ !== null ||
      typeof window.__UnityBridgeRegistry__ !== 'object'
    )
      window.__UnityBridgeRegistry__ = {};
  }

  /**
   * Creates the global lookup handler which looks up the list of event
   * handlers for a given event name and executes them with the arguments
   * of the callback.
   *
   * If no event handler is registered for an event that is received, a
   * warning will be logged to the console.
   *
   * @returns {void} void
   */
  private mountGlobalLookupHandler(): void {
    // either returns a callback which executes any registered event handler
    // or a fallback handler
    const lookupHandler = (name: string) => {
      if (
        window.__UnityBridgeRegistry__ &&
        window.__UnityBridgeRegistry__[name] &&
        Array.isArray(window.__UnityBridgeRegistry__[name]) &&
        window.__UnityBridgeRegistry__[name].length > 0
      )
        // return a function taking any params and executing them on all
        // registred event handlers
        return (...params: any) => {
          window.__UnityBridgeRegistry__[name].forEach((handler) => {
            try {
              handler(...params);
            } catch (e) {
              // eslint-disable-next-line no-console
              console.warn(
                `failed to execute event handler for event "${name}":`,
                e
              );
            }
          });
        };

      return () =>
        // eslint-disable-next-line no-console
        console.warn(`received event "${name}": no handlers registered`);
    };

    // create global lookup handler which uses the registry, but only
    // if it is not registered yet
    if (!window.UnityBridge || typeof window.UnityBridge !== 'function')
      window.UnityBridge = lookupHandler;
  }
}

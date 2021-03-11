import { createElement, HTMLAttributes, useEffect, useState, VFC } from 'react';

import { useScript } from '../hooks/useScript';
import { UnityContext } from '../lib/context';

export type UnityRendererProps = Omit<
  HTMLAttributes<HTMLCanvasElement>,
  'ref'
> & {
  context?: UnityContext;
  onUnityProgressChange?: (progress: number) => void;
  onUnityReadyStateChange?: (ready: boolean) => void;
  onUnityError?: (error: Error) => void;
};

/**
 * A components that renders a Unity WebGL build from a given configuration
 * context. Allows bidirectional communication and loading progress tracking.
 *
 * @param {UnityRendererProps} props Configurtion context, Unity-specific
 * callback handlers and default React props for a `HTMLCanvasElement`.
 * Note that `ref` is not available due to internal use.
 * @returns {(JSX.Element | null)} A `JSX.Element` containing the renderer,
 * or `null` if not initialized yet.
 */
export const UnityRenderer: VFC<UnityRendererProps> = ({
  context,
  onUnityProgressChange,
  onUnityReadyStateChange,
  onUnityError,
  ...canvasProps
}: UnityRendererProps): JSX.Element | null => {
  const [ctx, setCtx] = useState<UnityContext | undefined>(context);
  const [loaderState, setLoaderSource] = useScript(ctx?.getConfig().loaderUrl);

  // We cannot actually render the `HTMLCanvasElement`, so we need the `ref`
  // for Unity and a `JSX.Element` for React rendering.
  const [canvas, setCanvas] = useState<JSX.Element>();
  const [renderer, setRenderer] = useState<HTMLCanvasElement>();

  // This is the last state the game was in, either ready or not ready.
  // It is used to trigger `onUnityReadyStateChange` reliably.
  const [lastReadyState, setLastReadyState] = useState<boolean>(false);

  /**
   * The callback which will be called from the `unityInstance` while
   * the game is loading.
   * @param {number} progress The progress ranging from `0.0` to `1.0`
   */
  function onUnityProgress(progress: number): void {
    if (onUnityProgressChange) onUnityProgressChange(progress);

    // if loading has completed, change ready state
    if (lastReadyState === false && progress >= 1.0) {
      if (onUnityReadyStateChange) onUnityReadyStateChange(true);
      setLastReadyState(true);
    } else if (lastReadyState === true) {
      // if ready state changed back to false, trigger again
      if (onUnityReadyStateChange) onUnityReadyStateChange(false);
      setLastReadyState(false);
    }
  }

  /**
   * Reset all local state of the Component. Usually done when the game was shut down.
   */
  function resetState() {
    // reset progress / ready state
    if (onUnityProgressChange) onUnityProgressChange(0);
    if (onUnityReadyStateChange) onUnityReadyStateChange(false);

    // reset all local states
    setCtx(undefined);
    setLoaderSource(undefined);
    setLastReadyState(false);
  }

  /**
   * Unmounts the game by shutting its instance down, removing the loader
   * script from the DOM and sending the appropriate events via the props.
   *
   * @param {() => void} onComplete Callback function which will be executed
   * after the unmounting has completed.
   */
  function unmount(onComplete?: () => void) {
    if (ctx) {
      ctx.shutdown(() => {
        resetState();
        // delayed callback
        if (onComplete) onComplete();
      });
      return;
    }

    resetState();
    if (onComplete) onComplete();
  }

  /**
   * Uses the native Unity loader method to attach the Unity instance to
   * the renderer `canvas`.
   *
   * @returns {Promise<void>} A Promise resolving on successful mount of the
   * Unity instance.
   */
  async function mount(): Promise<void> {
    // if no context, renderer or loader is availiable, or the game is already loaded
    if (!ctx || !renderer || loaderState !== 'active' || lastReadyState) {
      throw new Error(
        'cannot mount unity instance without a context, loader or renderer'
      );
    }

    // get the current loader configuration from the UnityContext
    const c = ctx.getConfig();

    const instance = await window.createUnityInstance(
      renderer,
      {
        dataUrl: c.dataUrl,
        frameworkUrl: c.frameworkUrl,
        codeUrl: c.codeUrl,
        streamingAssetsUrl: c.streamingAssetsUrl,
        companyName: c.companyName,
        productName: c.productName,
        productVersion: c.productVersion,
      },
      (p) => onUnityProgress(p)
    );

    // set the instance for further JavaScript <--> Unity communication
    ctx.setInstance(instance);
  }

  // on context prop change (step 1)
  useEffect(() => {
    // unmount currently running instance, set new context after that finished
    unmount(() => setCtx(context));
  }, [context]);

  // on context state change (step 2)
  useEffect(() => {
    if (!ctx) return;
    setLoaderSource(ctx.getConfig().loaderUrl);
  }, [ctx]);

  // on loader state change (step 3)
  useEffect(() => {
    switch (loaderState) {
      // loader script is now active, start the unity instance
      case 'active':
        mount().catch((e) => {
          unmount();
          if (onUnityError) onUnityError(e);
        });
        break;

      // failed to activate loader script
      case 'error':
        unmount();
        if (onUnityError)
          onUnityError(
            new Error(
              `failed to mount unity loader from: ${ctx?.getConfig().loaderUrl}`
            )
          );
        break;
      default:
        // unloaded or still loading
        break;
    }
  }, [loaderState]);

  // on mount
  useEffect(() => {
    // create the renderer and let the ref callback set its handle
    setCanvas(
      createElement('canvas', {
        ref: (r: HTMLCanvasElement) => setRenderer(r),
        ...canvasProps,
      })
    );

    // on unmount
    return () => {
      unmount();
    };
  }, []);

  return canvas || null;
};

import '../global';

import { createElement, HTMLAttributes, useEffect, useState, VFC } from 'react';

import { UnityContext } from '..';

import { UnityLoaderService } from '../loader';

export type UnityRendererProps = Omit<
  HTMLAttributes<HTMLCanvasElement>,
  'ref'
> & {
  context: UnityContext;
  onUnityProgressChange?: (progress: number) => void;
  onUnityReadyStateChange?: (ready: boolean) => void;
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
  ...canvasProps
}: UnityRendererProps): JSX.Element | null => {
  const [service] = useState<UnityLoaderService>(new UnityLoaderService());

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
   * Uses the native Unity loader method to attach the Unity instance to
   * the renderer `canvas`.
   *
   * @returns {Promise<void>} A Promise resolving on successful mount of the
   * Unity instance.
   */
  async function mountUnityInstance(): Promise<void> {
    if (!renderer) return;

    // get the current loader configuration from the UnityContext
    const c = context.getConfig();

    // attach Unity's native JavaScript loader
    await service.attachLoader(c.loaderUrl);
    const nativeUnityInstance = await window.createUnityInstance(
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
    context.setInstance(nativeUnityInstance);
  }

  // on canvas change
  useEffect(() => {
    if (renderer)
      mountUnityInstance().catch((e) => {
        // eslint-disable-next-line no-console
        console.error('failed to mount unity instance: ', e);
      });
  }, [renderer]);

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
      context.shutdown(() => {
        // remove the loader script from the DOM
        service.detachLoader();
        // reset progress / ready state
        if (onUnityProgressChange) onUnityProgressChange(0);
        if (onUnityReadyStateChange) onUnityReadyStateChange(false);
      });
    };
  }, []);

  return canvas || null;
};

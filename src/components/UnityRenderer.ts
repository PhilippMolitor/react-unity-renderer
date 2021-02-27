import '../global';
import {
  createElement,
  HTMLAttributes,
  useLayoutEffect,
  useState,
  VFC,
} from 'react';

import { UnityLoaderService } from '../loader';

import { UnityContext } from '..';

export type UnityRendererProps = HTMLAttributes<
  Omit<HTMLCanvasElement, 'ref'>
> & {
  context: UnityContext;
  onUnityProgressChange?: (progress: number) => void;
  onUnityReadyStateChange?: (ready: boolean) => void;
};

export const UnityRenderer: VFC<UnityRendererProps> = ({
  context,
  onUnityProgressChange,
  onUnityReadyStateChange,
  ...canvasProps
}): JSX.Element | null => {
  const [lastState, setLastState] = useState<boolean>(false);
  const [canvas, setCanvas] = useState<JSX.Element>();
  const [renderer, setRenderer] = useState<HTMLCanvasElement>();
  const [service] = useState<UnityLoaderService>(new UnityLoaderService());

  /**
   * The callback which will be called from the `unityInstance` while
   * the game is loading.
   * @param {number} progress
   */
  function onUnityProgress(progress: number): void {
    if (onUnityProgressChange) onUnityProgressChange(progress);

    // if loading has completed, change ready state
    if (lastState === false && progress >= 1.0) {
      if (onUnityReadyStateChange) onUnityReadyStateChange(true);
      setLastState(true);
    } else if (lastState === true) {
      // if ready state changed back to false, trigger again
      if (onUnityReadyStateChange) onUnityReadyStateChange(false);
      setLastState(false);
    }
  }

  /**
   * Creates the `<canvas>` element in which the unity build will be rendered.
   */
  function createRendererCanvas(): void {
    const c = createElement('canvas', {
      ...canvasProps,
      ref: (r: HTMLCanvasElement) => setRenderer(r),
    });
    setCanvas(c);
  }

  /**
   * Uses the native Unity loader method to attach the Unity instance to
   * the renderer `canvas`.
   */
  async function mountUnityInstance(): Promise<void> {
    if (!renderer) return;

    const c = context.getConfig();

    // attach
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

    context.setInstance(nativeUnityInstance);
  }

  // on mount
  useLayoutEffect(() => {
    createRendererCanvas();

    // on unmount
    return () => {
      context.shutdown(() => {
        service.detachLoader();
        if (onUnityReadyStateChange) onUnityReadyStateChange(false);
      });
    };
  }, []);

  // on canvas change
  useLayoutEffect(() => {
    if (renderer)
      mountUnityInstance().catch((e) => {
        // eslint-disable-next-line no-console
        console.error('failed to mount unity instance: ', e);
      });
  }, [renderer]);

  return canvas || null;
};

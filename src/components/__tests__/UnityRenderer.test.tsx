/// <reference path="../../../typings/unity.d.ts" />

import { mount } from 'enzyme';
import { act, fireEvent } from '@testing-library/react';
import { UnityContext } from '../../lib/context';
import { UnityRenderer } from '../UnityRenderer';

type CreateUnityFn = typeof window.createUnityInstance;

describe('<UnityRenderer>', () => {
  const MockUnityInstance = () =>
    jest.fn<UnityInstance, []>().mockImplementation(() => ({
      SendMessage: jest.fn(),
      Quit: jest
        .fn()
        .mockImplementation(() => new Promise((reject, resolve) => resolve())),
      SetFullscreen: jest.fn(),
    }));
  let createUnityValid = (cb?: (p: number) => void) =>
    jest
      .fn<ReturnType<CreateUnityFn>, Parameters<CreateUnityFn>>()
      .mockImplementation((_canvas, _config, onProgress) => {
        if (cb && onProgress) cb = (p: number) => onProgress(p);

        return new Promise<UnityInstance>((resolve) =>
          resolve(new (MockUnityInstance())())
        );
      });
  let createUnityInvalid = () =>
    jest
      .fn<ReturnType<CreateUnityFn>, Parameters<CreateUnityFn>>()
      .mockImplementation(
        () =>
          new Promise<UnityInstance>((resolve, reject) =>
            reject(new Error('unit test'))
          )
      );
  let unityContext: UnityContext;

  beforeEach(() => {
    const baseUrl = 'https://example.com/';
    unityContext = new UnityContext({
      loaderUrl: baseUrl + 'loader.js',
      codeUrl: baseUrl + 'Build/code.js',
      dataUrl: baseUrl + 'Build/data.gzip',
      frameworkUrl: baseUrl + 'Build/framework.js',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();

    document.body.innerHTML = '';
    // @ts-ignore
    window.createUnityInstance = undefined;
  });

  function completeLoader(error?: boolean) {
    const script = document.querySelector(
      `script[src="${unityContext.getConfig().loaderUrl}"]`
    ) as HTMLScriptElement;

    act(() => {
      if (error) {
        fireEvent.error(script);
      } else {
        fireEvent.load(script);
      }
    });
  }

  it('renders without configuration', async () => {
    const component = mount(<UnityRenderer />);
    expect(component).toBeDefined();
  });

  it('creates a canvas element', async () => {
    expect(document.querySelector('canvas')).toBeNull();
    mount(<UnityRenderer />);
  });

  it('does not trigger callbacks after initial mounting', async () => {
    let progress = 0;
    let ready = false;
    let error = false;

    mount(
      <UnityRenderer
        context={unityContext}
        onUnityError={() => (error = true)}
        onUnityProgressChange={(p) => (progress = p)}
        onUnityReadyStateChange={(s) => (ready = s)}
      />
    );
    expect(progress).toBe(0);
    expect(ready).toBe(false);
    expect(error).toBe(false);
  });

  it('triggers the error callback when the loader script fails to load', async () => {
    let error = false;
    let message = '';
    window.createUnityInstance = createUnityValid();

    mount(
      <UnityRenderer
        context={unityContext}
        onUnityError={(e) => {
          error = true;
          message = e.message;
        }}
      />
    );
    completeLoader(true);

    expect(error).toBe(true);
    expect(message).toMatch(/failed to mount/);
  });

  it('resets and triggers the error callback when the instance fails to initialize', async () => {
    let state = true;
    let progress = 0.5;
    let error = false;
    let message = '';
    window.createUnityInstance = createUnityInvalid();

    mount(
      <UnityRenderer
        context={unityContext}
        onUnityError={(e) => {
          error = true;
          message = e.message;
        }}
        onUnityProgressChange={(p) => (progress = p)}
        onUnityReadyStateChange={(r) => (state = r)}
      />
    );
    await act(async () => completeLoader());

    expect(progress).toBe(0);
    expect(state).toBe(false);

    expect(error).toBe(true);
    expect(message).toMatch(/unit test/);
  });
});

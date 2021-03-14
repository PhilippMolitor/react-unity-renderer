/// <reference path="../../../typings/unity.d.ts" />

import { mount } from 'enzyme';
import { act, fireEvent } from '@testing-library/react';
import { UnityContext } from '../../lib/context';

import { UnityRenderer } from '../UnityRenderer';

type CreateUnityFn = typeof window.createUnityInstance;

describe('<UnityRenderer>', () => {
  const MockUnityInstance = jest
    .fn<UnityInstance, []>()
    .mockImplementation(() => ({
      SendMessage: jest.fn(),
      Quit: jest
        .fn()
        .mockImplementation(() => new Promise((reject, resolve) => resolve())),
      SetFullscreen: jest.fn(),
    }));
  let createUnityValid: jest.Mock<
    ReturnType<CreateUnityFn>,
    Parameters<CreateUnityFn>
  >;
  let createUnityInvalid: jest.Mock<
    ReturnType<CreateUnityFn>,
    Parameters<CreateUnityFn>
  >;
  let unityContext: UnityContext;

  beforeEach(() => {
    createUnityValid = jest
      .fn<ReturnType<CreateUnityFn>, Parameters<CreateUnityFn>>()
      .mockImplementation(
        () =>
          new Promise<UnityInstance>((resolve) =>
            resolve(new MockUnityInstance())
          )
      );
    createUnityInvalid = jest
      .fn<ReturnType<CreateUnityFn>, Parameters<CreateUnityFn>>()
      .mockImplementation(
        () =>
          new Promise<UnityInstance>((resolve, reject) =>
            reject(new Error('unit test'))
          )
      );
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
  });

  function completeLoader(error: boolean = false) {
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
    const wrapper = mount(<UnityRenderer />);
    expect(wrapper).toBeDefined();
  });

  it('creates a canvas element', async () => {
    expect(document.querySelector('canvas')).toBeNull();
    const wrapper = mount(<UnityRenderer />);
  });

  it('does not trigger callbacks after initial mounting', async () => {
    let progress = 0;
    let ready = false;
    let error = false;

    mount(
      <UnityRenderer
        onUnityError={() => (error = true)}
        onUnityProgressChange={(p) => (progress = p)}
        onUnityReadyStateChange={(s) => (ready = s)}
      />
    );
    expect(progress).toBe(0);
    expect(ready).toBe(false);
    expect(error).toBe(false);
  });

  it('uses the loader script', async () => {
    window.createUnityInstance = createUnityValid;
    mount(<UnityRenderer context={unityContext} />);

    expect(createUnityValid).not.toHaveBeenCalled();
    completeLoader();
    expect(createUnityValid).toHaveBeenCalled();
  });
});

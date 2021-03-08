/// <reference path="../../../typings/unity.d.ts" />

import { UnityContext, UnityLoaderConfig } from '../context';

describe('UnityContext', () => {
  const cfg: UnityLoaderConfig = {
    loaderUrl: 'a',
    codeUrl: 'b',
    frameworkUrl: 'c',
    dataUrl: 'd',
    streamingAssetsUrl: 'e',
    symbolsUrl: 'f',
    memoryUrl: 'g',
    modules: { h: true },
    companyName: 'i',
    productName: 'j',
    productVersion: 'k',
  };

  let ctx: UnityContext;
  let instance: UnityInstance;

  // mock instance class as it is only provided by a Unity loader script
  const MockUnityInstance = () =>
    jest.fn<UnityInstance, any>().mockImplementation(() => ({
      Quit: jest.fn().mockResolvedValue(undefined),
      SendMessage: jest.fn(),
      SetFullscreen: jest.fn(),
    }));

  beforeEach(async () => {
    // @ts-ignore
    delete window.__UnityBridgeRegistry__;
    // @ts-ignore
    delete window.UnityBridge;

    // @ts-ignore
    ctx = undefined;
    ctx = new UnityContext(cfg);

    // @ts-ignore
    instance = undefined;
    instance = new (MockUnityInstance())();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('stores and retrieves the loader configuration', async () => {
    const ctx = new UnityContext(cfg);

    expect(ctx.getConfig()).toStrictEqual(cfg);
  });

  it('creates the global event registry', async () => {
    expect(window.__UnityBridgeRegistry__).toStrictEqual({});
  });

  it('creates the global event lookup handler', async () => {
    expect(typeof window.UnityBridge).toBe('function');
  });

  it('registers an event handler to the global registry', async () => {
    const handler = jest.fn();

    ctx.on('test', handler);
    expect(window.__UnityBridgeRegistry__).toStrictEqual({ test: [handler] });
    expect(handler).not.toHaveBeenCalled();

    window.UnityBridge('test')('string', 42);
    expect(handler).toHaveBeenCalledWith('string', 42);
  });

  it('replaces a double event handler in the global registry', async () => {
    const handlerA = jest.fn();
    const handlerB = jest.fn();

    ctx.on('test', handlerA);
    expect(window.__UnityBridgeRegistry__).toStrictEqual({ test: [handlerA] });
    ctx.on('test', handlerB);
    expect(window.__UnityBridgeRegistry__).toStrictEqual({ test: [handlerB] });
  });

  it('logs a warning when calling an unknown event', async () => {
    let message: string = '';
    const consoleWarn = jest
      .spyOn(console, 'warn')
      .mockImplementation((m: string) => (message = m));

    expect(consoleWarn).not.toHaveBeenCalled();
    window.UnityBridge('test')(42, test);

    expect(consoleWarn).toHaveBeenCalled();
    expect(message).toMatch(/\"test\"/);
  });

  it('unregisters a previously registered event', async () => {
    // add handler
    const handler = jest.fn();
    ctx.on('test', handler);
    expect(window.__UnityBridgeRegistry__).toStrictEqual({ test: [handler] });

    // remove it again
    ctx.off('test');
    expect(window.__UnityBridgeRegistry__).toStrictEqual({ test: [] });
  });

  it('registers events with the same name for to contexts', async () => {
    const ctxB = new UnityContext(cfg);

    const handlerA = jest.fn();
    const handlerB = jest.fn();
    ctx.on('test-a-b', handlerA);
    ctxB.on('test-a-b', handlerB);

    window.UnityBridge('test-a-b')('abtest', 42);
    expect(handlerA).toHaveBeenCalledWith('abtest', 42);
    expect(handlerB).toHaveBeenCalledWith('abtest', 42);

    expect(window.__UnityBridgeRegistry__).toStrictEqual({
      'test-a-b': [handlerA, handlerB], // order matters here!
    });
  });

  it('emits a message to the unity instance', async () => {
    ctx.setInstance(instance);
    ctx.emit('GameObject', 'MethodName', 42);

    expect(instance.SendMessage).toHaveBeenCalledWith(
      'GameObject',
      'MethodName',
      42
    );
  });

  it('logs an error when failing to emit an event to a valid instance', async () => {
    let message: string = '';
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation((m: string) => (message = m));

    expect(consoleError).not.toHaveBeenCalled();

    ctx.setInstance(
      new (jest.fn<UnityInstance, any>().mockImplementation(() => ({
        Quit: jest.fn(),
        SendMessage() {
          throw new Error();
        },
        SetFullscreen: jest.fn(),
      })))()
    );
    ctx.emit('GameObject', 'MethodName');

    expect(consoleError).toHaveBeenCalled();
    expect(message).toMatch(/failed/);
  });

  it('fails to emit a message without having an instance set', async () => {
    let message: string = '';
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation((m: string) => (message = m));

    expect(consoleError).not.toHaveBeenCalled();

    ctx.emit('GameObject', 'MethodName', 42);

    expect(consoleError).toHaveBeenCalled();
    expect(message).toMatch(/missing instance/);
  });

  it('shuts down a valid instance', async () => {
    ctx.setInstance(instance);

    const callback = jest.fn();

    expect(instance.Quit).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();

    // await works here
    await ctx.shutdown(callback);

    expect(instance.Quit).toHaveBeenCalled();
    expect(callback).toHaveBeenCalled();
  });

  it('shuts down with a callback without a valid instane', async () => {
    const callback = jest.fn();

    expect(callback).not.toHaveBeenCalled();

    // await works here
    await ctx.shutdown(callback);

    expect(callback).toHaveBeenCalled();
  });

  it('calls the fullscreen method', async () => {
    const instance = new (MockUnityInstance())();
    ctx.setInstance(instance);

    ctx.setFullscreen(true);
    expect(instance.SetFullscreen).toHaveBeenCalledWith(1);

    ctx.setFullscreen(false);
    expect(instance.SetFullscreen).toHaveBeenCalledWith(0);
  });
});

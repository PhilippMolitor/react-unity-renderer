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

  beforeEach(async () => {
    // @ts-ignore
    delete window.__UnityBridgeRegistry__;
    // @ts-ignore
    delete window.UnityBridge;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('stores and retrieves the loader configuration', async () => {
    const ctx = new UnityContext(cfg);

    expect(ctx.getConfig()).toStrictEqual(cfg);
  });

  it('creates the global event registry', async () => {
    expect(window.__UnityBridgeRegistry__).toBe(undefined);

    new UnityContext(cfg);

    expect(window.__UnityBridgeRegistry__).toStrictEqual({});
  });

  it('creates the global event lookup handler', async () => {
    expect(window.UnityBridge).toBe(undefined);

    new UnityContext(cfg);

    expect(typeof window.UnityBridge).toBe('function');
  });

  it('registers an event handler to the global registry', async () => {
    const ctx = new UnityContext(cfg);
    const handler = jest.fn();

    ctx.on('test', handler);
    expect(window.__UnityBridgeRegistry__).toStrictEqual({ test: [handler] });
    expect(handler).not.toHaveBeenCalled();

    window.UnityBridge('test')('string', 42);
    expect(handler).toHaveBeenCalledWith('string', 42);
  });

  it('logs a warning when calling an unknown event', async () => {
    new UnityContext(cfg);

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
    const ctx = new UnityContext(cfg);
    expect(window.__UnityBridgeRegistry__).toStrictEqual({});

    // add handler
    const handler = jest.fn();
    ctx.on('test', handler);
    expect(window.__UnityBridgeRegistry__).toStrictEqual({ test: [handler] });

    // remove it again
    ctx.off('test');
    expect(window.__UnityBridgeRegistry__).toStrictEqual({ test: [] });
  });

  it('registers events with the same name for to contexts', async () => {
    const ctxA = new UnityContext(cfg);
    const ctxB = new UnityContext(cfg);

    const handlerA = jest.fn();
    const handlerB = jest.fn();
    ctxA.on('test-a-b', handlerA);
    ctxB.on('test-a-b', handlerB);

    window.UnityBridge('test-a-b')('abtest', 42);
    expect(handlerA).toHaveBeenCalledWith('abtest', 42);
    expect(handlerB).toHaveBeenCalledWith('abtest', 42);

    expect(window.__UnityBridgeRegistry__).toStrictEqual({
      'test-a-b': [handlerA, handlerB], // order matters here!
    });
  });
});

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

  it('stores and retrieves the loader configuration', async () => {
    const ctx = new UnityContext(cfg);

    expect(ctx.getConfig()).toStrictEqual(cfg);
  });

  it('creates the global event registry', async () => {
    // @ts-ignore
    expect(window.__UnityBridgeRegistry__).toBe(undefined);

    new UnityContext(cfg);

    // @ts-ignore
    expect(window.__UnityBridgeRegistry__).toStrictEqual({});
  });

  it('creates the global event lookup handler', async () => {
    // @ts-ignore
    expect(window.UnityBridge).toBe(undefined);

    new UnityContext(cfg);

    // @ts-ignore
    expect(typeof window.UnityBridge).toBe('function');
  });

  it('registers an event handler to the global registry', async () => {
    const ctx = new UnityContext(cfg);

    const callback = jest.fn();

    ctx.on('test', (...params: any) => callback(params));

    expect(callback).not.toHaveBeenCalled();

    // @ts-ignore
    window.UnityBridge('test')('string', 42);

    expect(callback).toHaveBeenCalledWith(['string', 42]);
  });
});

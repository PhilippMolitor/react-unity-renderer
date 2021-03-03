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

  it('stores and retrieves the loader configuration', async () => {
    const ctx = new UnityContext(cfg);

    expect(ctx.getConfig()).toEqual(cfg);
  });
});

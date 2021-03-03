import { fireEvent } from '@testing-library/dom';
import { UnityLoaderService } from '../loader';

describe('UnityLoaderService', () => {
  const url = 'http://example.com/script.js';
  let loader: UnityLoaderService;

  beforeEach(() => {
    loader = new UnityLoaderService();
  });

  it('can create a loader', async () => {
    expect(loader).toBeInstanceOf(UnityLoaderService);
  });

  it('resolves on <script> load', async (done) => {
    loader.execute(url).then(() => {
      expect(script!.src).toEqual(url);
      done();
    });

    const script = document.querySelector('script');

    expect(script).toBeDefined();
    fireEvent.load(script!);
  });

  it('can unmount itself', async () => {
    loader.execute(url).then(() => {
      loader.unmount();
      expect(script).not.toBeDefined();
    });

    const script = document.querySelector('script');

    expect(script).toBeDefined();
    fireEvent.load(script!);
  });
});

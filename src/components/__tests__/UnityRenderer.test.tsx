import { mount, ReactWrapper } from 'enzyme';

import { UnityContext } from '../../lib/context';
import { UnityRenderer } from '../UnityRenderer';

describe('<UnityRenderer /> (unconfigured)', () => {
  const loaderUrl = 'http://example.com/script.js';

  const ctx = new UnityContext({
    loaderUrl: loaderUrl,
    codeUrl: '',
    dataUrl: '',
    frameworkUrl: '',
  });

  let renderer: ReactWrapper<typeof UnityRenderer>;
  let progress = 0;
  let ready = false;
  let error = false;

  beforeEach(() => {
    renderer = mount<typeof UnityRenderer>(
      <UnityRenderer
        context={ctx}
        onUnityProgressChange={(p) => (progress = p)}
        onUnityReadyStateChange={(r) => (ready = r)}
        onUnityError={() => (error = true)}
        className="test"
      />
    );
  });

  it('renders with minimal configuration', async () => {
    expect(renderer).toBeDefined();
  });

  it('uses the context prop', async () => {
    expect(renderer.prop('context')).toBe(ctx);
  });

  it('uses the className prop', async () => {
    expect(renderer.prop('className')).toBe('test');
  });

  it('does not trigger callbacks yet', async () => {
    expect(progress).toBe(0);
    expect(ready).toBe(false);
    expect(error).toBe(false);
  });
});

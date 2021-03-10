import { render } from 'enzyme';
import { VFC } from 'react';
import { unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';

import { useScript } from '../useScript';

describe('useScript()', () => {
  const TestComponent: VFC<{ src: string }> = ({
    src,
  }: {
    src: string;
  }): JSX.Element => {
    const [state, setScript] = useScript(src);
    return <>{state}</>;
  };

  it('renders without errors', async () => {
    const src = 'https://example.com/script.js';
    render(<TestComponent src={src} />);
  });
});

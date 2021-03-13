import { fireEvent } from '@testing-library/dom';
import { renderHook, act } from '@testing-library/react-hooks';

import { ScriptStatus, useScript } from '../useScript';

describe('useScript()', () => {
  const scriptUrl = 'https://example.com/script.js';

  it('initializes without errors', async () => {
    renderHook(() => useScript());
    renderHook(() => useScript(scriptUrl));
  });

  it('creates no <script> without a source', async () => {
    renderHook(() => useScript());

    const element = document.querySelector(
      `script[src="${scriptUrl}"]`
    ) as HTMLScriptElement;

    expect(element).toBeNull();
  });

  it('creates a <script> tag when initializing', async () => {
    renderHook(() => useScript(scriptUrl));

    const element = document.querySelector(
      `script[src="${scriptUrl}"]`
    ) as HTMLScriptElement;
    expect(element).not.toBeNull();
  });

  it('is in "unloaded" state when having no source', async () => {
    const { result } = renderHook(() => useScript());
    const [state] = result.current;

    expect(state).toStrictEqual<ScriptStatus>('unloaded');
  });

  it('is in "loading" state when having a source', async () => {
    const { result } = renderHook(() => useScript(scriptUrl));
    const [state] = result.current;

    expect(state).toStrictEqual<ScriptStatus>('loading');
  });

  it('is in "active" state when the "onload" event was triggered', async () => {
    const { result } = renderHook(() => useScript(scriptUrl));

    expect(result.current[0]).toStrictEqual<ScriptStatus>('loading');

    const element = document.querySelector(
      `script[src="${scriptUrl}"]`
    ) as HTMLScriptElement;

    act(() => {
      fireEvent.load(element);
    });

    expect(result.current[0]).toStrictEqual<ScriptStatus>('active');
  });

  it('is in "error" state when the "onerror" event was triggered', async () => {
    const { result } = renderHook(() => useScript(scriptUrl));

    expect(result.current[0]).toStrictEqual<ScriptStatus>('loading');

    const element = document.querySelector(
      `script[src="${scriptUrl}"]`
    ) as HTMLScriptElement;

    act(() => {
      fireEvent.error(element);
    });

    expect(result.current[0]).toStrictEqual<ScriptStatus>('error');
  });

  it('is in "unloaded" state when the source is removed', async () => {
    const { result } = renderHook(() => useScript(scriptUrl));

    expect(result.current[0]).toStrictEqual<ScriptStatus>('loading');

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toStrictEqual<ScriptStatus>('unloaded');
  });

  it('reuses the old script tag when changing the source URL', async () => {
    const newUrl = 'https://test.com/loader.js';
    const { result } = renderHook(() => useScript(scriptUrl));

    const element = document.querySelector(
      `script[src="${scriptUrl}"]`
    ) as HTMLScriptElement;

    expect(result.current[0]).toStrictEqual<ScriptStatus>('loading');
    expect(element).toBeInTheDocument();

    act(() => {
      result.current[1](newUrl);
    });

    const newElement = document.querySelector(
      `script[src="${newUrl}"]`
    ) as HTMLScriptElement;

    expect(element).not.toBeInTheDocument();
    expect(newElement).toBeInTheDocument();
  });

  it('reuses the script element when using loading the active source URL again', async () => {
    const { result } = renderHook(() => useScript(scriptUrl));

    const element = document.querySelector(
      `script[src="${scriptUrl}"]`
    ) as HTMLScriptElement;

    expect(result.current[0]).toStrictEqual<ScriptStatus>('loading');
    expect(element.src).toStrictEqual(scriptUrl);

    act(() => {
      result.current[1](scriptUrl);
    });

    expect(result.current[0]).toStrictEqual<ScriptStatus>('loading');
    expect(element).toBeInTheDocument();
  });

  it('handles an existing script', async () => {
    const script = document.createElement('script');
    script.src = scriptUrl;
    document.body.appendChild(script);

    const { result } = renderHook(() => useScript(scriptUrl));

    const element = document.querySelector(
      `script[src="${scriptUrl}"]`
    ) as HTMLScriptElement;

    expect(result.current[0]).toStrictEqual<ScriptStatus>('loading');
    expect(element.src).toStrictEqual(scriptUrl);

    act(() => {
      result.current[1](scriptUrl);
    });

    expect(result.current[0]).toStrictEqual<ScriptStatus>('loading');
    expect(element).toBeInTheDocument();
  });

  it('removes the <script> tag when setting the source to undefined', async () => {
    const { result } = renderHook(() => useScript(scriptUrl));

    const element = document.querySelector(
      `script[src="${scriptUrl}"]`
    ) as HTMLScriptElement;

    expect(element).toBeInTheDocument();

    act(() => {
      result.current[1]();
    });

    expect(element).not.toBeInTheDocument();
  });

  it('removes the <script> tag on unmount', async () => {
    const { unmount } = renderHook(() => useScript(scriptUrl));

    const element = document.querySelector(
      `script[src="${scriptUrl}"]`
    ) as HTMLScriptElement;

    expect(element).toBeInTheDocument();

    unmount();

    expect(element).not.toBeInTheDocument();
  });
});

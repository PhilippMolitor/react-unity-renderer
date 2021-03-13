/*
 * This is an enhanced version of useScript by "useHooks.com":
 * https://usehooks.com/useScript/
 */
import { useEffect, useState } from 'react';

export type UseScriptValue = [
  state: ScriptStatus,
  setSource: (src?: string) => void
];

export type ScriptStatus = 'unloaded' | 'loading' | 'active' | 'error';

export const useScript = (src?: string): UseScriptValue => {
  const [source, setSource] = useState<string | undefined>(src);
  const [scriptState, setScriptState] = useState<ScriptStatus>(
    src ? 'loading' : 'unloaded'
  );

  // on state change
  useEffect(() => {
    let script = document.querySelector(`script[src="${source}"]`) as
      | HTMLScriptElement
      | undefined;

    if (!source) {
      setScriptState('unloaded');
    } else if (source && !script) {
      // if script is not in DOM yet, add it
      script = document.createElement('script');
      script.src = source;
      script.async = true;

      // callback on script load/error to update the hooks state
      const setStateCallback = (event: Event) => {
        setScriptState(
          (event.type as keyof HTMLElementEventMap) === 'load'
            ? 'active'
            : 'error'
        );
      };

      script.addEventListener('load', setStateCallback);
      script.addEventListener('error', setStateCallback);

      // attach the script to the DOM
      document.body.appendChild(script);
    }

    return (): void => {
      if (script) script.remove();
    };
  }, [source]);

  return [scriptState, (sourceUrl?: string) => setSource(sourceUrl)];
};

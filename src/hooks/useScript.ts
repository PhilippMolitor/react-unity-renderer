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

function setScriptDataAttribute(
  script: HTMLScriptElement | undefined,
  status: ScriptStatus
) {
  script?.setAttribute('data-state', status);
}

export const useScript = (src?: string): UseScriptValue => {
  const [source, setSource] = useState<string | undefined>(src);
  const [scriptState, setScriptState] = useState<ScriptStatus>(
    src ? 'loading' : 'unloaded'
  );

  // on state change
  useEffect(() => {
    // get a reference to the script element
    let script = document.querySelector(`script[src="${src}"]`) as
      | HTMLScriptElement
      | undefined;

    // unload the script
    if (!source) {
      setScriptState('unloaded');
      if (script) script.remove();
      return;
    }

    // if script is not in DOM yet, add it
    if (!script) {
      script = document.createElement('script');
      script.src = source;
      script.async = true;
      setScriptDataAttribute(script, 'loading');

      // callback on script load/error to update the script data attribute
      const setAttributeCallback = (event: Event) => {
        setScriptDataAttribute(
          script,
          (event.type as keyof HTMLElementEventMap) === 'load'
            ? 'active'
            : 'error'
        );
      };

      // attach callback to event handlers
      script.addEventListener('load', setAttributeCallback);
      script.addEventListener('error', setAttributeCallback);

      // attach the script to the DOM
      document.body.appendChild(script);
    }

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

    // eslint-disable-next-line consistent-return
    return () => {
      if (script) script.remove();
    };
  }, [source]);

  return [scriptState, (sourceUrl?: string) => setSource(sourceUrl)];
};

export class UnityLoaderService {
  private documentHead: HTMLHeadElement = document.querySelector('head')!;

  private script?: HTMLScriptElement;

  public attachLoader(url: string): Promise<void> {
    // eslint-disable-next-line consistent-return
    return new Promise<void>((resolve, reject): void => {
      // already loaded
      if (this.script !== undefined && this.script.src === url)
        return resolve();

      // another script is currently loaded
      if (this.script) this.script.remove();

      // create script node
      this.script = document.createElement('script');
      this.script.type = 'text/javascript';
      this.script.async = true;
      this.script.src = url;
      this.script.onload = () => resolve();
      this.script.onerror = () =>
        reject(new Error(`cannot download unity loader from: ${url}`));

      // attach
      this.documentHead.appendChild(this.script);
    });
  }

  public detachLoader(): void {
    this.script?.remove();
  }
}

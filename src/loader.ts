export class UnityLoaderService {
  private documentHead: HTMLHeadElement = document.querySelector('head')!;

  private script?: HTMLScriptElement;

  /**
   * Creates a new `<script>` tag in the DOM which executes the Unity WebGL
   * loader.
   *
   * @param {string} url The url of the Unity WebGL loader script.
   * @returns {Promise<void>} A `Promise` that resolves on successful
   * script execution.
   */
  public execute(url: string): Promise<void> {
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

  /**
   * Removes the loaders `<script>` tag from the DOM.
   */
  public unmount(): void {
    this.script?.remove();
  }
}

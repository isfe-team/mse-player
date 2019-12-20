/**
 * Simple helper | bqliu
 */

export default function readAsArrayBuffer$<T extends Blob>(x: T) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const fr = new FileReader()

    // hmmm, no need to unbind, if it's smart enough
    fr.addEventListener('load', () => resolve(fr.result as ArrayBuffer))
    fr.addEventListener('error', (e) => reject(e))

    fr.readAsArrayBuffer(x)
  });
}

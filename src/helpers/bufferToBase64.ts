/**
 * bufferToBase64
 */

export default function bufferToBase64Wav (buffer: ArrayBuffer) {
  const content = new Uint8Array(buffer).reduce((data, byte) => {
    return data + String.fromCharCode(byte)
  }, '')

  return btoa(content)
}

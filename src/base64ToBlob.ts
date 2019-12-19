import strToBase64 from './strToBase64'

export default function base64ToBlob(str: string, options?: any) {
  return strToBase64(str.split(',')[1], options);
}

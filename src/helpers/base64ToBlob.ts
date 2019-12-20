import base64WithoutPrefixToBlob from './base64WithoutPrefixToBlob'

export default function base64ToBlob(str: string, options?: any) {
  return base64WithoutPrefixToBlob(str.split(',')[1], options);
}

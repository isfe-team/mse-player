# MSEPlayer

> A player use MediaSource, by @hxli8 @bqliu.

## Solves

- pcm to wav
- use MediaSource to play multiple pcm/wav/mp3 files(concat) etc

## Notice

Some utilities like `strToBlob` and `wavToMp3` are exported for convenience. But notice that if you want to use `wavToMp3`, you need to import `lamejs` in global environment. And use your bundler, e.g. `rollup`, you need to use [rollup-plugin-external-globals](https://github.com/eight04/rollup-plugin-external-globals) and use it in your configuration.

```js
// simple rollup config
const config = {
  plugins: [nodeResolve(), commonjs(), rollupTypescript(), externalGlobals({ lamejs: 'lamejs' })]
}
```

For `webpack`, you may use `externals`. For `umd`, do it as you like.

## Refs

- [pcmToWav](https://segmentfault.com/a/1190000017982073?utm_source=tag-newest)
- [Media Source Extension](https://developer.mozilla.org/zh-CN/docs/Web/API/Media_Source_Extensions_API)

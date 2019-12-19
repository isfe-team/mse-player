import rollupTypescript from 'rollup-plugin-typescript'
// import { uglify as rollupUglify } from 'rollup-plugin-uglify'

const inputs = [
  ['src/MSEPlayer.ts', 'MSEPlayer'],
  ['src/pcmToWav.ts', 'pcmToWav'],
  ['src/strToBase64.ts', 'strToBase64'],
  ['src/base64ToBlob.ts', 'base64ToBlob'],
  ['src/base64ToWavBlob.ts', 'base64ToWavBlob'],
  ['src/bufferToBase64.ts', 'bufferToBase64'],
  ['src/wavToMp3.ts', 'wavToMp3']
]

const formats = [
  'esm',
  'umd'
]

function genConfigs () {
  return inputs.reduce((acc, [input, name]) => [...acc, ...formats.reduce((acc, format) => {
    const config = {
      input,
      plugins: [rollupTypescript()],
      external: ['lamejs'],
      output: {
        name,
        format,
        sourcemap: true,
        file: `dist/${name}.${format}.js`
      }
    }

    const configs = [...acc, config]
    // `uglifyjs` doesn't support es6
    // `esm` format will generate `export default`
    // ignore uglify version
    // if (format !== 'esm') {
    //   const compactConfig = {
    //     ...config,
    //     plugins: [...config.plugins, rollupUglify()],
    //     output: { ...config.output, file: `dist/${name}.${format}.min.js` }
    //   }
    //   configs.push(compactConfig)
    // }

    return configs
  }, [])], [])
}

const configs = genConfigs()

export default configs

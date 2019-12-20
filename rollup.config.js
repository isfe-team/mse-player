import rollupTypescript from 'rollup-plugin-typescript'
// import { uglify as rollupUglify } from 'rollup-plugin-uglify'

const inputs = [
  ['src/MSEPlayer.ts', 'MSEPlayer'],
  ['src/helpers/addWavHeader.ts', 'helpers/addWavHeader'],
  ['src/helpers/base64ToBlob.ts', 'helpers/base64ToBlob'],
  ['src/helpers/base64ToWavBlob.ts', 'helpers/base64ToWavBlob'],
  ['src/helpers/base64WithoutPrefixToBlob.ts', 'helpers/base64WithoutPrefixToBlob'],
  ['src/helpers/bufferToBase64.ts', 'helpers/bufferToBase64'],
  ['src/helpers/bufferToBase64Wav.ts', 'helpersbufferToBase64Wav'],
  ['src/helpers/pcmToWav.ts', 'helpers/pcmToWav'],
  ['src/helpers/readAsArrayBuffer$.ts', 'helpers/readAsArrayBuffer$'],
  ['src/helpers/wavToMp3.ts', 'helpers/wavToMp3']
]

const formats = [
  'esm',
  'umd'
]

function genConfigs () {
  return inputs.reduce((acc, [input, name]) => [...acc, ...formats.reduce((acc, format) => {
    const slashIndex = name.lastIndexOf('/')
    const fileName = slashIndex !== -1 ? name.slice(slashIndex) : name
    const config = {
      input,
      plugins: [rollupTypescript()],
      external: ['lamejs'],
      output: {
        name: fileName,
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

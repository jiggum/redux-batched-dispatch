/* eslint import/no-extraneous-dependencies:0 */
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import { uglify } from 'rollup-plugin-uglify'
import packageJson from './package.json'

const external = Object.keys(packageJson.dependencies)
const input = 'src/index.js'

export default [
  // IIFE build
  {
    input,
    output: {
      file: 'dist/index.js',
      format: 'umd',
      name: 'reduxBatchedDispatch',
      interop: false,
    },
    plugins: [
      resolve(),
      babel({ exclude: 'node_modules/**' }),
      commonjs({ include: 'node_modules/**' }),
      uglify(),
    ],
  },
  // ESM build
  {
    input,
    output: {
      file: 'es/index.js',
      format: 'esm',
      interop: false,
    },
    plugins: [babel({ exclude: 'node_modules/**' })],
    external,
  },
  // CommonJS build
  {
    input,
    output: {
      file: 'lib/index.js',
      format: 'cjs',
      interop: false,
    },
    plugins: [babel({ exclude: 'node_modules/**' })],
    external,
  },
]

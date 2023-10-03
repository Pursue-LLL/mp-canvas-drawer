import pkg from './package.json'
import { terser } from "rollup-plugin-terser";
import license from 'rollup-plugin-license';

const path = require('path');
export default {
	input: path.resolve(__dirname, 'src/index.js'),
  output: [
    {
      file: 'dist/index.js',
      format: 'esm',
    },
  ],
  plugins: [
    terser({ compress: { drop_console: true } }),
    license({
      banner: 'weapp.canvas-drawer.js v' + pkg.version + ' (' + pkg.homepage + ')'
    }),
  ]
}

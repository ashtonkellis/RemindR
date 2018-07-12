'use strict';


require('babel-polyfill');


require('dotenv').config();

if (!process.env.NODE_ENV) {
  throw new Error('Undefined NODE_ENV');
}

if (process.env.NODE_ENV !== 'production') {
  require('babel-register');
  require('./src/main');
} else {
  require('./build/main'); /*eslint-disable-line*/
}

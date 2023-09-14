import devConfig from './config.dev'
import prodConfig from './config.prod'

const type = process.env.NODE_ENV ?? "development";
let config = devConfig;

if (type === 'production') {
    config = prodConfig;
}

export default config;
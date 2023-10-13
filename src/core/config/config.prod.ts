import {Config} from './types'

const config: Config = {
    mongo: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '27017'),
        username: process.env.DB_USERNAME || '',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || ''
    },
    server: {
        secret: process.env.SECRET || '',
        mongoConnect: `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}`
    }
}

export default config
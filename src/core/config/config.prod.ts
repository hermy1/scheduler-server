import {Config} from './types'

const config: Config = {
    mongo: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '27017'),
        username: process.env.DB_USERNAME || '',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || ''
    },
    logging: {
        levels:{
            emerg: 0,
            alert: 1, 
            error: 2,
            warning: 3,
            info: 4,
            debug: 5
        },
        colors: {
            emerg: "stikethrough gray",
            alert: "gray",
            error: "red",
            wanring: "yellow",
            info: "blue",
            debug: "cyan"
        },
        silent: true,
        level: "warning",
        file: "./logs/errors.log"
    },server: {
        secret: process.env.SECRET || '',
        mongoConnect: `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}`
    }
}


export default config
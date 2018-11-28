var winston = require('winston');
var { transports, createLogger, format } = winston;

var logger = createLogger({
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.json(),
        format.align(),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: 'D:/Node Programs/microservice/logs/info.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),
        new winston.transports.File({
            level: 'error',
            filename: 'D:/Node Programs/microservice/logs/error.log',
            handleExceptions: true,
            json: true,
            colorize: false
        }),
        new winston.transports.File({
            level: 'debug',
            filename: 'D:/Node Programs/microservice/logs/debug.log',
            handleExceptions: true,
            json: true,
            colorize: false
        }),
        new winston.transports.Console({
            level: 'info',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ]
});

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};
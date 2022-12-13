import { Sequelize, Model, DataTypes } from 'sequelize';
import fs from 'fs';
import db from "./models.js";
(async() => {

    const sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USERNAME,
        process.env.DB_PASSWORD, {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            dialect: 'postgres',
            logging: false,
        });

    const IISLog = db(sequelize, Sequelize);

    function readFiles(dirname, onFileContent, onError, onCompleted) {
        fs.readdir(dirname, function(err, filenames) {
            if (err) {
                onError(err);
                return;
            }
            let count = filenames.length;
            let index = 0;
            filenames.forEach(function(filename, fileIndex) {
                console.info(`Reading ${filename}`)
                fs.readFile(`${dirname}\\${filename}`, 'utf-8', function(err, content) {
                    if (err) {
                        onError(err);
                        return;
                    }
                    onFileContent(filename, content, count, index);
                    index++;
                    if (index > count) {
                        onCompleted();
                    }
                });
            });
        });
    }

    const rex = /^(\d{4}\-\d{2}\-\d{2}\s[\d:]+)\s([\d\.]+)\s([\w]+)\s([-a-zA-Z0-9()@:%_\+.~#?&\/=]+)\s([-a-zA-Z0-9()@:%_\+.~#?&\/=]+)\s(\d+)\s([-a-zA-Z0-9()@:%_\+.~#?&\/=]+)\s([\d\.]+)\s([-a-zA-Z0-9()@:%_\+.~#?&\/=\;]*)\s([-a-zA-Z0-9()@:%_\+.~#?&\/=\;]+)\s([\d\.]+)\s([\d\.]+)\s([\d\.]+)\s([\d\.]+)$/;

    readFiles("C:\\yssy\\CREA\\Logs\\LOGS serviceapi\\IIS\\pasta5",
        (filename, content, count, index) => {
            let logEntries = [];
            let pagesize = 1000;
            let pagecount = 0;
            content.split('\r\n').filter((e) => e).forEach((item, index) => {
                // if (index < 5) {
                const match = rex.exec(item);
                //console.log(match);
                if (match) {
                    const entry = {
                        date_time: match[1],
                        local_ip: match[2],
                        method: match[3],
                        path: match[4],
                        query: match[5],
                        port: match[6],
                        username: match[7],
                        remoteIp: match[8],
                        userAgent: match[9],
                        refer: match[10],
                        status: match[11],
                        subStatus: match[12],
                        win32Status: match[13],
                        timeTaken: match[14]
                    };
                    //console.log(entry);
                    logEntries.push(entry);
                    pagecount++;
                    if (pagecount == pagesize) {
                        console.info(`Saving ${logEntries.length} items from ${filename}...`);
                        pagecount = 0;
                        let trying = 0;
                        while (trying < 10) {
                            try {
                                IISLog.bulkCreate(logEntries)
                                    .then(data => {
                                        console.info(`${data.length} log entries saved`);
                                    })
                                    .catch(err => {
                                        throw err;
                                    });
                                logEntries = [];
                                trying = 10;
                            } catch (ex) {
                                console.error(ex);
                                trying++;
                                if (trying == 10) throw ex;
                            }
                        }
                    }
                }
                //}
            });

            if (logEntries.length > 0) {
                console.info(`Saving ${logEntries.length} entries left from ${filename}...`);
                IISLog.bulkCreate(logEntries)
                    .then(data => {
                        console.info(`${logEntries.length} log entries saved`);
                    })
                    .catch(err => {
                        throw err;
                    });
            }
        },
        (erro) => {
            console.log(`ERRO`)
            console.error(erro);
        },
        () => {
            console.info(`CONCLUIDO`)
        }
    );

})();
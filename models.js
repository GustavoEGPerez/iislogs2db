//date time s-ip cs-method cs-uri-stem cs-uri-query s-port cs-username c-ip cs(User-Agent) cs(Referer) sc-status sc-substatus sc-win32-status time-taken

export default (sequelize, Sequelize) => {
    const IISLog = sequelize.define("iis_logs", {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        date_time: {
            type: Sequelize.STRING,
            length: 20
        },
        local_ip: {
            type: Sequelize.STRING,
            length: 16
        },
        method: {
            type: Sequelize.STRING,
            length: 16
        },
        path: {
            type: Sequelize.STRING,
            length: 255
        },
        query: {
            type: Sequelize.STRING,
            length: 255
        },
        port: {
            type: Sequelize.STRING,
            length: 5
        },
        username: {
            type: Sequelize.STRING,
            length: 255
        },
        remoteIp: {
            type: Sequelize.STRING,
            length: 16
        },
        userAgent: {
            type: Sequelize.STRING,
            length: 255
        },
        refer: {
            type: Sequelize.STRING,
            length: 255
        },
        status: {
            type: Sequelize.STRING,
            length: 20
        },
        subStatus: {
            type: Sequelize.STRING,
            length: 10
        },
        win32Status: {
            type: Sequelize.STRING,
            length: 10
        },
        timeTaken: {
            type: Sequelize.STRING,
            length: 10
        }
    });

    IISLog.removeAttribute('id')
    return IISLog;
};
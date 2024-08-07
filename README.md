# IIS Log Importer

## Overview

This Node.js script reads IIS log files from a specified directory and imports them into a PostgreSQL database. It uses Sequelize ORM to manage database interactions and is designed to handle large log files efficiently by batching inserts.

## Prerequisites

1. **Node.js**: Ensure Node.js is installed. You can download it from [Node.js official website](https://nodejs.org/).
2. **PostgreSQL**: Make sure you have a PostgreSQL database set up.
3. **Sequelize**: An ORM for Node.js to handle database operations.

## Installation

1. Clone the repository:

    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2. Install the dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and add your database credentials:

    ```env
    DB_NAME=your_db_name
    DB_USERNAME=your_db_username
    DB_PASSWORD=your_db_password
    DB_HOST=your_db_host
    DB_PORT=your_db_port
    ```

## Usage

1. Make sure your database is running and accessible with the credentials provided in the `.env` file.

2. Run the script:

    ```bash
    node import-logs.js
    ```

   This will start the process of reading log files from the specified directory and importing them into the database.

## Directory Structure

```
├── models.js             # Contains the Sequelize model definition for IIS logs
├── import-logs.js        # Main script to read logs and import to database
├── package.json          # Node.js project configuration
├── package-lock.json     # Node.js dependencies lock file
└── .env                  # Environment variables for database configuration
```

## Code Explanation

### models.js

Defines the Sequelize model for the IIS logs table.

```javascript
import { Sequelize, DataTypes } from 'sequelize';

export default (sequelize) => {
    const IISLog = sequelize.define('IISLog', {
        date_time: { type: DataTypes.STRING },
        local_ip: { type: DataTypes.STRING },
        method: { type: DataTypes.STRING },
        path: { type: DataTypes.STRING },
        query: { type: DataTypes.STRING },
        port: { type: DataTypes.STRING },
        username: { type: DataTypes.STRING },
        remoteIp: { type: DataTypes.STRING },
        userAgent: { type: DataTypes.STRING },
        refer: { type: DataTypes.STRING },
        status: { type: DataTypes.STRING },
        subStatus: { type: DataTypes.STRING },
        win32Status: { type: DataTypes.STRING },
        timeTaken: { type: DataTypes.STRING },
    }, {
        timestamps: false,
        tableName: 'iis_logs',
    });

    return IISLog;
};
```

### import-logs.js

Main script to read IIS log files from a specified directory and import them into the PostgreSQL database.

```javascript
import { Sequelize } from 'sequelize';
import fs from 'fs';
import db from "./models.js";

(async () => {
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
                console.info(`Reading ${filename}`);
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
                const match = rex.exec(item);
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
            console.log(`ERROR`);
            console.error(erro);
        },
        () => {
            console.info(`COMPLETED`);
        }
    );
})();
```

## Environment Variables

Ensure you have a `.env` file in your project's root directory with the following variables:

```env
DB_NAME=your_db_name
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=your_db_port
```

## Error Handling

The script includes basic error handling to catch and log errors during the file reading and database insertion process.

## Conclusion

This script provides a simple way to import IIS log files into a PostgreSQL database using Node.js and Sequelize. It can be adapted for other log file formats or database systems with minor modifications.

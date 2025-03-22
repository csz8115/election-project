const fs = require('fs');
const path = require('path');


class DAError extends Error {
    constructor(message){
        super(message)
        this.name = "DAError";
        this.time = new Date();
        this.logError();
    }

    logError() {
        const logMessage = this.name + " - " + this.time + ":\n" + this.message;
        fs.appendFile('src/server/DAerror.log', logMessage, (err) => {
            if (err) {
                console.error('Failed to write to log file:', err);
            }
        });
        console.log(logMessage);
    }
}

module.exports = DAError;
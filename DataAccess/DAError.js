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
        fs.appendFile('DAerror.log', logMessage);
        console.log(logMessage);
    }
}

Module.exports = DAError;
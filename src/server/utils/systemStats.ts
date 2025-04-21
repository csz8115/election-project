import fs from 'fs';
// read log files and generate system stats

async function getSystemStats() {
    const dbLogs = JSON.parse(fs.readFileSync('logs/db.log', 'utf8'));
    const serverLogs = JSON.parse(fs.readFileSync('logs/server.log', 'utf8'));

    // Get the number of db connections

}

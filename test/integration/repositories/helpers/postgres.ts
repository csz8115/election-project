import { PostgreSqlContainer } from "@testcontainers/postgresql";
import * as crypto from "node:crypto";

export type StartedTestDB = {
    url: string;
    containerId: string;
    host: string;
    port: number;
    stop: () => Promise<void>;
};

export async function startTestDatabase(): Promise<StartedTestDB> {

    const db = `test_${crypto.randomBytes(6).toString("hex")}`;
    const container = await new PostgreSqlContainer('postgres:15')
        .withDatabase(db)
        .withUsername('testuser')
        .withPassword(crypto.randomBytes(16).toString('hex'))
        .start();

    const url = container.getConnectionUri();
    return {
        url,
        containerId: container.getId(),
        host: container.getHost(),
        port: container.getPort(),
        stop: async () => {
            await container.stop();
        },
    };
}

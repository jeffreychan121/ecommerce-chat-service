export interface AppConfig {
    app: {
        name: string;
        port: number;
        env: string;
    };
    database: {
        url: string;
    };
    redis: {
        host: string;
        port: number;
    };
    dify: {
        baseUrl: string;
        apiKey: string;
        appId: string;
        timeout: number;
    };
    log: {
        level: string;
        format: string;
    };
}
export declare const configuration: () => AppConfig;
export default configuration;

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            TOKEN: string;
            APPLICATION_ID: string;
            OPENSEARCH_ENDPOINT: string;
            OPENSEARCH_INDEX: string;
            AWS_REGION: string;
        }
    }
}

export {};

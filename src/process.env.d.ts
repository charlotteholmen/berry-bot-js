declare global {
    namespace NodeJS {
        interface ProcessEnv {
            TOKEN: string;
            APPLICATION_ID: string;
            OPENSEARCH_ENDPOINT: string;
            OPENSEARCH_COLLECTION_ID: string;
            AWS_REGION: string;
        }
    }
}

export {};

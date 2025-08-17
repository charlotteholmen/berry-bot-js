declare global {
    namespace NodeJS {
        interface ProcessEnv {
            TOKEN: string;
            APPLICATION_ID: string;
            OPENSEARCH_ENDPOINT: string;
            OPENSEARCH_INDEX: string;
            AWS_REGION: string;
            LOCAL: string;
            LOCAL_OPENSEARCH_USERNAME: string;
            LOCAL_OPENSEARCH_PASSWORD: string;
            OPENAI_API_KEY: string;
        }
    }
}

export {};

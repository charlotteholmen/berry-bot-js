declare global {
    namespace NodeJS {
        interface ProcessEnv {
            APPLICATION_ID: string;
            AWS_REGION: string;
            LOCAL: string;
            LOCAL_OPENSEARCH_PASSWORD: string;
            LOCAL_OPENSEARCH_USERNAME: string;
            OPENAI_API_KEY: string;
            OPENSEARCH_ENDPOINT: string;
            OPENSEARCH_INDEX: string;
            SQLITE_DB_PATH: string;
            TEXT_EMBEDDING_MODEL: string;
            TOKEN: string;
        }
    }
}

export {};

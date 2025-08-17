import {defaultProvider} from '@aws-sdk/credential-provider-node';
import type {API} from '@opensearch-project/opensearch';
import {Client} from '@opensearch-project/opensearch';
import {AwsSigv4Signer} from '@opensearch-project/opensearch/aws';
import type {TransportRequestPromise} from '@opensearch-project/opensearch/lib/Transport.js';

interface IndexMessageReq {
    timestamp: string;
    username : string;
    content  : string;
    guild    : string;
}

const awsConfig = AwsSigv4Signer({
    region        : process.env.AWS_REGION,
    service       : 'aoss',
    getCredentials: async () => {
        const credentialsProvider = defaultProvider();
        return await credentialsProvider();
    },
});

const localConfig = {
    ssl : {rejectUnauthorized: false},
    auth: {
        username: process.env.LOCAL_OPENSEARCH_USERNAME,
        password: process.env.LOCAL_OPENSEARCH_PASSWORD,
    },
};

export const opensearch = new Client({
    ...(process.env.LOCAL ? localConfig : awsConfig),
    node: process.env.OPENSEARCH_ENDPOINT,
});

export const indexMessage = async (body: IndexMessageReq): Promise<TransportRequestPromise<API.Index_Response>> => (
    await opensearch.index({
        index: process.env.OPENSEARCH_INDEX,
        body,
    })
);

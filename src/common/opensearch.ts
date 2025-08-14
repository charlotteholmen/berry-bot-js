import {defaultProvider} from '@aws-sdk/credential-provider-node';
import {Client} from '@opensearch-project/opensearch';
import {AwsSigv4Signer} from '@opensearch-project/opensearch/aws';

export const opensearch = new Client({
    ...AwsSigv4Signer({
        region        : process.env.AWS_REGION,
        service       : 'aoss',
        getCredentials: async () => {
            const credentialsProvider = defaultProvider();
            return await credentialsProvider();
        },
    }),
    node: process.env.OPENSEARCH_ENDPOINT,
});

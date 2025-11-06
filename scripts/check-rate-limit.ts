import {Client, GatewayIntentBits} from 'discord.js';

const checkRateLimit = async (): Promise<void> => {
    const token = process.env.TOKEN;

    if (!token) {
        console.error('TOKEN environment variable not set');
        process.exit(1);
    }

    const client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
    });

    client.once('ready', () => {
        console.log('Bot connected!\n');

        const rest = client.rest;

        console.log('=== Discord Rate Limit Information ===\n');
        console.log('Global Rate Limit:');
        console.log(`  Remaining: ${rest.globalRemaining}`);
        console.log(`  Reset At: ${rest.globalReset ? new Date(rest.globalReset).toISOString() : 'N/A'}`);
        console.log();

        // Listen for rate limit events
        rest.on('rateLimited', (info) => {
            console.log('\n=== RATE LIMITED ===');
            console.log(`Time to reset: ${info.timeToReset}ms`);
            console.log(`Limit: ${info.limit}`);
            console.log(`Method: ${info.method}`);
            console.log(`Route: ${info.route}`);
            console.log(`Global: ${info.global}`);
            console.log('===================\n');
        });

        // Enable debug mode to see rate limit details
        client.on('debug', (info) => {
            if (info.toLowerCase().includes('rate limit') || info.toLowerCase().includes('429')) {
                console.log(`[DEBUG] ${info}`);
            }
        });

        console.log('Listening for rate limit events... (Press Ctrl+C to exit)');
        console.log('\nTip: Make some API requests to see rate limit headers update.');
    });

    client.login(token);
};

checkRateLimit();

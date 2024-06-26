import 'dotenv/config'
import * as http from 'http'
import { GAME_ID, LANGUAGE, getLiveStreams } from './twitch.js'

const PORT = 3000;

const requestHandler = async (request, response) => {
    switch (request.url) {
        case '/metrics':
            response.writeHead(200, {
                'Content-Type': 'text/plain',
                'Cache-Control': 'no-cache'
            });

            response.write(await getMetrics());
            response.end();
            break;
        default:
            response.end('<a href="/metrics">Metrics</a>');
            break;
    }
};

const server = http.createServer(requestHandler);

server.listen(PORT, (err) => {
    if (err) {
        return console.log('Error starting webserver', err);
    }

    console.log(`Webserver is listening on http://localhost:${PORT}`);
});


async function getMetrics() {

    let liveStreams = await getLiveStreams(GAME_ID, LANGUAGE)
    let liveUsers = liveStreams
        .map((item) => {
            return {
                username: item.user_login,
                viewers: item.viewer_count,
                language: item.language
            }
        })

    // De-dedupe streams
    let uniqueLiveUsers = liveUsers.reduce((accumulator, current) => {
        if (!accumulator.find((item) => item.username === current.username)) {
            accumulator.push(current);
        }
        return accumulator;
    }, []);

    // Sort live users alphabetically
    uniqueLiveUsers = uniqueLiveUsers.sort((a, b) => {
        return a.username.localeCompare(b.username);
    })
    console.log(uniqueLiveUsers)
    console.log("Number of people live:", uniqueLiveUsers.length)

    let metricName = `twitch_livestream`
    let metric = `# TYPE ${metricName} gauge\n`;

    for (const user of uniqueLiveUsers) {
        metric += `twitch_livestream{user="${user.username}",language="${user.language}"} ${user.viewers}\n`;
    }

    return metric
}

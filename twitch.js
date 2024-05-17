let CLIENT_ID = process.env.CLIENT_ID
let CLIENT_SECRET = process.env.CLIENT_SECRET
export let GAME_ID = process.env.GAME_ID
export let LANGUAGE = process.env.LANGUAGE
let LAST_REQUEST = Date.now()
let TWITCH_TOKEN

async function getTwitchClientCredentialsToken(clientId, clientSecret) {
    return await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, {
        method: "POST"
    }).then((r) => { return r.json(); });
}

async function checkTwitchTokenValidity() {
    if ((Date.now() - LAST_REQUEST) / 1000 > TWITCH_TOKEN?.expires_in || !TWITCH_TOKEN) {
        console.log("Twitch token expired. Getting a new one.")
        TWITCH_TOKEN = await getTwitchClientCredentialsToken(CLIENT_ID, CLIENT_SECRET)
    }
}

export async function getLiveStreams(gameId, language) {

    let cursor = ""
    let streams = []

    console.log("Fetching livestreams")

    do {
        let queryParams = []
        let queryParamsString

        if (gameId) {
            queryParams.push(`game_id=${gameId}`)
        }
        if (language) {
            queryParams.push(`language=${language}`)
        }
        if (cursor) {
            queryParams.push(`after=${cursor}`)
        }
        if (queryParams.length > 0) {
            queryParamsString = `?${queryParams.join("&")}`
        }

        let apiEndpoint = `https://api.twitch.tv/helix/streams${queryParamsString}`

        await checkTwitchTokenValidity()

        let response = await fetch(apiEndpoint, {
            headers: {
                "Authorization": `Bearer ${TWITCH_TOKEN.access_token}`,
                "Client-Id": CLIENT_ID
            }
        })

        let json = await response.json()

        streams.push(...json.data)

        if (json.pagination.cursor) {
            console.log("Getting next page of streams.")
            cursor = json.pagination.cursor
        }
        else {
            console.log("Last page.")
            cursor = ""
        }

    } while (cursor)

    return streams;
}

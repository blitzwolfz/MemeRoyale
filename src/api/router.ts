import { getAllDuelProfiles, getAllMatches, getAllProfiles, getAllQuals, getDuelProfile, getMatch, getProfile, getQual } from "../db";
import { client } from "../listeners/index";
import type { APIMatch, APIProfile, APIQual } from "./apitypes";
import express from "express";

export const app = express();

// app.get('/', (request, response) => {
//     response.sendFile(__dirname + "/index.html");
//     response.sendStatus(200);
//     return response.send('Received a POST HTTP method');
// });

// app.post('/', (req, res) => {
//     return res.send('Received a POST HTTP method');
// });

// app.put('/', (req, res) => {
//     return res.send('Received a PUT HTTP method');
// });

// app.delete('/', (req, res) => {
//     return res.send('No deletetions are allowed');
// });
app.set('json spaces', 2);

app.get('/user/:id', async (req, res) => {
    // Reading isbn from the URL
    let id = req.params.id;

    let user = await getProfile(id);

    if (!user) {
        return res.status(404).send('User not found');
    }
    let data: APIProfile = user;
    data.profile = client.users.cache.get(id)!.displayAvatarURL();

    return res.json(data);

});

app.get('/users', async (req, res) => {
    // Reading isbn from the URL
    try {
        let user = await getAllProfiles();

        let data: APIProfile[] = user;

        data.forEach(async d => {
            d.profile = client.users.cache.get(d._id)!.displayAvatarURL();
        });
        return res.json(data);
    } catch (error) {
        return res.status(404).send(error);
    }
});

app.get('/duel/:id/:guild?', async (req, res) => {
    // Reading isbn from the URL
    console.log(req.params);
    let id = req.params.id;
    // @ts-ignore
    let guild = req.params.guild || "719406444109103117";

    let user = await getDuelProfile(id, guild);

    if (!user) {
        return res.status(404).send('User not found');
    }
    let data: APIProfile = user;
    data.profile = client.users.cache.get(id)!.displayAvatarURL();

    return res.json(data);

});

app.get('/duelists/:guild?', async (req, res) => {
    // Reading isbn from the URL
    try {
        // @ts-ignore
        let guild = req.params.guild || "719406444109103117";
        let user = await getAllDuelProfiles(guild);

        let data: APIProfile[] = user;

        data.forEach(async d => {
            d.profile = client.users.cache.get(d._id)!.displayAvatarURL();
        });
        return res.json(data);
    } catch (error) {
        return res.status(404).send(error);
    }
});

app.get('/duelists-servers', async (req, res) => {
    // Reading isbn from the URL
    try {


        let data: {
            _id: string, hasDuelists?: true | false
        }[] = [];

        let gg = [...await client.guilds.cache.keys()];

        for (let g of gg) {
            data.push({
                _id: g
            });
        }

        for (let d of data) {
            if ((await getAllDuelProfiles(d._id)).length === 0) {
                d.hasDuelists = false;
            }

            else {
                d.hasDuelists = true;
            }
        }

        console.log(data);

        return await res.json(data);
    } catch (error) {
        return res.status(404).send(error);
    }
});

app.get('/match/:id', async (req, res) => {
    // Reading isbn from the URL
    let id = req.params.id;

    let m = await getMatch(id);

    if (!m) {
        return res.status(404).send('Match not found');
    }
    let data: APIMatch = m;

    return res.json(data);

});

app.get('/matches', async (req, res) => {
    // Reading isbn from the URL
    try {
        let m = await getAllMatches();

        let data: APIMatch[] = m;

        return res.json(data);
    } catch (error) {
        return res.status(404).send(error);
    }
});

app.get('/qual/:id', async (req, res) => {
    // Reading isbn from the URL
    let id = req.params.id;

    let m = await getQual(id);

    if (!m) {
        return res.status(404).send('Match not found');
    }
    let data: APIQual = m;

    return res.json(data);

});

app.get('/quals', async (req, res) => {
    // Reading isbn from the URL
    try {
        let m = await getAllQuals();

        let data: APIQual[] = m;

        return res.json(data);
    } catch (error) {
        return res.status(404).send(error);
    }
});
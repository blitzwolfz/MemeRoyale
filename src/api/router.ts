import { app } from "../index";

app.get('/', (request, response) => {
    response.sendFile(__dirname + "/index.html");
    response.sendStatus(200);
    return response.send('Received a POST HTTP method');
});

app.post('/', (req, res) => {
    return res.send('Received a POST HTTP method');
});
   
app.put('/', (req, res) => {
    return res.send('Received a PUT HTTP method');
});

app.delete('/', (req, res) => {
    return res.send('No deletetions are allowed');
});
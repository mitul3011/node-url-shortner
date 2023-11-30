const express = require('express');
const aws = require('aws-sdk');
const config = require('./config.js');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT;

app.use(express.json());

aws.config.update(config.aws_remote_config);
let dynamoDB = new aws.DynamoDB();

let createShortURL = (id) => {
    return  Date.now() % 100 + crypto.randomUUID().substring(32, 36);
};

app.post('/createNewShortUrl', async (req, res) => {
    const fullUrl = req.body.fullUrl;
    const expiresAt = Date.now() + req.body.expires * 24 * 60 * 60 * 1000;

    const clicks = "0";

    // return id to the user
    const id = createShortURL();

    let params = {
        TableName: config.aws_table_name,
        Item: {
            id: {S: id},
            fullurl: {S: fullUrl},
            clicks: {N: clicks},
            expiresAt: {N: expiresAt.toString()}
        }
    };

    dynamoDB.putItem(params, (err, data) => {
        if(err)
            res.send({ err });
        else
            res.send({ id });
    });
});

app.get('/:shortUrl', (req, res) => {
    let params = {
        TableName: config.aws_table_name,
        Key: {
            'id': {S: req.params.shortUrl}
        }
    };

    dynamoDB.getItem(params, (err, data) => {
        if(err)
            res.send({ err });

        const increamentedClick = Number(data.Item.clicks.N) + 1;

        let params1 = {
            TableName: config.aws_table_name,
            Key: {
                'id': {S: req.params.shortUrl}
            },
            UpdateExpression: "set clicks = :clicks",
            ExpressionAttributeValues: {
                ':clicks': {N: increamentedClick.toString()}
            },
            ReturnValues:"UPDATED_NEW"
        };

        dynamoDB.updateItem(params1, (err, data) => {
            if(err)
                res.send({ err });
        });

        if(data.Item.expiresAt.N < Date.now())
            res.send({ err: 'Link Expired!' });

        res.send( data.Item );
    });
});

app.listen(port, () => {
    console.log('Server is up on port', port);
});

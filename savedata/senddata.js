const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const http = require('http');
const Request = require("request");
const cassandra = require('cassandra-driver');
const Uuid = require('cassandra-driver').types.Uuid;
const logger = require("../config/logger.js");

const client = new cassandra.Client({
    contactPoints: ["localhost"],
    keyspace: "practise_keyspace"
});

client.connect(function(error){
    console.info("Connecting");
});

var server= http.createServer(app);
server.listen(3000, function(){
console.info("Listenning");
});

app.use(bodyParser.json());

app.put('/senddata/:slot_id', function(request, response){
    const slot_id = request.params.slot_id;
    logger.info(`Starting Main microservice with { slot_id : ${slot_id} }`)
    requestBody = request.body;
    
    if(!request.body){
        logger.error("Empty body, response sent to client")
        response.send("Enter the body");
    }
    
    logger.info(`Calling CallReteriveMeth with { slot_id : ${slot_id} }`)
    CallReteriveMeth(slot_id, function(result){
        const body = JSON.parse(result.body);
        logger.info(`Received { ${result.body} } from CallReteriveMeth Function`)
        logger.info(`Calling the CallDeleteMeth with parameters { ${JSON.stringify(body)} , ${slot_id} }`)
        CallDeleteMeth(body, slot_id, function(result1){
            logger.info(`Received response from CallDeleteMeth function { ${result1.body} }`)
            logger.info(`Sending the response { ${result1.body} } to the client`)
            response.send(result1.body)
        })
    })
});

function CallReteriveMeth(slot_id, callback){
    logger.debug(`Posting data to CallReteriveMeth with { slot_id : ${slot_id} }`)
    Request.post({
        "headers": {
            "content-type": "application/json"
        },
        "url": "http://localhost:2983/"+slot_id,
        "body": JSON.stringify(requestBody)
    }, (error, res) => {
        if(error){
            logger.error(`Error received from CallReteriveMeth => ${JSON.stringify(error)}`);
        }
        else if(res){
            logger.info(`Received result from CallReteriveMeth => ${JSON.stringify(res)}`)
            logger.debug(`Sending callback with ${JSON.stringify(res)}`)    
            callback(res)
        }
    });
}

function CallDeleteMeth(body, slot_id, callback){
    logger.debug(`Posting to CallDeleteMeth with { ${JSON.stringify(body)} and ${slot_id} }`)
    Request.post({
        "headers": {
            "content-type": "application/json"
        },
        "url": "http://localhost:2984/"+slot_id,
        "body": JSON.stringify(body)
    }, (error, res) => {
        if(error){
            logger.error(`Received error from CallDeleteMeth => ${JSON.stringify(error)}`);
        }
        else if(res){
            logger.info(`Received result from CallDeleteMeth => ${JSON.stringify(res)}`)
            logger.debug(`Sending callback with ${JSON.stringify(res)}`)    
           callback(res)
        }
    });
}
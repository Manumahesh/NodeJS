const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const http = require('http');
const cassandra = require('cassandra-driver');
const Uuid = require('cassandra-driver').types.Uuid;
const logger = require("../config/logger.js");
var moment = require('moment');
const Request = require('request')

const client = new cassandra.Client({
    contactPoints: ["localhost"],
    keyspace: "practise_keyspace"
});

client.connect(function(err){
    console.log("Connected");
});

var server= http.createServer(app);
server.listen(3000, function(){
console.log("Listenning");
});

app.use(bodyParser.json());

app.post('/getdata', function(request, response){
    var status = "open";
    var cur = new Date();     //Current Date
    const cd = moment.utc(cur)

    if( request.body.start < cd.format() ){
        request.body.start = cd.format();
    }
    
    //Appending to object
    var reqObj = {}
    reqObj = request.body;

    //Checking for empty input
    if(!reqObj.start || !reqObj.end || !reqObj.store_id || !reqObj.truck_type)
    {
        console.log("Invaild JSON input");
        return response.status(400).send("Invaild JSON input");
    }

    CallQueryMeth(reqObj, function(result){
        logger.info(`Received result => ${result}`)
        logger.info(`Sending the response to client`)
        response.send(JSON.parse(result))
    })
});

function CallQueryMeth(reqObj, callback){
    logger.info(`Posting to CallQueryMeth with ${reqObj} and a callback`)
    Request.post({
        "headers": {
            "content-type": "application/json"
        },
        "url": "http://localhost:3001/"+"query",
        "body": JSON.stringify(reqObj)
    }, (error, res) => {
        if(error){
            logger.error(`Received error from CallQueryMeth => ${JSON.stringify(error)}`);
            console.log(JSON.parse(error))
        }
        else if(res){
            logger.info(`Sending the callback function with result ${JSON.stringify(res.body)}`)
            callback(res.body)
        }
    });
}
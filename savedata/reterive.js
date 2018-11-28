const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const http = require('http');
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
server.listen(2983, function(){
    console.info("Listenning");
});

app.use(bodyParser.json());

const jsonParser = bodyParser.json({
    type: 'application/*+json'
});

app.post('/:slot_id',jsonParser, function(request, response){
    const slot_id = request.params.slot_id
    logger.info(`Starting Reterive microservice with { ${slot_id} }`)

    const query = "SELECT * FROM reserved_data WHERE slot_id = ?"
    const param = [slot_id]
    client.execute(query, param, {prepare:true}, function(error, result){
    logger.debug(`Executted the query ${query} with parameters ${param}`)
        if(error){
            logger.error(`Error while executing the query ${query}`)
        }
        else{
            var req_idObj = {}
            req_idObj.req_id = (result.rows[0].request_id);
            console.log(req_idObj)
            const query = "SELECT * FROM reserved_data WHERE request_id = ?"
            const param = [result.rows[0].request_id]
            client.execute(query, param, {prepare:true}, function(error, result1){
            logger.debug(`Executed the "query" ${query} with "parameters" ${param}`)
                if(error){
                    logger.error(`Error in executing the "query" ${query} with "parameters" ${param}`)
                }
                else{
                    logger.info(`Successfully executed the "query" ${query} with "parameters" ${param}`)
                    const status = "confirmed"
                    const query1 = "INSERT INTO reserved_data(status, slot_id, request_id) VALUES (?,?,?)"
                    const param1 = [status,result.rows[0].slot_id,result.rows[0].request_id];
                    client.execute(query1, param1, {prepare:true}, function(err, res){
                    logger.debug(`Executed the "query" ${query} with "parameters" ${param}`)
                    
                        if(err){
                            logger.error(`Error in executing the "query" ${query} with "parameters" ${param}`)
                        }
                        else{
                            logger.info(`Successfully executed the "query" ${query} with "parameters" ${param}`)
                            return response.send(req_idObj)
                        }
                    });
                }
            });
        }
    });
});
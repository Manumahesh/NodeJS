const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const http = require('http');
const cassandra = require('cassandra-driver');
const Uuid = require('cassandra-driver').types.Uuid;

const client = new cassandra.Client({
    contactPoints: ["localhost"],
    keyspace: "practise_keyspace"
});

client.connect(function(error){
    console.log("Connecting");
});

var server= http.createServer(app);
server.listen(2984, function(){
console.log("Listenning");
});

app.use(bodyParser.json());

const jsonParser = bodyParser.json({
    type: 'application/*+json'
});

app.post('/:slot_id', jsonParser, function(request, response){
    const req_id = request.body.req_id
    
    const query = "SELECT * FROM reserved_data WHERE request_id = ?"
    const param = [req_id]
    client.execute(query, param, {prepare:true}, function(error, result){
        if(error){
            console.log(error)
        }
        else{
            for(let i=0; i<result.rowLength; i++){
                if(result.rows[i].slot_id != request.params.slot_id && result.rows[i].status === "open"){
                 const query = "DELETE FROM reserved_data WHERE slot_id=? AND request_id=?"
                 const param = [result.rows[i].slot_id, result.rows[i].request_id]
                 client.execute(query, param, {prepare:true})
                }
            }
            response.sendStatus(200)
        }
    });
});
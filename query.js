const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const http = require('http');
const cassandra = require('cassandra-driver');
const Uuid = require('cassandra-driver').types.Uuid;
var moment = require('moment');
const logger = require("../config/logger.js");

const client = new cassandra.Client({
    contactPoints: ["localhost"],
    keyspace: "practise_keyspace"
});

client.connect(function(err){
    console.log("Connected");
});

var server= http.createServer(app);
server.listen(3001, function(){
console.log("Listenning");
});

app.use(bodyParser.json());
const slotDetailArray = [];

const jsonParser = bodyParser.json({
    type: 'application/*+json'
});

var status = "open";
var cur = new Date();     //Current Date
const cd = moment.utc(cur)

app.post('/query', jsonParser, function(request, response){

    const query = "SELECT * FROM store_data WHERE store_id = ? AND truck_type = ?";
    const params = [request.body.store_id, request.body.truck_type];
    client.execute(query, params, {prepare: true}, function(err, result){
    
        if(err){
            console.log("error");
        }
        else{
            const request_id = Uuid.random();

            //Setting the timestamp
            const currDateTimeUTC = moment.utc();
            const startMoment = moment(request.body.start);
            const endMoment = moment(request.body.end);
            

            if( request.body.end < cd.format() || request.body.end < request.body.start){
                return response.status(500).send("Invalid date input");
            }

            for (let i=0; i<result.rowLength; i++){

                //Checking for availability_mins
                if(result.rows[i].availability_mins<320){
                    console.log("availability_mins not valid");
                    // response.status(400).send("availability_mins not valid");
                    continue;
                }        
                
                const availability_date = moment(result.rows[i].availability_date);

                //Checking for availability_date
                if((availability_date.format() > request.body.end) || (availability_date.format() < request.body.start)){
                    console.log("cant deliver");
                    continue;
                }
                
                const ava_date=moment.utc(result.rows[i].availability_date);
                const slot_id = Uuid.random();

                const resObj = {};                
                resObj.request_id = JSON.stringify(request_id),
                resObj.slot_id = JSON.stringify(slot_id),
                resObj.start = ava_date.startOf('day').format(),
                resObj.end = ava_date.endOf('day').format(),
                resObj.available_date = result.rows[i].availability_date,
                // resObj.availability_mins= result.rows[i].availability_mins,
                resObj.status = status;
                console.log(resObj);

                //Inserting data into the reserved table
                const query1 = "INSERT INTO practise_keyspace.reserved_data(request_id, slot_id , slot_start , slot_end, status) values (?,?,?,?,?)";
                const params1 = [request_id, slot_id, ava_date.startOf('day').format(), ava_date.endOf('day').format(), status];
                client.execute(query1, params1, {prepare:true}, function(err,result){
                    if(err){
                        console.log("error in updating to DB")
                        console.log(err);
                    }
                    else{
                        console.log("data updated")
                    }
                });
                
                slotDetailArray.push(resObj);       //Inserting the slot into the set
            }
        }
        // var responseObj = {}
    // responseObj = slotDetailArray
    // console.log(slotDetailArray)
    response.send(slotDetailArray)
    });
});
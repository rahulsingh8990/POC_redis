'use strict';

var redis = require('redis');
var bluebird = require('bluebird');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const GLOBAL_KEY = 'lambda-test';
const redisOptions = {
    host: "redis-test.zlrjvw.ng.0001.use1.cache.amazonaws.com",
    port: 6379
}

redis.debug_mode = true;

exports.handler = (event, context, callback) => {
    console.info('Start to connect to Redis Server')
    var client = redis.createClient(redisOptions);
    console.info('Connected to Redis Server')

    console.info('event.pathParameters: ', event.pathParameters);
    console.info('event.httpMethod: ', event.httpMethod);
    let id = (event.pathParameters || {}).product || false;
    let data = event.data;

    switch (event.httpMethod) {

        case "GET":
            if (id) {
                console.info('get by id')
                client.hgetAsync(GLOBAL_KEY, id).then(res => {
                    console.info('Redis responses for get single: ', res);
                    callback(null, {body:  "This is a READ operation on product ID " + id, ret: res});
                    // callback(null, {body: "This is a READ operation on product ID " + id});
                }).catch(err => {
                    console.error("Failed to get single: ", err)
                    callback(null, {statusCode: 500, message: "Failed to get data"});
                }).finally(() => {
                    console.info('Disconnect to Redis');
                    client.quit();
                });

                return;
            } else {
                console.info('get all')
                client.hgetallAsync(GLOBAL_KEY).then(res => {
                    console.info('Redis responses for get all: ', res)
                    callback(null, {body: "This is a LIST operation, return all products", ret: res});
                    // callback(null, {body: "This is a LIST operation, return all products"});
                }).catch(err => {
                    console.error("Failed to post data: ", err)
                    callback(null, {statusCode: 500, message: "Failed to get data"});
                }).finally(() => {
                    console.info('Disconnect to Redis');
                    client.quit();
                });
            }
            break;

        case "POST":
            if (data) {
                console.info('Posting data for [', id, '] with value: ', data);
                client.hmsetAsync(GLOBAL_KEY, id, data).then(res => {
                    console.info('Redis responses for post: ', res)
                    callback(null, {body: "This is a CREATE operation and it's successful", ret: res});
                    // callback(null, {body: "This is a CREATE operation"});
                }).catch(err => {
                    console.error("Failed to post data: ", err)
                    callback(null, {statusCode: 500, message: "Failed to post data"});
                }).finally(() => {
                    console.info('Disconnect to Redis');
                    client.quit();
                });
            }
            else {
                callback(null, {statusCode: 500, message: 'no data is posted'})
            }
            break;

        case "PUT":
            callback(null, {body: "This is an UPDATE operation on product ID " + id});
            break;

        case "DELETE":
            console.info('delete a prod');
            client.delAsync(GLOBAL_KEY).then(res => {
                console.info('Redis responses for get single: ', res);
                callback(null, {body:  "This is a DELETE operation on product ID " + id, ret: res});
                // callback(null, {body: "This is a DELETE operation on product ID " + id});
            }).catch(err => {
                console.error("Failed to delete single: ", err);
                callback(null, {statusCode: 500, message: "Failed to delete data"});
            }).finally(() => {
                console.info('Disconnect to Redis');
                client.quit();
            });

            break;

        default:
            // Send HTTP 501: Not Implemented
            console.log("Error: unsupported HTTP method (" + event.httpMethod + ")");
            callback(null, {statusCode: 501})
    }

}
var AWS = require('aws-sdk'),
	dynamodbClient = new AWS.DynamoDB.DocumentClient();

exports.handler = function(event, context, callback) {
    var session = event['queryStringParameters']['session'];
    //var session = event.session;

    var params = {
        ExpressionAttributeValues: {
            ":s1": session
        }, 
        KeyConditionExpression: "sessions = :s1",
        TableName: "sessions"
    };
    
    dynamodbClient.query(params, function(err, data) {
        console.log(data);
        if (err || data.Count == 0) {
            callback("Unauthorized");
        }
        else {
            // update session TTL in 15 mins
            var paramsUpdate = {
                TableName: "sessions",
                Key:{
                    "sessions": session
                },
                ExpressionAttributeNames: { 
                    "#fieldttl" : "ttl" 
                },
                UpdateExpression: "set #fieldttl = :t1",
                ExpressionAttributeValues:{
                    ':t1' : Number(data.Items[0].ttl) + Number(process.env.TTL_INCREASE_SECS)
                },
                ReturnValues:"UPDATED_NEW"
            };
            
            dynamodbClient.update(paramsUpdate, function(err, data) {
               if (err) {
                   callback(err);
               }
               else {
                   callback(null, generateAllow('me', '*'));
               }
            });
        }
    });
};

// Help function to generate an IAM policy
var generatePolicy = function(principalId, effect, resource) {
    // Required output:
    var authResponse = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        var policyDocument = {};
        policyDocument.Version = '2012-10-17'; // default version
        policyDocument.Statement = [];
        var statementOne = {};
        statementOne.Action = 'execute-api:Invoke'; // default action
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    return authResponse;
};
     
var generateAllow = function(principalId, resource) {
    return generatePolicy(principalId, 'Allow', resource);
};
     
var generateDeny = function(principalId, resource) {
    return generatePolicy(principalId, 'Deny', resource);
};


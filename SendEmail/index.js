var aws = require('aws-sdk');
var ses = new aws.SES({
   region: 'eu-west-1'
});

exports.handler = function(event, context, callback) {
    let objData = JSON.parse(event.body)
    
    var eParams = {
        Destination: {
            ToAddresses: ["nuevaluz@nuevaluz.org"]
        },
        Message: {
            Body: {
                Text: {
                    Data: objData.body
                }
            },
            Subject: {
                Data: objData.subject
            }
        },
        Source: "nueva.luz.desarrollo@gmail.com"
    };

    var email = ses.sendEmail(eParams, function(err, data){
        if(err) console.log(err);
        else {
            var response = {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin" : "*"
                }
            };
            callback(null, response);
        }
    });

};
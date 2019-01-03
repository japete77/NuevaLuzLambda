exports.handler = function(event, context, callback) {
    const AWS = require('aws-sdk')

    const s3 = new AWS.S3()
    AWS.config.update({ accessKeyId: process.env.accessKey, secretAccessKey: process.env.secretKey })
    
    // Tried with and without this. Since s3 is not region-specific, I don't
    // think it should be necessary.
    // AWS.config.update({region: 'us-west-2'})
    
    var str = "" + event.id
    var pad = "0000"
    const myKey = pad.substring(0, pad.length - str.length) + str
    const myBucket = process.env.bucket
    const signedUrlExpireSeconds = Number(process.env.expireSecs)
    
    const url = s3.getSignedUrl('getObject', {
        Bucket: myBucket,
        Key: myKey + '.zip',
        Expires: signedUrlExpireSeconds
    })
    
    var dynamodbClient = new AWS.DynamoDB.DocumentClient();
    
    var params = {
        ExpressionAttributeValues: {
            ":s1": event.session
        }, 
        KeyConditionExpression: "sessions = :s1",
        TableName: "sessions"
    };
    
    dynamodbClient.query(params, (err, data) => {

        var currentUser = data.Items[0].user;
        
        var sql = require("mssql");
    
        // config for your database
        const config = {
            user: process.env.user,
            password: process.env.password,
            server: process.env.server, 
            database: process.env.database,
            port: process.env.port
        };
    
        // connect to your database
        sql.connect(config, (err) => {
            
            if (err) {
                sql.close();
                callback(err);
            }
        
            var requestInsert = new sql.Request();

            var registerDownload = `INSERT INTO LH_historico (id_usuario, id_audioteca, id_formato, id_estado,
            f_mibiblioteca, f_pendiente, f_envio, f_devolucion, regalo, gestor_mibiblioteca, gestor_pendiente, gestor_envio,
            gestor_devolucion, web) VALUES (${currentUser}, ${myKey}, 4, 5, GETDATE(), GETDATE(), GETDATE(), GETDATE(), 'True', 'MOVIL', 'MOVIL', 'MOVIL', 'MOVIL', 'True')`

            requestInsert.query(registerDownload, (err) => {
                sql.close();
                callback(null, { AudioBookLink: url });
            });
        });
    });
};
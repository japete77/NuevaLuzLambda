
exports.handler = function(event, context, callback) {

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
    sql.connect(config, function (err) {

        if (err) callback(err)
        
        var request = new sql.Request();
        
        var query =   `SELECT LHA.numero 'id', LHA.titulo, LHA.comentario, LHA.id_autor, LHA.horas, LHA.minutos,
                       SIA.nombre 'autor', SIE.nombre 'editorial'
                       FROM LH_audioteca LHA
                       INNER JOIN SI_autores SIA ON SIA.id = LHA.id_autor
                       INNER JOIN SI_editoriales SIE ON SIE.id = LHA.id_editorial
                       WHERE LHA.activo=1 AND LHA.numero=${event.id}`
        
        // query to the database and get the records
        request.query(query, function (err, recordset) {

            sql.close();

            if (err) callback(err);
            console.log(recordset.recordset[0]);
            var result = {
                Id: recordset.recordset[0].id, 
                Title: recordset.recordset[0].titulo.trim(),
                Author: { Id: recordset.recordset[0].id_autor, Name: recordset.recordset[0].autor.trim() },
                Editorial: recordset.recordset[0].editorial.trim(),
                Comments: recordset.recordset[0].comentario.trim(),
                LengthHours: recordset.recordset[0].horas.trim(),
                LengthMins: recordset.recordset[0].minutos.trim()
            };
                        
            // send records as a response
            callback(null, result);
        });
    });
}
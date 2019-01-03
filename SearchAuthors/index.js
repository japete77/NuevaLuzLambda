
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
        
        var requestCount = new sql.Request();
        
        var queryCount =   `SELECT count(*) total
                            FROM SI_autores SIA
                            WHERE SIA.nombre LIKE '%${decodeURI(event.text)}%' AND SIA.id IN (
                                SELECT DISTINCT(LHA.id_autor) id
                                FROM LH_audioteca LHA
                                INNER JOIN SI_autores SIA ON SIA.id = LHA.id_autor
                                INNER JOIN LH_formatosdisponibles LHF on LHF.id_audioteca = LHA.id
                                WHERE LHF.id_formato=4 AND LHF.activo='True' AND LHA.activo='True'
                            )`

        // query to the database and get titles count
        requestCount.query(queryCount, function (err, recordsetCount) {

            if (err) {
                sql.close();
                callback(err);
            }
            
            var request = new sql.Request();
        
            var query =    `SELECT * FROM (SELECT ROW_NUMBER() OVER(ORDER BY nombre) AS idx, SIA.id, SIA.nombre
                            FROM SI_autores SIA
                            WHERE SIA.nombre LIKE '%${decodeURI(event.text)}%' AND SIA.id IN (
                                SELECT DISTINCT(LHA.id_autor) id
                                FROM LH_audioteca LHA
                                INNER JOIN SI_autores SIA ON SIA.id = LHA.id_autor
                                INNER JOIN LH_formatosdisponibles LHF on LHF.id_audioteca = LHA.id
                                WHERE LHF.id_formato=4 AND LHF.activo='True' AND LHA.activo='True')) as tbl
                            WHERE idx BETWEEN ${event.index} AND ${event.index + event.count - 1}`

            var count = recordsetCount.recordset[0].total;

            // query to the database and get the records
            request.query(query, function (err, recordset) {
    
                sql.close();
    
                if (err) callback(err);
                
                var result = {
                    Total: count,
                    Authors: []
                };
                
                recordset.recordsets[0].forEach(element => {
                    result.Authors.push({ Id: element.id, Name: element.nombre.trim() });
                });
                
                // send records as a response
                callback(null, result);
            });
        });
    });
}
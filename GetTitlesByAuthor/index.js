
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
        
        var queryCount =   `SELECT count(*) total FROM LH_audioteca, LH_formatosdisponibles
                            WHERE LH_audioteca.id = LH_formatosdisponibles.id_audioteca AND 
                            LH_formatosdisponibles.id_formato = 4 AND 
                            LH_formatosdisponibles.activo = 'True' AND 
                            LH_audioteca.activo = 'True' AND id_autor=${event.id}`
        
        // query to the database and get titles count
        requestCount.query(queryCount, function (err, recordsetCount) {

            if (err) {
                sql.close();
                callback(err);
            }
            
            var request = new sql.Request();
        
            var query =    `SELECT * FROM (SELECT ROW_NUMBER() OVER(ORDER BY titulo) AS idx, LHA.numero 'id', LHA.titulo
                            FROM LH_audioteca LHA
                            INNER JOIN LH_formatosdisponibles LHF on LHF.id_audioteca = LHA.id
                            WHERE LHF.id_formato=4 AND LHF.activo='True' AND LHA.activo='True' AND LHA.id_autor=${event.id}) AS tbl
                            WHERE idx BETWEEN ${event.index} AND ${event.index + event.count - 1}`
                        
            var count = recordsetCount.recordset[0].total;

            // query to the database and get the records
            request.query(query, function (err, recordset) {
    
                sql.close();
    
                if (err) callback(err);
                
                var result = {
                    Total: count,
                    Titles: []
                };
                
                recordset.recordsets[0].forEach(element => {
                    result.Titles.push({ Id: element.id, Title: element.titulo.trim() });
                });
                
                // send records as a response
                callback(null, result);
            });
        });
    });
}
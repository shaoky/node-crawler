import mysql from 'mysql'
const option = {
    host     : 'localhost',       
    user     : 'root',              
    password : 'root',       
    port: '3306',                   
    database: 'test' 
}
const pool = mysql.createPool(option)

const query = (sql, callback) => {
    pool.getConnection((err, conn) => {
        if (err) {
           console.log('CONNECT ERROR:', err.message)
           callback(err, null, null)
        } else {
            conn.query(sql, (err, result) => {
                conn.release()
                callback(err, result)
            })
        }
    })
}

const insert = (sql, params, callback) => {
    pool.getConnection((err, conn) => {
        if (err) {
            console.log('CONNECT ERROR:', err.message)
            callback(err, null, null)
        } else {
            conn.query(sql, params, (err, result) => {
                conn.release()
                callback(err, result)
            })
        }
    })
}

export default {
    query: query,
    insert: insert
}
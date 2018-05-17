var connection = require("../mySQLConnection");


function getProjectMetaData(groupID){
    return new Promise((fulfill, reject) => {
        connection.query("SELECT * FROM `Projects` WHERE id=" + connection.escape(groupID), (err, data) => {
            if(err){
                return reject({
                    error: true,
                    type: "mySQL fetch error",
                    status: 404
                });
            }
            if(data.length != 1){
                return reject({
                    error: true,
                    type: "mySQL count error",
                    status: 409
                });
            }else{
                return fulfill(data[0]);
            }
        })
    })
}

module.exports = {
    getProjectMetaData: getProjectMetaData
}
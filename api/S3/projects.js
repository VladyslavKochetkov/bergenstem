var AWS = require("aws-sdk");
var S3 = new AWS.S3({
    accessKeyId: "AKIAJXWBS5OIT3AWI75Q",
    secretAccessKey: "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",
});

function getProjectBlogMeta(projectID){
    return new Promise((fulfill, reject) => {
        S3.getObject({
            Bucket: "bccstemlogs.us",
            Key: projectID + "/project.json"
        }, (err, data) => {
            if(err){
                if(err.code == "NoSuchKey"){
                    return reject({
                        error: true,
                        type: "S3 Error/Not Found",
                        status: 404,
                        err: handleS3GetError(err),
                        __dangerousShowError: err
                    });
                }
                return reject({
                    error: true,
                    type: "Unknown Error",
                    status: 409,
                    err: handleS3GetError(err),
                    __dangerousShowError: err
                });
            }
            return fulfill({
                status: 200,
                body: JSON.parse(data.Body.toString()),
                ETag: data.ETag.substr(1, data.ETag.length - 2)
            })
        })
    })
}

function initializeNewProjectFolder(projectData){
    return new Promise((fulfill, reject) => {
        if(projectData.projectID == undefined){
            return reject("Project Data must contain a projectID");
        }
        if(projectData.name == undefined){
            return reject("Project Data must contain a name");
        }
        if(projectData.desc == undefined){
            return reject("Project Data must contain a desc")
        }

        S3.listObjects()
    })
}

function handleS3GetError(err){
    return {
        message: err.message,
        code: err.code,
        region: err.region,
        time: err.time,
        statusCode: statusCode
    }
}

// getProjectBlogMeta(140).then((x) => {
//     console.log(x);
// }).catch((e) => {
//     console.log(e);
// })

var projectDataTest = {
    projectID: 0,
    name: "TEST NAME",
    desc: "TEST DESC"
}

initializeNewProjectFolder(projectDataTest)
    .then((x) => {
        console.log(x);
    }).catch((e) => {
        console.log(e);
    })

function getProjectBlogPost(groupID, file){

}

function getparams(groupID, file){
    return {
        Bucket: "bccstemlogs.us",
        Key: groupID + "/" + file
    }
}
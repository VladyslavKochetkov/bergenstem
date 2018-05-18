var AWS = require("aws-sdk");
var S3 = new AWS.S3({
    accessKeyId: "AKIAJXWBS5OIT3AWI75Q",
    secretAccessKey: "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",
});

// Expects an ID such as 0 - 0 is reserved for testing.
async function getProjectBlogMeta(projectID){
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

/*
Expects a very specific object.
{
  projectID: Number, - 0 Is used for testing
  name: String,
  desc: String
}
*/
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

      S3FolderExists(projectData.projectID).then((x) => {
        if(x == true){
          return reject("A project already exists with that projectID on S3");
        }else{
          var params = getparams(projectData.projectID, "project.json");
          projectData.lastModified = new Date();
          projectData.modifiedHistory = [
            new Date()
          ];
          projectData.lastModifier = "DEVELOPER",
          projectData.modifierHistory = [
            "DEVELOPER"
          ];
          projectData.lastFile = "0";
          var params = getparams(projectData.projectID, "project.json");
          params.Body = new Buffer(JSON.stringify(projectData), "binary");
          params.ServerSideEncryption = "AES256";
          S3.putObject(params, (err, data) => {
            if(err){
              return reject({ error: "Unknown server error", status: 409, __dangerousShowError: err});
            }
            return fulfill({status: 200, ETag: data.ETag});
          })
        }
      })
    })
}

// TODO: CHANGE PREFIX TO PATH
function S3FolderExists(path){
  return new Promise((fulfill, reject) => {
    S3.listObjectsV2({Bucket: "bccstemlogs.us", Prefix: path + "/", MaxKeys: 1}, (err, data) => {
      if(data){
        // Technically should only ever be 1 because we limit it to 1.
        if(data.Contents.length >= 1){
            return fulfill(true);
        }else{
          return fulfill(false);
        }
      }
      if(err){
        return reject({ error: "Unknown server error", __dangerousShowError: err});
      }
    })
  })
}

async function S3FileExists(porjectID, file){
  return new Promise((fulfill, reject) => {
    var params = {
      Bucket: "bccstemlogs.us",
      Prefix: porjectID + "/" + file,
      MaxKeys: 1
    }
    S3.listObjectsV2(params, (err, data) => {
      if(err){
        return reject({
          error: "Unknown server error",
          status: 409,
          __dangerousShowError: err
        })
      }
      if(data.Contents.length >= 1){
        fulfill(true);
      }else{
        fulfill(false);
      }
    })
  })
}

function writeS3File(projectID, file, data){
  return new Promise(async (fulfill, reject) => {
    var exists = await S3FileExists(projectID, file);
    if(exists){
      return reject("File already exists in S3 and duplicates are not allowed.");
    }
    var params = getparams(projectID, file);
    if(isObject(data)){
      params.Body = new Buffer(JSON.stringify(data), "binary");
    }else{
      params.Body = new Buffer(data, "binary");
    }
    
    S3.putObject(params, (err, data) => {
      if(err){
        return reject({
          error: "Unknown server error",
          status: 409,
          __dangerousShowError: err
        });
      }

      return fulfill({
        status: 200,
        ETag: data.ETag
      });
    })
  })
}

function handleS3GetError(err){
    return {
        message: err.message,
        code: err.code,
        region: err.region,
        time: err.time,
        statusCode: err.statusCode
    }
}

function getparams(porjectID, file) {
  return {
    Bucket: "bccstemlogs.us",
    Key: porjectID + "/" + file
  }
}

function isObject(obj){
  return (!!obj) && (obj.constructor === Object);
}

function updateProjectBlogMeta(projectData){
    return new Promise(async (fulfill, reject) => {
        if (projectData.projectID == undefined) {
            return reject("Project Data must contain a projectID");
        }
        if (projectData.name == undefined) {
            return reject("Project Data must contain a name");
        }
        if (projectData.desc == undefined) {
            return reject("Project Data must contain a desc")
        }
        if(await S3FolderExists(projectData.projectID)){
            var params = getparams(projectData.projectID, "project.json");
            params.Body = new Buffer(JSON.stringify(projectData), "binary");
            S3.putObject(params, (err, data) => {
                console.log(err);
                console.log(data);
            })

        }else{
            return reject("Cannot update projectMeta of unexistant project.");
        }
    })
}

async function addBlogPost(projectData){
    try{
        console.log(projectData.projectID);
        var metadata = await getProjectBlogMeta(projectData.projectID);
        var put = await writeS3File(projectData.projectID, metadata.body.lastFile, projectData.data);
        var bodyMeta = metadata.body;
        bodyMeta.lastFile++;
        bodyMeta.lastModified = new Date();
        bodyMeta.modifiedHistory.push(bodyMeta.lastModified);
        bodyMeta.lastModifier = "DEVELOPER",
        bodyMeta.modifierHistory.push(bodyMeta.lastModifier);
        updateProjectBlogMeta(bodyMeta);
        return {
            status: 200,
            message: "success"
        }
    }catch(e){
        console.log(e);
        return {
            status: 409,
            message: e.message,
            __dangerousShowError: e
        }
    }
}

function removeFolder(path){
    return new Promise(async (fulfill, reject) => {
        try{
            var params = getparams(path, "");
            params.Prefix = params.Key;
            delete params.Key;
            var data = await listObjects(path);
            var deleteParams = {
                Bucket: params.Bucket,
                Delete: {
                    Objects: []
                }
            };
            deleteParams.Delete.Objects = [...data.Contents.map((x) => {
                return {
                    Key: x.Key
                }
            })];
            var x = await S3.deleteObjects(deleteParams).promise();
            if(x.Errors.length != 0){
                return reject({
                    error: "Unknown server error",
                    status: 409,
                    __dangerousShowError: x.Errors
                });
            }
            
            if(data.isTruncated == true){
                await removeFolder(path);
            }

            params = getparams(path, "");
            S3.deleteObject(params, (err, data) => {
                if(err){
                    return reject({
                        error: "Unknown server error",
                        status: 409,
                        __dangerousShowError: err
                    });
                }
                return fulfill({
                    status: 200,
                    message: "Success"
                })
            })
        }catch(e){
            return reject({
                error: "Unknown server error",
                status: 409,
                __dangerousShowError: e
            })
        }
    })
}

function listObjects(path){
    return new Promise(async (fulfill, reject) => {
        try{
            var params = getparams(path, "");
            params.Prefix = params.Key;
            delete params.Key;
            var data = await S3.listObjectsV2(params).promise();
            return fulfill(data);
        }catch(e){
            return reject(e);
        }
    })
}

async function getFile(files){
    return new Promise(async (fulfill, reject) => {
        var x = files.map(async (x) => {
            console.log(x);
        })
        var req = await S3.getObjects({
            Bucket: "bccstemlogs.us",
            Key: url
        }).promise();

        req = {
            lastModified: req.LastModified,
            ETag: req.ETag,
            Body: req.Body.toString()
        }

        console.log(req);
    })
}

function getProjectFiles(projectID, files){
    return new Promise(async (fulfill, reject) => {
        var data = await files.map(async (x) => {
            var url = (projectID + "/" + x);
            var req = await getFile(url);
            console.log(req);
        });

        console.log(data);
    })
}

getProjectFiles(140, [0,1,2]);

// listObjects(0);

var addBlogPostJSON = {
    projectID: 0,
    type: "BLOGPOST",
    postedBy: "DEVELOPER",
    time: new Date(),
    data: "<div style='color: red'>TEST 2</div>"
}

// removeFolder("0").then((x) => {
//     console.log(x);
// }).catch((e) => {
//     console.log(e);
// })

// addBlogPost(addBlogPostJSON).then((x) => {
//     console.log(x);
// }).catch((x) => {
//     console.log(x);
// })

// initializeNewProjectFolder({
//     name: "Test Name",
//     projectID: 0,
//     desc: "Test Desc"
// }).then((x) => {
//     getProjectBlogMeta(0)}
// ).then((x) => {
//     return addBlogPost(addBlogPostJSON)
// }).then((x) => {
//     console.log(x);
// }).catch((x) => {
//     console.log(x);
// })
// ============== FOR TESTING ==============
// initializeNewProjectFolder({
    // name: "Test Name",
    // projectID: 0,
    // desc: "Test Desc"
// }).then((x) => {
//     console.log(x);
// }).catch((e) => {
//     console.log(e);
// });
//
// =========================================
//
// getProjectBlogMeta(0).then((x) => {
//   console.log(x);
// }).catch((e) => {
//   console.log(e);
// })
// 
// S3FileExists(0, 0).then((x) => {
//   console.log(x);
// }).catch((e) => {
//   console.log(e);
// })
    

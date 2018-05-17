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
    S3.listObjectsV2({Bucket: "bccstemlogs.us", Prefix: "0/", MaxKeys: 1}, (err, data) => {
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

async function S3FileExists(groupID, file){
  return new Promise((fulfill, reject) => {
    var params = {
      Bucket: "bccstemlogs.us",
      Prefix: groupID + "/" + file,
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

function writeS3File(groupID, file, data){
  return new Promise(async (fulfill, reject) => {
    var exists = await S3FileExists(groupID, file);
    if(exists){
      return reject("File already exists in S3 and duplicates are not allowed.");
    }
    var params = getparams(groupID, file);
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

function getparams(groupID, file) {
  return {
    Bucket: "bccstemlogs.us",
    Key: groupID + "/" + file
  }
}

function isObject(obj){
  return (!!obj) && (obj.constructor === Object);
}

async function addBlogPost(projectData){
  var metadata = await getProjectBlogMeta(0);
  writeS3File(0, metadata.body.lastFile, {test: "test"})
}

addBlogPost();
// ============== FOR TESTING ==============
// initializeNewProjectFolder(projectDataTest)
//     .then((x) => {
//         console.log(x);
//     }).catch((e) => {
//         console.log(e);
//     });
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
    

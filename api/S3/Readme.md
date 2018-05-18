# API > S3 > Projects.js - (5/17/2018)
## Documentation and expected behavior

This file contains the following, and are exported accordingly. These are all promise driven functions.

# Exported
> General Project
> - initializeNewProjectFolder
> - getProjectBlogMeta
> - updateProjectBlogMeta
> - removeProject

> Blog Post Specific
> - addBlogPost
> - getProjectFiles

# Internal
> S3 Reliant
> - S3FolderExists
> - S3FileExists
> - writeS3File
> - removeFolder
> - listObjects
> - getFile

> S3 Helpers
> - handleS3GetError
> - getparams
> - isObject

# Specifications
### This section will contain detailed inputs on how the functions work as well as their quirks if any apply.
### **Note on __dangerousShowError in rejects**
### This doesn't produce a danger for the runtime but it should not be displayed as an error on the webpage. The error can, and probably will, show the inner stackflow of the server, which should not be exposed to the user.

# Exported
# General Project
> ## *f* - initializeNewProjectFolder(*projectData*)
### projectData must be formatted in a specific format in order to be accepted.
###  ***projectData*** *{*
###     &nbsp;&nbsp;&nbsp; projectID: *Number/String* - This is the index of the folder name that will be created. If projectID "0" is passed S3 will create a index of "./0/"
###     &nbsp;&nbsp;&nbsp; name: *String* - The name of the project being created. This will be used to populate the mandatory project.json inside the S3 folder.
###     &nbsp;&nbsp;&nbsp; desc: *String* - The description of the project being created. This will be used to populate the madatory project.json inside the S3 folder. This currently does not have a mandatory length, but that might be introduced later.
###  *}*
### *This is still in development but is usable*. The future changes will include projectData *or* possible another argument containg the creators username because it is set up to store to lastModifiers username and a history of previous modifiers. Instead of storing username it currently stores "DEVELOPER".
### This function returns a promise that will be fulfilled with a status code and a ETag of the created file. If there is an error it will return an error name, status, and a __dangerousShowError.

> ## *f* - getProjectBlogMeta(*projectID*)
###  ***projectID*** *: Number/String* - This is the projectID that was assigned. If "0" is passed it will search S3 for a group with a folder of "./0/" and will search for a project.json created by *initializeNewProjectFolder*
### This function returns a promise. If the promise is fulfilled it returns the status code, a body (which is formated as a parsed JS Object) and a ETag of the file. If a reject occurs it returns an object. *This reject is handled uniquely because of how specific diagonosis in future it may require.* It returns an error (*Boolean*), type (*String - May be specific*), status, err (*Safe to display*), and __dangerousShowError.

> ## *f* - updateProjectBlogMeta(*projectData*)
###  ***projectData*** *{*
###     &nbsp;&nbsp;&nbsp; projectID: *Number/String* - This is the index of the folder name that will be created. If projectID "0" is passed S3 will create a index of "./0/"
###     &nbsp;&nbsp;&nbsp; name: *String* - The name of the project being created. This will be used to populate the mandatory project.json inside the S3 folder.
###     &nbsp;&nbsp;&nbsp; desc: *String* - The description of the project being created. This will be used to populate the madatory project.json inside the S3 folder. This currently does not have a mandatory length, but that might be introduced later.
###  *}*
### This function generally follows the same rules and requirements as initializeNewProjectFolder. The main difference is that is checks if a project exists before trying to insert the blog metadata. **This should not be used to create a group.** Returns an promise similar to initializeNewProjectFolder.

# Blog Post Specific
> ## *f* - addBlogPost(*blogPostData*)
###  ***blogPostData*** *{*
###     &nbsp;&nbsp;&nbsp; projectID: *Number/String* - This is the index of the project that will be recieving this blogpost.
###     &nbsp;&nbsp;&nbsp; type: *String* - This will be stored in the database and might in the future be used to sort for different type of files. While it highly suggested to include it as **"BLOGPOST"** it is not required.
###     &nbsp;&nbsp;&nbsp; postedBy: *String* - Becuase this is still in developement this is not required but should for future reference be set as **"DEVELOPER"**.
###     &nbsp;&nbsp;&nbsp; time: *Date Object* - This should be an object that can be parsed by *new Date(arg)*. This could be a current date or a past date if it is meant to be set as an earlier post.
###     &nbsp;&nbsp;&nbsp; body: *String - HTML* - This has to be included and should be a string that can be parsed by an HTML interperator. The same HTML will later to used to display the shown blogpost with formating.
###  *}*
### This funtion is passed HTML and it saves it to the S3 server. This file will later be retrieved so it can be shown in blogpost history. This error handling on this is minor so it should follow the argument strongly, but it will be improved before final version. This function does not use promises and returns a regular object.

> ## *f* - getProjectFiles(*projectID*, *files*)
###  ***projectID*** *: Number/String* - This is the projectID that was assigned. If "0" is passed it will search S3 for a group with a folder of "./0/" and will search for a project.json created by *initializeNewProjectFolder*
###  ***files*** *[Number/String]* - This is an array that will be used to reference files.
### This function will get filed from a project folder. This can be used to fetch blogposts. It concats the projectID and file to get a path to fetch. For examples projectID of "0" and files of ["0"] will fetch the path "./0/0" from the S3 server. This returns a promise that contains an array of files, if the file could not be found that index will contain and empty object (*{}*).

> ## *f* - removeProject(*projectID*)
###  ***projectID*** *: Number/String* - This is the projectID that is to be removed.
### This function returns a promise. This function will completely removed a project from S3. A successful fulfill will return status and message. A reject will return status, error, and __dangerousShowError.

# Internal
# S3 Reliant
> ## *f* - S3FolderExists(*path*)
###  ***path*** *: String* - The path to the folder being searched for.
### This function returns a promise. The path that should be passed is expected to just be the folder name and should not have any prefixes or suffixes as the function will format it accordingly. A successful fulfill will return true/false. A reject will return an error and __dangerousShowError.

> ## *f* - S3FileExists(*projectID*, *file*)
###  ***projectID*** *: Number/String* - This is the projectID that was assigned. This is the folder that will be searched for the file.
### ***file*** *: String* - This is the file name that should be searched for.
### This function returns a promise. The file should not include and prefixes or suffixes as the function will handle that accordingly. A successful fulfill will return true/false. A reject will return an error, status, and __dangerousShowError.

> ## *f* - writeS3File(*projectID*, *file*, *data*)
###  ***projectID*** *: Number/String* - This is the projectID that was assigned. This is the folder that will contain the input file.
### ***file*** *: String* - This is the file name that will be input.
### ***data*** *: All Normal JS DataTypes* - This is the data that the file will contain. It can a handler for JSON Objects and will accept any other datatype that can be turned into a buffer using *new Buffer(...)*.  
### This function returns a promise. A successful fulfill will return a status and the files ETag on the server. A reject will return an error, status, and __dangerousShowError *or* it will just return a string message.

> ## *f* - removeFolder(*path*)
###  ***path*** *: String* - The path to the folder being removed.
### This function returns a promise. Due to how Amazon's S3 handles folders the inner content must be removed before the fold is removed. This causes this function the **recursively** remove its inner files first. This should be used sparingly. A successful fulfill will return status and message. A reject will return an error, status, and __dangerousShowError.

> ## *f* - listObjects(*path*)
###  ***path*** *: String* - The path to the folder whose files are being listed.
### This function returns a promise. A successful fulfill will return the first 1000 files inside the path. A reject will reject a __dangerousShowError.

> ## *f* - getFile(*filePath*)
### ***filePath*** *: String* - The file path for the file being fetched.
### This function returns a promise. This function *does not* concat the filePath with anything and should be passed such as "0/project.json". A successful fulfill will return LastModified object of the file, a ETag of the file, and the Body of the file. A unsuccessful fulfill will return an empty object (*{}*).

# S3 Helpers
> ## *f* - handleS3GetError(*err*)
### ***err*** *: Error* - The error thrown by S3.
### This function was an attempt to user friendlify the errors thrown by S3, however, the errors thrown by S3 were inconsistent in formatting is it is no longer to be used. Returns a minified version of passed err.

> ## *f* - getparams(*projectID*, *file*)
### ***projectID*** *: Number/String* - This is the projectID that was assigned. 
### ***file*** *: String* - The file being looked for.
### This function returns a JS Object that most S3 functions can interperate to use for getting files and for other actions. The file should be stripped down to only the filename and excluse any prefixes or suffixes.

> ## *f* - isObject(*object*)
### ***object*** *: Any JS Object*
### This function returns true or false if a object is truely as JS Object vs String or Array.
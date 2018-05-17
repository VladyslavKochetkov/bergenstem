var express = require("express");
var router = express.Router();
var projects = require("../mysql/projects")

router.get("/", (req, res) => {
    projects.getProjectMetaData(req.query.project)
        .then((x) => {
            // Temporarily rename primaryImage to img
            x.img = x.primaryImage;
            res.render('projects/blog', {
                project: x
            });
        });

    
})

module.exports = router;
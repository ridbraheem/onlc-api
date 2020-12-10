//jshint esversion:6
const dotenv = require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const csv = require('csvtojson');

var storage = multer.diskStorage({
   destination:(req,file,cb)=>{
       cb(null,'./public/uploads');
   },
   filename:(req,file,cb)=>{
       cb(null,file.originalname);
   }
});

var uploads = multer({storage:storage});

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

const uri = 'mongodb+srv://' + process.env.admin + ':' + process.env.password + '@cluster0.qmjxe.mongodb.net/' + process.env.db_name;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  useCreateIndex:true
}).catch(err => console.log(err.reason));


const CoursesSchema = new mongoose.Schema({
  platform: {
        type: String,
        required: 'Please enter Platform Name',
    },
  course_url: {
    type: String,
    required: 'URL cant be empty',
    unique: true
    },
  courseTitle: {
    type: String,
    required: 'Enter Course Title',
    },
    category: {
      type: String,
      required: 'Enter Category',
    },
    level: {
      type: String,
      required: 'Enter Category',
    }
});

const Course = mongoose.model("Course", CoursesSchema);

app.get("/", function(req, res){
  res.render('index');
});

app.post("/form", function(req, res){

  let err_msg = '';
  let succ_msg = '';

  const newCourse = new Course({
    platform: req.body.Platform,
    course_url: req.body.url,
    courseTitle: req.body.Title,
    category: req.body.Category,
    level: req.body.level
  });

  Course.findOne({course_url:req.body.url}).then(course=>{
  if(course){
    if (course.course_url === req.body.url) {
      err_msg = "This course already exists.";
      res.render('index', { err_msg: err_msg } );
    }
    } else {
      newCourse.save();
      succ_msg = "Successfully added a new course";
      res.render('index', { succ_msg: succ_msg } );
    }

});

});

app.post('/upload',uploads.single('csv'),(req,res)=>{
//convert csvfile to jsonArray
csv()
.fromFile(req.file.path)
.then((jsonObj)=>{
   Course.insertMany(jsonObj,(err,data)=>{
              if(err){
                  console.log(err);
                  err_msg = "Please check if your csv header matches the format. If that does not work that means some of the courses already exists in our database";
                  res.render('index', { err_msg: err_msg } );
              }else{
                succ_msg = "Successfully added a new course";
                res.render('index', { succ_msg: succ_msg } );
              }
       });
 });

});

///////////////////////////////////Requests Targetting all Courses////////////////////////

app.get("/courses", function(req, res){
  Course.find(function(err, foundCourses){
    if (!err) {
      res.send(foundCourses);
    } else {
      res.send(err);
    }
  })
});

app.get("/courses/:category", function(req, res){

  Course.find({category: req.params.category}, function(err, foundCourses){
    if (foundCourses) {
      res.send(foundCourses);
    } else {
      res.send("No Courses Matching that Category was found.");
    }
  })
});

app.get("/courses/:platform/:category/:level", function(req, res){

  Course.find({platform: req.params.platform,
               category: req.params.category,
               level: req.params.level,
    }, function(err, foundCourses){
    if (foundCourses) {
      res.send(foundCourses);
    } else {
      res.send("No Courses Matching that level was found.");
    }
  })
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});

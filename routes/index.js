var express = require('express');
var router = express.Router();
var Task = require('../models/task');


/* GET home page. */
router.get('/', function(req, res, next) {
  Task.find({}, function(err, tasks){
    if (err) {
      console.log(err);
    }
    res.render('index', { tasks: tasks});
  });
});

router.post('/', function(req, res, next) {
  console.log(req.body);
  var task = new Task({
    name: req.body.name,
    completed:  false,
    priority: req.body.priority
  });
  task.save(function(err, task) {
    if (err) return next(err);
    res.redirect('/');
  });
});

router.patch('/', function(req, res, next) {
  Task.findbyID(taskID, completed: true, function(err, task){
    // NOT SURE HERE
  });
  task.save //is this needed?
})

module.exports = router;

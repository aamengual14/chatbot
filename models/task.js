var mongoose = require('mongoose');

var taskSchema = new mongoose.Schema({
  name: {type: String, required: true},
  completed: false
});

var Task = mongoose.model('Task', taskSchema);

module.exports = Task;

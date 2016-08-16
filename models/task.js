var mongoose = require('mongoose');

var taskSchema = new mongoose.Schema({
  name: {type: String, required: true},
  completed: false,
  priority: String
});

var Task = mongoose.model('Task', taskSchema);

module.exports = Task;

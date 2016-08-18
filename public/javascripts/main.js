// var apiai = require('apiai');
// var app = apiai("14650862bca649278a87aaea42a1b43e");
// var request = app.textRequest()

// request.on('response', function(response) {
//     console.log(response);
// });

// request.on('error', function(error) {
//     console.log(error);
// });

// request.end()


//////////////////////////
///// Main Variables /////
/////////////////////////


var baseUrl = "https://api.api.ai/v1/",
    ///// Speech Recognition for HTML5 Speech Recog API. Will be Object /////
    recognition,
    ///// Interactive Variables /////
    messageRecording = "Recording...",
    messageCouldntHear = "I couldn't hear you, could you say that again?",
    messageInternalError = "Oh no, there has been an internal server error",
    messageSorry = "I'm sorry, I don't have the answer to that yet.";


$(document).ready(function() {

///// If user presses enter, fire API Post request /////

  $("#speech").keypress(function(event) {
    if (event.which == 13) {
      event.preventDefault();
      send();
    }
  });

///// Toggling recording and not recording /////

  $("#rec").on("click", function(event) {
  switchRecognition();
  });

  $(".debug-btn").on("click", function() {
    $(this).next().toggleClass("is-active");
    return false;
  });

  $(".task-btn").on("click", function() {
    $(this).next().toggleClass("is-active");
    return false;
  });

  $(".fa-trash-o").on('click', function() {
    taskID = ($(this).parent().parent().attr('data-id'));
    console.log(taskID);
    deleteTask(taskID);
  });

//////////////////////////////////////////////////////////////////////////////////////////////////
/// HTML5 Webkit SpeechRecognition API ***only available on Chrome*** and uses functions       ///
/// built in webkitSpeechRecognition.                                                          ///
//////////////////////////////////////////////////////////////////////////////////////////////////

  function startRecognition() {
      recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
          recognition.interimResults = false;
      recognition.onstart = function(event) {
        respond(messageRecording);
        updateRec();
      };
      recognition.onresult = function(event) {
        recognition.onend = null;

        var text = "";
          for (var i = event.resultIndex; i < event.results.length; ++i) {
            text += event.results[i][0].transcript;
          }
          setInput(text);
        stopRecognition();
      };
      recognition.onend = function() {
        respond(messageCouldntHear);
        stopRecognition();
      };
      recognition.lang = "en-US";
      recognition.start();
  }

  function stopRecognition() {
    if (recognition) {
      recognition.stop();
      recognition = null;
    }
    updateRec();
  }

  function switchRecognition() {
    if (recognition) {
      stopRecognition();
    } else {
      startRecognition();
    }
  }

  function setInput(text) {
    $("#speech").val(text);
    send();
  }

  function updateRec() {
    $("#rec").text(recognition ? "Stop" : "Speak");
  }

/////////////////////////////////////
///// Communication with API.AI /////
/////////////////////////////////////

  function send() {
    var text = $("#speech").val();
    $.ajax({
      type: "POST",
      url: baseUrl + "query/",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      headers: {
        "Authorization": "Bearer " + accessToken
      },
      data: JSON.stringify({q: text, lang: "en"}),
      success: function(data) {
        console.log(data);
        prepareResponse(data);
      },
      error: function() {
        respond(messageInternalError);
      }
    });
  }

  function prepareResponse(data) {
    var debugJSON = JSON.stringify(data, undefined, 2),
        spokenResponse = data.result.speech,
        task = data.result.action,
        value = data.result.parameters.name

    if (task === "completeTask") {
      completeTask(value);
    } else {
      createTask(data);
    }

    respond(spokenResponse);
    debugRespond(debugJSON);
  }


  function debugRespond(data) {
    $("#response").text(data);
  }

  function completeTask(data) {
    $.ajax({
      type: "PATCH",
      url: "/",
      dataType: "json",
      data: {name: data},
      success: function(data) {
        console.log("Task has been completed: ", data);
        $taskItem = $("#task-item[data-id='" + data._id + "']");
        console.log($taskItem);
        if ($taskItem) {
          $taskItem.addClass('strike');
          console.log("hello");
        }
      },
      error: function() {
        console.log("error");
      }
    });
  }

  function createTask(data) {
    $.ajax({
      type: "POST",
      url: "/",
      dataType: "json",
      data: {
        name: data.result.parameters.text,
        priority: data.result.parameters.priority
      },
      success: function(data) {
        var tmpl = '\
          <div id="task-item" data-id="' + data.task._id + '">\
            <h6>'+ data.task.name + '<i class="fa fa-trash-o" aria-hidden="true"></i></h6> <p>\ Priority: ' + data.task.priority + '</p>\
          </div>';
        $('#task-list').append(tmpl);
        console.log("great success", data);
      },
      error: function() {
        console.log("error");
      }
    });
  }


  function deleteTask(taskID) {
    $.ajax({
      type: "DELETE",
      url: "/" + taskID,
      dataType: "json",
      success: function() {
        console.log(taskID);
        console.log("Task has been deleted");
        $taskItem = $("#task-item[data-id='" + taskID + "']");
        $taskItem.remove();

      },
      error: function() {
        console.log("error");
      }
    });
  }





///////////////////////////////////////////////////////////////////////////////
///// Web Speech API *chrome only* to take the value and return in speech /////
///////////////////////////////////////////////////////////////////////////////

  function respond(val) {
    if (val == "") {
      val = messageSorry;
    };

    // if (val == "Task now complete") {
    //   taskCompleted(task);
    // }


    if (val !== messageRecording) {
      var msg = new SpeechSynthesisUtterance();
      msg.voiceURI = "native";
      msg.text = val;
      msg.lang = "en-US";
      window.speechSynthesis.speak(msg);
    }
    $("#spokenResponse").addClass("is-active").find(".spoken-response-text").html(val);
  }

});


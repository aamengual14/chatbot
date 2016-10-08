
//////////////////////////
///// Main Variables /////
/////////////////////////

    ///// Base url for API.AI calls /////
var baseUrl = "https://api.api.ai/v1/",
    ///// Speech Recognition for HTML5 Speech Recog API. Will be Object /////
    recognition,
    ///// Interactive Variables /////
    messageRecording = "Recording...",
    messageCouldntHear = "I couldn't hear you that time. Could you say that again?",
    messageInternalError = "Oh no, looks like there has been an internal server error",
    messageSorry = "I'm sorry, I don't know the answer to that yet.";


$(document).ready(function() {

///// If user presses enter, fire API Post request send() /////

  $("#speech").keypress(function(event) {
    if (event.which == 13) {
      event.preventDefault();
      send();
    }
  });

///// Toggling recording and not recording, rec is button /////

  $("#rec").on("click", function(event) {
  switchRecognition();
  });

///// View JSON results on page bottom right /////

  $(".debug-btn").on("click", function() {
    $(this).next().toggleClass("is-active");
    if ($(window).width() <= 610) {
      $(".task-btn").toggleClass('is-hidden');
    }
    return false;
  });

///// View task list on page bottom left /////

  $(".task-btn").on("click", function() {
    $(this).next().toggleClass("is-active");
    return false;
  });

///// Delete task item, invokes deleteTask() /////

  $(".fa-trash-o").on('click', function() {
    var taskID = ($(this).parent().parent().attr('data-id'));
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
///// shows user message is recording when speak button pressed /////
        respond(messageRecording);
        updateRec();
      };
      recognition.onresult = function(event) {
///// resets /////
        recognition.onend = null;

        var text = "";
          for (var i = event.resultIndex; i < event.results.length; ++i) {
            text += event.results[i][0].transcript;
          }
///// show result of what user said in input (if spoken) /////
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

///// following 2 functions stop or switch listening process, used above ////
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

///// user input and API.AI call /////
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

///// Variety of responses based on above function where this is invoked /////

  function prepareResponse(data) {
    ///// debugJSON for bottom left page results /////
    var debugJSON = JSON.stringify(data, undefined, 2),
    ///// spoken response for what bot says back /////
        spokenResponse = data.result.speech,
    ///// task to check and see if action parameter from API.AI hit/////
        task = data.result.action,
    ///// if above variable exits, it means a task was requested completed /////
        value = data.result.parameters.name

    if (task === "completeTask") {
      completeTask(value);
    } else {
      createTask(data);
    }

    respond(spokenResponse);
    debugRespond(debugJSON);
  }

//// for bottom right results, invoked in prepareResponse /////
  function debugRespond(data) {
    $("#response").text(data);
  }

///// task completion, communication with router to update databse and DOM /////
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

///// new task created, communication with router to database save and DOM appear /////
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

///// on click of trash can button, this is invoked /////
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



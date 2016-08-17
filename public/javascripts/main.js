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

  function prepareResponse(val) {
    var debugJSON = JSON.stringify(val, undefined, 2),
        spokenResponse = val.result.speech;

    $.ajax({
      type: "POST",
      url: "/",
      dataType: "json",
      data: {
        name: val.result.parameters.text,
        priority: val.result.parameters.priority
      },
      success: function(val) {
        console.log("great success", val);
      },
      error: function() {
        console.log("error");
      }

    });

    respond(spokenResponse);
    debugRespond(debugJSON);
  }


  function debugRespond(val) {
    $("#response").text(val);
  }

  function completeTask(val) {
    $.ajax({
      type: "PATCH",
      url: "/",
      dataType: "json",
      data: {
        // unsure here
      },
      success: function(val) {
        console.log("great success", val);
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
    }
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


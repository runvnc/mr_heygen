import StreamingAvatar, {
  AvatarQuality, VoiceEmotion, StreamingEvents, TaskType
} from '@heygen/streaming-avatar';
//import './tts.js';
import {debugLog} from './debugoverlay.js';



debugLog("Hello from HeyGen plugin")

console.log('Libraries imported successfully');
// DOM elements
const videoElement = document.getElementById("avatarVideo");
const startButton = document.getElementById("startSession");
const speakButton = document.getElementById("speakButton");
const userInput = document.getElementById("userInput");
const animation = document.getElementById("animation");

let avatar = null;
let sessionData = null;
let isSessionActive = false;
let talkMode = TaskType.REPEAT;

async function fetchAccessToken() {
  const response = await window.authenticatedFetch("/heygen/tempkey")

  return await response.text()
}

// Show/hide loading spinner
function setLoading(show) {
  return
  try {
    const animation = document.getElementById("animation");
    animation.style.display = show ? 'block' : 'none';
  } catch (e) {
    console.error("Error setting loading animation visibility", e);
  }
}

// Initialize streaming avatar session
async function initializeAvatarSession() {
  const token = await fetchAccessToken();
  avatar = new StreamingAvatar({ token });
  const data = await window.authenticatedFetch(`/heygen/avatarsettings/${window.persona}`)
  const avatarSettings = await data.json();
  console.log("retrieved avatar settings for persona", window.persona)
  console.log({avatarSettings})
 
  window.avatar = avatar;
  console.log('Avatar instance created')
  console.log({avatarSettings})
  console.log('hello')
  console.log({avatarSettings})
  avatar.on(StreamingEvents.STREAM_READY, handleStreamReady);
  avatar.on(StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);

  sessionData = await avatar.createStartAvatar(avatarSettings);

  console.log("Session data:", sessionData);

  // Update button state
  isSessionActive = true;
  startButton.textContent = "End Session";
  startButton.classList.add("active");

  videoElement.style.display = 'block'
}


function hideLoadingAndStartPlaying() {
  try {
    console.log("Trying to start playing")
    videoElement.style.display = 'block';
    videoElement.play().catch(console.error);
    animation.style.display = 'none';
    setLoading(false);
  } catch (e) {
    console.warn("Could not start video (maybe already playing)", e);
  }
}

// Handle when avatar stream is ready
function handleStreamReady(event) {
  console.log("Stream ready")
  console.log(event)
  if (event.detail && videoElement) {
    videoElement.srcObject = event.detail;
    window.avatarSource = event.detail
    videoElement.onloadedmetadata = hideLoadingAndStartPlaying;
    if (videoElement.readyState >= 2) {
      hideLoadingAndStartPlaying();
    } else {
      console.log("Video not ready yet, not waiting for loadedmetadata event")
      //hideLoadingAndStartPlaying()
    }
    //setTimeout(hideLoadingAndStartPlaying, 5000);
    //setTimeout(hideLoadingAndStartPlaying, 10000);
  } else {
    console.error("Stream is not available!!!!!");
  }
}

// Handle stream disconnection
function handleStreamDisconnected() {
  console.log("Stream disconnected");
  if (videoElement) {
    videoElement.srcObject = null;
    videoElement.style.display = 'none';
    //animation.style.display = 'block';
  }

  // Update button state
  isSessionActive = false;
  startButton.textContent = "Load Avatar";
  startButton.classList.remove("active");
  setLoading(false);
}

// End the avatar session
async function terminateAvatarSession() {
  try {
    if (!avatar || !sessionData) {
      console.warn("No active avatar session to terminate so not stopping avatar");
      return
    }

    await avatar.stopAvatar();
    console.log({avatar})
  } catch (e) {
    console.error("Error stopping avatar", e);
  }
  avatar.off(StreamingEvents.STREAM_READY, handleStreamReady);
  avatar.off(StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);
 
  videoElement.srcObject = null;
  avatar = null;
}

// Handle speaking event
async function handleSpeak(text) {
  // print a banner in yellow with blue background
  console.log("%c handleSpeak", "color: yellow; background-color: blue", "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1");
  console.log("handleSpeak", text)
  debugLog("handleSpeak...............................")
  let input = text || userInput.value;
  if (text) {
    userInput.value = text;
  }
  debugLog("2")
  if (avatar && input) {
    console.log("%c would send this text: ", "color: yellow; background-color: blue", input);
    debugLog("3")
    await avatar.speak({
      text: input,
      task_type: talkMode
    });
    debugLog("4")
    userInput.value = ""; // Clear input after speaking
  }
}

async function shutUp() {
  if (avatar) {
    try {
      await avatar.interrupt();
    } catch (e) {
      //console.error("Error interrupting avatar", e);
    }
  }
}

window.shutUp = shutUp;
window.handleSpeak = handleSpeak;

async function switchMode(mode) {
  console.log("switching mode to", mode);
  if (avatar) {
    console.log('found avatar, switching mode');
    talkMode = mode;
    if (mode === TaskType.TALK) {
      document.getElementById("talkModeButton").disabled = true;
      document.getElementById("repeatModeButton").disabled = false;
    } else {
      document.getElementById("talkModeButton").disabled = false;
      document.getElementById("repeatModeButton").disabled = true;
    }
  } else {
    console.error("Avatar not found");
  }
}

function setListen(listen) {
  if (listen) {
    avatar.interrupt();
    console.log("start listening");
    //avatar.startListening();
    document.getElementById("startListeningButton").disabled = true;
    document.getElementById("stopListeningButton").disabled = false;
  } else {
    avatar.interrupt();
    console.log("stop listening");
    //avatar.stopListening();
    document.getElementById("startListeningButton").disabled = false;
    document.getElementById("stopListeningButton").disabled = true;
  }
}

// Toggle session state
async function toggleSession() {
  if (!isSessionActive) {
    setLoading(true);
    await initializeAvatarSession();
  } else {
    console.log("Terminating session...")
    await terminateAvatarSession();
  }
}

let addedSay = false
// Event listeners for buttons
startButton.addEventListener("click", () => {
    toggleSession()
    if (addedSay) {
      console.log("added say handler already")
      return
    }
    console.log("registering commands: wait_for_user_reply")
    addedSay = true
    window.registerCommandHandler('wait_for_user_reply', async (data) => {
      console.log('wait_for_user_reply()', data);
        if (data.event == 'running') {
          try {
            debugLog("handleSpeak...............................")
            debugLog(data.args.text)
            await window.avatar.speak({
              text: data.args.text,
              task_type: TaskType.REPEAT
            });
            debugLog("sent text to avatar")
          } catch (e) {
            console.error("Error speaking", e);
            debugLog("Error speaking " + JSON.stringify(e))
          }
        }
    });
})


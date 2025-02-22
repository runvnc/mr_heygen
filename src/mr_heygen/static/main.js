import StreamingAvatar, {
  AvatarQuality, VoiceEmotion, StreamingEvents, TaskType
} from '@heygen/streaming-avatar';
import './tts.js';
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
let talkMode = TaskType.TALK;

async function fetchAccessToken() {
  const response = await fetch("/heygen/tempkey")

  return await response.text()
}

// Show/hide loading spinner
function setLoading(show) {
  const animation = document.getElementById("animation");
  if (animation && animation.readyState >= 2) {
    animation.style.display = show ? 'block' : 'none';
  } else {
    const loadingElement = document.getElementById("loading");
    window.loadingElement = loadingElement
    if (loadingElement) {

      loadingElement.classList.toggle("active", show);
    }
  }
}

// Initialize streaming avatar session
async function initializeAvatarSession() {
  const token = await fetchAccessToken();
  avatar = new StreamingAvatar({ token });
  const data = await fetch(`/heygen/avatarsettings/${window.persona}`)
  const avatarSettings = await data.json();
  window.avatar = avatar;
  sessionData = await avatar.createStartAvatar(avatarSettings);

  console.log("Session data:", sessionData);

  // Update button state
  isSessionActive = true;
  startButton.textContent = "End Session";
  startButton.classList.add("active");

  avatar.on(StreamingEvents.STREAM_READY, handleStreamReady);
  avatar.on(StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);
}

// Handle when avatar stream is ready
function handleStreamReady(event) {
  if (event.detail && videoElement) {
    videoElement.srcObject = event.detail;
    videoElement.onloadedmetadata = () => {
      videoElement.play().catch(console.error);
      videoElement.style.display = 'block';
      animation.style.display = 'none';
      setLoading(false);
    };
  } else {
    console.error("Stream is not available");
  }
}

// Handle stream disconnection
function handleStreamDisconnected() {
  console.log("Stream disconnected");
  if (videoElement) {
    videoElement.srcObject = null;
    videoElement.style.display = 'none';
    animation.style.display = 'block';
  }

  // Update button state
  isSessionActive = false;
  startButton.textContent = "Load Avatar";
  startButton.classList.remove("active");
  setLoading(false);
}

// End the avatar session
async function terminateAvatarSession() {
  if (!avatar || !sessionData) return;

  await avatar.stopAvatar();
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
    avatar.startListening();
    document.getElementById("startListeningButton").disabled = true;
    document.getElementById("stopListeningButton").disabled = false;
  } else {
    avatar.interrupt();
    console.log("stop listening");
    avatar.stopListening();
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
    console.log("registering commands: say")
    addedSay = true
    window.registerCommandHandler('say', async (data) => {
      console.log('say()', data);
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


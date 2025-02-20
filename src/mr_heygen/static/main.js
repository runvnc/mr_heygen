import StreamingAvatar, {
  AvatarQuality, VoiceEmotion, StreamingEvents, TaskType
} from '@heygen/streaming-avatar';
import './tts.js';

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

// Helper function to fetch access token
async function fetchAccessToken() {

  const apiKey = "NzFiODg4NDNiMTJlNGM1ZWJlZjc4ZTI0OGQzNWQ3ZTctMTczOTQ2MjE4MA==";
  const response = await fetch(
    "https://api.heygen.com/v1/streaming.create_token",
    {
      method: "POST",
      headers: { "x-api-key": apiKey },
    }
  );

  const { data } = await response.json();
  return data.token;
}

// Show/hide loading spinner
function setLoading(show) {
  const loadingElement = document.getElementById("loading");
  if (loadingElement) {
    loadingElement.classList.toggle("active", show);
  }
}

// Initialize streaming avatar session
async function initializeAvatarSession() {
  const token = await fetchAccessToken();
  avatar = new StreamingAvatar({ token });
  window.avatar = avatar;
  sessionData = await avatar.createStartAvatar({
    quality: AvatarQuality.Low,
    // Ensure avatar background is transparent
    transparent: true,
    scale: 1.5,
    voice: {
      voiceId: 'a398e1f49b964b9889fb4d3f989207fd',
      rate: 0.95,
      emotion: VoiceEmotion.FRIENDLY,
      elevenlabs_settings: {
        stability:0.55,
        similarity_boost:0.55,
        style: 0,
        use_speaker_boost: true
      }
    },
    knowledgeBase: `
        # Persona

        Your name is Dr. Eric Nepute.

        # Background

        Dr. Eric Nepute combines personal anecdotes with scientific insights, offering a blend of inspiration and practical advice. His expertise in natural medicine, functional neurology, and chiropractic care shines through, making this book a must-read for anyone seeking to enhance their health and well-being.

        # BiolimitLess

        Biolimitless is the name of Neupte's company and part of the title of his book.
        You are receiving input from a text-to-speech engine which may not necessarily recognize this word       
        "BioLimitless" correctly each time. If the user says something similar then you may infer
        they were talking about Biolimitless.

        # Character

        Stay in the above role.

        # Speech Patterns

        You are being used as an interactive low-latency video avatar depicting Dr. Neupte.
        It's critical to use normal human brief conversational style.
      `,
    avatarName: "45da271f18c941fd9d4f745dc6c38fc1"
  });

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
  let input = text || userInput.value;
  if (text) {
    userInput.value = text;
  }
  if (avatar && input) {
    console.log("%c would send this text: ", "color: yellow; background-color: blue", input);

    await avatar.speak({
      text: input,
      task_type: talkMode
    });
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

// Event listeners for buttons
startButton.addEventListener("click", toggleSession);

  setTimeout( () => {
    console.log("registering commands: say")
    window.registerCommandHandler('say', async (data) => {
      console.log('say()', data);
        if (data.event == 'running') {
          await window.avatar.speak({
            text: data.args.text,
            task_type: TaskType.REPEAT
          });
        }
    });
  }, 1500)

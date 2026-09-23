/* ==========================================================================
   TrailKit — Speech to Text
   Uses the browser Web Speech API (SpeechRecognition / webkitSpeechRecognition).
   No audio is sent to a TrailKit server; the browser/OS may process audio
   locally or via the browser vendor's service depending on the implementation.
   ========================================================================== */

(function () {
  'use strict';

  const $ = window.TrailKit.$;
  const showAlert = window.TrailKit.showAlert;
  const clearAlert = window.TrailKit.clearAlert;

  let recognition = null;
  let isListening = false;
  let finalTranscript = '';

  function getRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    return r;
  }

  function supported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  function updateUI() {
    const startBtn = document.getElementById('speech-start');
    const stopBtn = document.getElementById('speech-stop');
    const status = document.getElementById('speech-status');
    if (!startBtn || !stopBtn || !status) return;

    startBtn.disabled = isListening;
    stopBtn.disabled = !isListening;
    status.textContent = isListening ? 'Listening…' : 'Ready';
    status.className = isListening ? 'speech-status listening' : 'speech-status';
  }

  function appendTranscript(text, isFinal) {
    const interimBox = document.getElementById('speech-interim');
    const finalBox = document.getElementById('speech-final');
    if (!interimBox || !finalBox) return;

    if (isFinal) {
      finalTranscript += text;
      finalBox.textContent = finalTranscript;
      interimBox.textContent = '';
    } else {
      interimBox.textContent = text;
    }
  }

  function start() {
    const alertBox = document.getElementById('speech-alert');
    clearAlert(alertBox);

    if (!supported()) {
      showAlert(alertBox, 'error', 'Your browser does not support the Web Speech API. Please use Chrome, Edge, or Safari.');
      return;
    }
    if (isListening) return;

    recognition = getRecognition();
    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript + ' ';
        else interim += transcript;
      }
      if (final) appendTranscript(final, true);
      else appendTranscript(interim, false);
    };
    recognition.onerror = (event) => {
      const messages = {
        'not-allowed': 'Microphone access was denied. Please allow microphone permissions in your browser settings.',
        'no-speech': 'No speech was detected. Try speaking louder or closer to the microphone.',
        'audio-capture': 'No microphone was found. Please connect a microphone and try again.',
        'network': 'A network error occurred. Speech recognition may require an internet connection.',
        'aborted': 'Speech recognition was aborted.'
      };
      showAlert(alertBox, 'error', messages[event.error] || `Speech recognition error: ${event.error}`);
      isListening = false;
      updateUI();
    };
    recognition.onend = () => {
      if (isListening) {
        // Auto-restart if still supposed to be listening
        try { recognition.start(); } catch (_) { isListening = false; updateUI(); }
      } else {
        updateUI();
      }
    };

    try {
      recognition.start();
      isListening = true;
      updateUI();
    } catch (err) {
      showAlert(alertBox, 'error', 'Could not start speech recognition: ' + err.message);
    }
  }

  function stop() {
    if (recognition) {
      try { recognition.stop(); } catch (_) {}
    }
    isListening = false;
    updateUI();
  }

  function reset() {
    stop();
    finalTranscript = '';
    const finalBox = document.getElementById('speech-final');
    const interimBox = document.getElementById('speech-interim');
    if (finalBox) finalBox.textContent = '';
    if (interimBox) interimBox.textContent = '';
    clearAlert(document.getElementById('speech-alert'));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.getElementById('speech-page');
    if (!page) return;

    const alertBox = document.getElementById('speech-alert');

    if (!supported()) {
      showAlert(alertBox, 'warning', 'Web Speech API is not supported in this browser. The live microphone transcription feature requires Chrome, Edge, or Safari. You can still use the text utilities below.');
      const startBtn = document.getElementById('speech-start');
      if (startBtn) startBtn.disabled = true;
    }

    document.getElementById('speech-start').addEventListener('click', start);
    document.getElementById('speech-stop').addEventListener('click', stop);
    document.getElementById('speech-reset').addEventListener('click', reset);

    /* Copy transcript */
    const copyBtn = document.getElementById('speech-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const text = document.getElementById('speech-final').textContent;
        if (!text.trim()) {
          showAlert(alertBox, 'error', 'There is no transcript to copy yet.');
          return;
        }
        try {
          await navigator.clipboard.writeText(text);
          showAlert(alertBox, 'success', 'Transcript copied to clipboard.');
        } catch (_) {
          showAlert(alertBox, 'error', 'Clipboard access was denied. Please copy manually.');
        }
      });
    }

    /* Download transcript */
    const dlBtn = document.getElementById('speech-download');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        const text = document.getElementById('speech-final').textContent;
        if (!text.trim()) {
          showAlert(alertBox, 'error', 'There is no transcript to download yet.');
          return;
        }
        const blob = new Blob([text], { type: 'text/plain' });
        window.TrailKit.downloadBlob(blob, 'transcript.txt');
      });
    }
  });
})();
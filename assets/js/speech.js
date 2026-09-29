/* ==========================================================================
   TrailKit — Speech to Text (Web Speech API)
   ========================================================================== */

(function () {
  'use strict';

  const showAlert = window.TrailKit.showAlert;
  const clearAlert = window.TrailKit.clearAlert;

  let recognition = null;
  let isListening = false;
  let finalTranscript = '';

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
    if (!supported()) { showAlert(alertBox, 'error', 'Your browser does not support the Web Speech API.'); return; }
    if (isListening) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = function (event) {
      let interim = '', final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + ' ';
        else interim += t;
      }
      if (final) appendTranscript(final, true);
      else appendTranscript(interim, false);
    };
    recognition.onerror = function (event) {
      const messages = {
        'not-allowed': 'Microphone access was denied.',
        'no-speech': 'No speech detected. Try speaking louder.',
        'audio-capture': 'No microphone found.',
        'network': 'Network error. Speech recognition may require internet.'
      };
      showAlert(alertBox, 'error', messages[event.error] || ('Speech error: ' + event.error));
      isListening = false;
      updateUI();
    };
    recognition.onend = function () {
      if (isListening) { try { recognition.start(); } catch (_) { isListening = false; updateUI(); } }
      else { updateUI(); }
    };

    try {
      recognition.start();
      isListening = true;
      updateUI();
    } catch (err) {
      showAlert(alertBox, 'error', 'Could not start: ' + err.message);
    }
  }

  function stop() {
    if (recognition) { try { recognition.stop(); } catch (_) {} }
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

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('speech-page')) return;
    const alertBox = document.getElementById('speech-alert');
    if (!supported()) {
      showAlert(alertBox, 'warning', 'Web Speech API is not supported in this browser. Try Chrome, Edge, or Safari.');
      const startBtn = document.getElementById('speech-start');
      if (startBtn) startBtn.disabled = true;
    }
    document.getElementById('speech-start').addEventListener('click', start);
    document.getElementById('speech-stop').addEventListener('click', stop);
    document.getElementById('speech-reset').addEventListener('click', reset);

    document.getElementById('speech-copy').addEventListener('click', async function () {
      const text = document.getElementById('speech-final').textContent;
      if (!text.trim()) { showAlert(alertBox, 'error', 'No transcript yet.'); return; }
      try { await navigator.clipboard.writeText(text); showAlert(alertBox, 'success', 'Copied.'); }
      catch (_) { showAlert(alertBox, 'error', 'Clipboard denied.'); }
    });
    document.getElementById('speech-download').addEventListener('click', function () {
      const text = document.getElementById('speech-final').textContent;
      if (!text.trim()) { showAlert(alertBox, 'error', 'No transcript yet.'); return; }
      const blob = new Blob([text], { type: 'text/plain' });
      window.TrailKit.downloadBlob(blob, 'transcript.txt');
    });
  });
})();
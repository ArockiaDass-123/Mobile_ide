/**
 * Voice Model Assistant & Speech Synthesis / Recognition Service
 * Enables hands-free prompt dictation and AI text-to-speech feedback.
 */

export class VoiceAssistant {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis || null;
    this.isListening = false;
    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  startListening({ onResult, onEnd, onError }) {
    if (!this.recognition) {
      onError && onError('Speech recognition not supported in this browser.');
      return;
    }

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript && onResult) {
        onResult(finalTranscript);
      }
    };

    this.recognition.onerror = (err) => {
      this.isListening = false;
      onError && onError(err.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd && onEnd();
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      this.isListening = false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  speak(text) {
    if (!this.synthesis) return;
    try {
      this.synthesis.cancel(); // Stop any previous speech
      const clean = text.replace(/[*#`_]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      this.synthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
    }
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
}

export const voiceAssistant = new VoiceAssistant();

import React, { useState, useEffect } from 'react';
import { useIDEStore } from '../store/ideStore';
import { Mic, MicOff, PhoneCall, Check, X, ShieldAlert, Sparkles, Volume2, Bot } from 'lucide-react';
import { voiceAssistant } from '../services/voiceAssistant';
import { parseJarvisIntent } from '../services/jarvisNluService';
import { jarvisAndroidBridge } from '../services/jarvisAndroidBridge';

export default function JarvisAssistantOverlay() {
  const { setActiveTab, addMessage, currentAgent } = useIDEStore();
  const [isWakeActive, setIsWakeActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [assistantSpeech, setAssistantSpeech] = useState('');

  // Start listening for "JARVIS" wake word or direct commands
  const activateJarvis = () => {
    setIsWakeActive(true);
    setTranscript('Listening for command (Tamil / English)...');
    jarvisAndroidBridge.vibrate([80]);

    voiceAssistant.startListening({
      onResult: (text) => {
        setTranscript(text);
        handleCommand(text);
      },
      onError: (err) => {
        console.warn('Voice error:', err);
        setIsWakeActive(false);
      },
      onEnd: () => {
        setIsWakeActive(false);
      }
    });
  };

  const speakJarvisResponse = (text) => {
    setAssistantSpeech(text);
    voiceAssistant.speak(text);
  };

  const handleCommand = (text) => {
    const parsed = parseJarvisIntent(text);

    switch (parsed.intent) {
      case 'MAKE_CALL':
        // Ask confirmation for phone call safety
        jarvisAndroidBridge.vibrate([100, 100]);
        setPendingConfirmation({
          type: 'CALL',
          target: parsed.target,
          message: `${parsed.target}-ku call pannatuma? (Confirm call to ${parsed.target}?)`
        });
        speakJarvisResponse(`${parsed.target}-ku call pannatuma?`);
        break;

      case 'NAVIGATE':
        jarvisAndroidBridge.vibrate([50]);
        setActiveTab(parsed.destination);
        speakJarvisResponse(`Opening ${parsed.destination}`);
        setIsWakeActive(false);
        break;

      case 'ATTENTION':
        jarvisAndroidBridge.vibrate([80, 50, 80]);
        speakJarvisResponse(parsed.responseTamil);
        setIsWakeActive(false);
        break;

      case 'START_CODING':
        jarvisAndroidBridge.vibrate([100]);
        setActiveTab('chat');
        speakJarvisResponse(`Kandippa! Starting AI coding agent for: ${parsed.prompt}`);
        addMessage({
          role: 'user',
          content: parsed.prompt
        });
        setIsWakeActive(false);
        break;

      default:
        speakJarvisResponse(`I heard: ${text}. How can I assist you further?`);
        setIsWakeActive(false);
    }
  };

  const confirmAction = () => {
    if (!pendingConfirmation) return;

    if (pendingConfirmation.type === 'CALL') {
      speakJarvisResponse(`Calling ${pendingConfirmation.target}...`);
      jarvisAndroidBridge.initiatePhoneCall(pendingConfirmation.target);
    }

    setPendingConfirmation(null);
    setIsWakeActive(false);
  };

  const cancelAction = () => {
    speakJarvisResponse('Action cancelled.');
    setPendingConfirmation(null);
    setIsWakeActive(false);
  };

  return (
    <>
      {/* Floating JARVIS Quick Wake Button on Mobile/Desktop (Repositioned to bottom-right top layer without covering text input) */}
      <div className="fixed bottom-24 right-4 z-40 sm:bottom-20 sm:right-6">
        <button
          onClick={activateJarvis}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg transition-all duration-300 cursor-pointer active:scale-95 ${
            isWakeActive
              ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-400/30'
              : 'bg-zinc-900/90 backdrop-blur-xs border border-zinc-700 text-green-400 hover:bg-zinc-800'
          }`}
          title="Activate JARVIS Assistant"
        >
          <Bot className="w-4 h-4 text-green-400" />
          <span className="text-[11px] font-mono font-bold tracking-wider">JARVIS</span>
          {isWakeActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Safety Confirmation Dialog for Sensitive Actions (Calls / Deletion) */}
      {pendingConfirmation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Action Confirmation</h3>
                <p className="text-xs text-zinc-400 font-mono">JARVIS Security Protocol</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80">
              {pendingConfirmation.message}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={cancelAction}
                className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition active:scale-95"
              >
                Cancel (Vendaam)
              </button>
              <button
                onClick={confirmAction}
                className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Confirm (Call Pannu)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

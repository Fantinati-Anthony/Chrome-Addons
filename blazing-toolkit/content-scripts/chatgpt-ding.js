// ChatGPT/OpenAI Playground notification sound
// Plays a sound when GPT finishes generating a response

(function() {
  'use strict';

  // Embedded WAV audio (short ding sound) - base64 encoded
  const DING_SOUND_BASE64 = 'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1cY2pucnBrZWRjZ3R+gn13cm1veIGFg314dHN4f4KAenRxcnh/goB6dHJ1fIKEgXt2dHZ8goaEf3t4eX6ChoR/enl6f4SHhYB8eXt/g4aEf3t5e3+DhoOAe3l7f4OGhIB7eXt/g4aEf3t5e3+DhoR/e3l7f4OGhH97eXt/g4aEf3t5e3+DhoR/e3l7f4OGhH97eXt/g4aEf3t5e36DhoR/e3l7foOGhH97eXt+g4aEf3t5e36DhoR/e3l7foOGhH97eXt+g4aEf3t5e36DhoR/e3l7foKGhH97eXt+goaEf3t5e36ChoR/e3l7foKGhH97eXt+goaEf3t5e36ChoR/e3l7foKGhH97eXt+goaEf3t5e36ChoR/e3l7foKGhH97eXt+goWEf3t5e36ChYR/e3l7foKFhH97eXt+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYR/e3l8foKFhH97eXx+goWEf3t5fH6ChYQ=';

  let lastDingTime = 0;
  const DING_COOLDOWN = 3000; // 3 seconds cooldown

  // Create audio element
  function createAudio() {
    const audio = new Audio('data:audio/wav;base64,' + DING_SOUND_BASE64);
    audio.volume = 0.5;
    return audio;
  }

  // Play ding sound with cooldown
  function playDing() {
    const now = Date.now();
    if (now - lastDingTime > DING_COOLDOWN) {
      lastDingTime = now;
      const audio = createAudio();
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
  }

  // Check if streaming animation is present
  function isStreaming() {
    return document.querySelector('.result-streaming') !== null ||
           document.querySelector('[class*="streaming"]') !== null;
  }

  let wasStreaming = false;

  // Mutation observer to detect when response completes
  const observer = new MutationObserver((mutations) => {
    const currentlyStreaming = isStreaming();

    // If was streaming and now stopped -> response complete
    if (wasStreaming && !currentlyStreaming) {
      playDing();
    }

    wasStreaming = currentlyStreaming;
  });

  // Start observing
  function startObserving() {
    const targetNode = document.body;
    if (targetNode) {
      observer.observe(targetNode, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserving);
  } else {
    startObserving();
  }

  // Play initial test sound (quieter)
  setTimeout(() => {
    const testAudio = createAudio();
    testAudio.volume = 0.2;
    testAudio.play().catch(() => {});
  }, 1000);

  console.log('ChatGPT Ding notification loaded');
})();

async function full() {
   // -----------------------------
   // গ্লোবাল ভেরিয়েবল যা রিয়েল-টাইমে আপডেট হবে
   // -----------------------------
   let currentSettings = {
     fetcherEnabled: true,
     key: "sp1_status",
     value: "0",
     name: "[No data Set]",
     botToken: "8517428228:AAHCl-SpNn2KY9SSeMlxovcq-4Rug7gwTzw",
     chatId: "",
     finalAlertTime: 9.67,
     intervals: [3, 4, 5, 6, 7, 8]
   };
   
   // -----------------------------
   // টাইমার রেফারেন্স সংরক্ষণের জন্য
   // -----------------------------
   let timerReferences = {
     intervalTimers: [],
     nineMinTimer: null,
     finalTimer: null,
     countdownInterval: null
   };
   
   // -----------------------------
   // স্টার্ট টাইম ম্যানেজমেন্ট
   // -----------------------------
   function getTaskStartTime() {
     const taskId = window.location.pathname.split('/').pop();
     const storageKey = `task_start_${taskId}`;
     
     let startTime = localStorage.getItem(storageKey);
     
     if (!startTime) {
       startTime = Date.now().toString();
       localStorage.setItem(storageKey, startTime);
       console.log(`🎯 First load: Timer started at ${new Date(parseInt(startTime)).toLocaleTimeString()}`);
     } else {
       console.log(`🔄 Reload detected: Continuing timer from ${new Date(parseInt(startTime)).toLocaleTimeString()}`);
     }
     
     return parseInt(startTime);
   }

   function clearTaskStartTime() {
     const taskId = window.location.pathname.split('/').pop();
     const storageKey = `task_start_${taskId}`;
     localStorage.removeItem(storageKey);
   }
   
   // -----------------------------
   // সব টাইমার ক্লিয়ার করার ফাংশন
   // -----------------------------
   function clearAllTimers() {
     timerReferences.intervalTimers.forEach(timer => clearTimeout(timer));
     timerReferences.intervalTimers = [];
     
     if (timerReferences.nineMinTimer) {
       clearTimeout(timerReferences.nineMinTimer);
       timerReferences.nineMinTimer = null;
     }
     
     if (timerReferences.finalTimer) {
       clearTimeout(timerReferences.finalTimer);
       timerReferences.finalTimer = null;
     }
     
     console.log("🔄 All timers cleared");
   }
   
   // -----------------------------
   // স্কিপ বাটন ভিজিবিলিটি চেক
   // -----------------------------
   function isSkipButtonVisible() {
     const btn = document.querySelector('a.mw-btn.danger[href*="skipTask"]');
     if (!btn) return false;
     
     const style = window.getComputedStyle(btn);
     return style.display !== 'none' && 
            style.visibility !== 'hidden' && 
            btn.offsetHeight > 0;
   }
   
   // -----------------------------
   // ফাইনাল অ্যাকশন - fetch দিয়ে স্কিপ + সাথে সাথেই রিডাইরেক্ট
   // -----------------------------
// -----------------------------
// ফাইনাল অ্যাকশন - সুপার ফাস্ট ভার্সন
// -----------------------------
async function performFinalAction() {
  const msg = `${currentSettings.name}: 🔔 Final alert! Skipping task and redirecting...`;
  
  // নোটিফিকেশন (fire and forget)
  fetch(`https://api.telegram.org/bot${currentSettings.botToken}/sendMessage?chat_id=${currentSettings.chatId}&text=${encodeURIComponent(msg)}`).catch(() => {});
  chrome.runtime.sendMessage({ message: msg }).catch(() => {});
  
  // স্কিপ বাটন খুঁজি
  const skipButton = document.querySelector('a.mw-btn.danger[href*="skipTask"]');
  
  if (skipButton && skipButton.href) {
    console.log("⏭️ Skipping task and redirecting immediately...");
    
    // **পদ্ধতি: ইমেজ লোড করে স্কিপ (সবচেয়ে দ্রুত)**
    const img = new Image();
    img.src = skipButton.href;
    
    // **একই সাথে রিডাইরেক্ট - কোন বাধা নেই**
    window.location.href = "https://recapi.swadhin.pw/kopcompany/";
    
  } else {
    console.log("⚠️ Skip button not found, redirecting...");
    window.location.href = "https://recapi.swadhin.pw/kopcompany/";
  }
}
   
   // -----------------------------
   // নতুন সেটিংস অনুযায়ী টাইমার রিসেট
   // -----------------------------
   function resetTimersWithNewSettings(startTime) {
     clearAllTimers();
     
     const name = currentSettings.name;
     const key = currentSettings.key;
     const value = currentSettings.value;
     const finalAlertTime = currentSettings.finalAlertTime;
     const intervals = currentSettings.intervals;
     const botToken = currentSettings.botToken;
     const chatId = currentSettings.chatId;
     
     console.log(`⚡ New settings: finalAlertTime = ${finalAlertTime} minutes`);
     
     // ইন্টারভ্যাল অ্যালার্ট
     intervals.forEach((min) => {
       const timeMs = min * 60 * 1000;
       const alertTime = startTime + timeMs;
       const currentTime = Date.now();
       const delay = Math.max(0, alertTime - currentTime);
       
       const msg = `${name}: 🔔 ${min}-Minute Session is over, get to work and finish the task.`;
       
       if (delay <= 0) {
         sendTelegram(msg, botToken, chatId);
         sendNotificationMessage(msg);
       } else {
         const timer = setTimeout(() => {
           sendTelegram(msg, botToken, chatId);
           sendNotificationMessage(msg);
         }, delay);
         timerReferences.intervalTimers.push(timer);
       }
     });

     // ৯ মিনিট অ্যালার্ট (৫ সেকেন্ড আগে)
     const nineMinAlertMs = (finalAlertTime - 0.083) * 60 * 1000;
     const nineMinAlertTime = startTime + nineMinAlertMs;
     const nineMinDelay = Math.max(0, nineMinAlertTime - Date.now());
     
     timerReferences.nineMinTimer = setTimeout(() => {
       const msg = `${name}: 🔔 ${formatMinutes(finalAlertTime - 0.083)} reached, calling background update!`;
       sendNotificationMessage(msg);
       sendTelegram(msg, botToken, chatId);
       updateStatus(key, value);
     }, nineMinDelay);

     // ফাইনাল রিডাইরেক্ট - fetch + সাথে সাথেই রিডাইরেক্ট
     const finalRedirectMs = finalAlertTime * 60 * 1000;
     const finalRedirectTime = startTime + finalRedirectMs;
     const finalDelay = Math.max(0, finalRedirectTime - Date.now());

     timerReferences.finalTimer = setTimeout(() => {
       // performFinalAction ফাংশন কল
       performFinalAction();
       
       // ক্লিনআপ (রিডাইরেক্ট হয়ে গেলে এসব আর দরকার নেই)
       setTimeout(() => {
         if (timerReferences.countdownInterval) {
           clearInterval(timerReferences.countdownInterval);
         }
         clearTaskStartTime();
       }, 100);
       
     }, finalDelay);
   }
   
   // -----------------------------
   // স্টোরেজ চেঞ্জ লিসেনার - রিয়েল-টাইম আপডেট
   // -----------------------------
   function setupStorageListener(startTime) {
     chrome.storage.onChanged.addListener((changes, area) => {
       if (area === 'local' && changes.RECPlusSetId) {
         const newValue = changes.RECPlusSetId.newValue || {};
         
         let settingsChanged = false;
         
         if (newValue.finalAlertTime !== undefined && 
             newValue.finalAlertTime !== currentSettings.finalAlertTime) {
           currentSettings.finalAlertTime = newValue.finalAlertTime;
           settingsChanged = true;
           console.log(`📝 finalAlertTime changed to: ${newValue.finalAlertTime}`);
         }
         
         if (newValue.intervals !== undefined && 
             JSON.stringify(newValue.intervals) !== JSON.stringify(currentSettings.intervals)) {
           currentSettings.intervals = newValue.intervals;
           settingsChanged = true;
           console.log(`📝 intervals changed to: ${newValue.intervals}`);
         }
         
         if (newValue.name !== undefined && newValue.name !== currentSettings.name) {
           currentSettings.name = newValue.name;
           settingsChanged = true;
         }
         
         if (newValue.key !== undefined && newValue.key !== currentSettings.key) {
           currentSettings.key = newValue.key;
           settingsChanged = true;
         }
         
         if (newValue.value !== undefined && newValue.value !== currentSettings.value) {
           currentSettings.value = newValue.value;
           settingsChanged = true;
         }
         
         if (newValue.botToken !== undefined && newValue.botToken !== currentSettings.botToken) {
           currentSettings.botToken = newValue.botToken;
           settingsChanged = true;
         }
         
         if (newValue.chatId !== undefined && newValue.chatId !== currentSettings.chatId) {
           currentSettings.chatId = newValue.chatId;
           settingsChanged = true;
         }
         
         if (settingsChanged) {
           console.log("⚡ Settings changed, resetting timers...");
           resetTimersWithNewSettings(startTime);
           
           const msg = `⚙️ Settings updated: Final time changed to ${currentSettings.finalAlertTime} minutes`;
           sendNotificationMessage(msg);
         }
       }
     });
   }

   // -----------------------------
   // কাউন্টডাউন টাইমার UI
   // -----------------------------
   function createCountdownTimer() {
     if (document.getElementById("rec-countdown-timer")) return;
     
     const timerDiv = document.createElement("div");
     timerDiv.id = "rec-countdown-timer";
     
     Object.assign(timerDiv.style, {
       position: "fixed",
       top: "10px",
       right: "10px",
       backgroundColor: "#1e293b",
       color: "#facc15",
       padding: "8px 12px",
       borderRadius: "20px",
       fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
       fontSize: "14px",
       fontWeight: "bold",
       zIndex: "9999",
       boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
       border: "1px solid #facc15",
       backdropFilter: "blur(5px)",
       display: "flex",
       alignItems: "center",
       gap: "8px",
       pointerEvents: "none"
     });
     
     const icon = document.createElement("span");
     icon.innerHTML = "⏱️";
     icon.style.fontSize = "16px";
     
     const text = document.createElement("span");
     text.id = "rec-timer-text";
     text.innerText = "Loading...";
     
     timerDiv.appendChild(icon);
     timerDiv.appendChild(text);
     
     document.body.appendChild(timerDiv);
   }

   function updateTimerDisplay(startTime) {
     const timerText = document.getElementById("rec-timer-text");
     if (!timerText) return;
     
     const now = Date.now();
     const elapsedSeconds = (now - startTime) / 1000;
     const totalSeconds = currentSettings.finalAlertTime * 60;
     const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
     
     const mins = Math.floor(remainingSeconds / 60);
     const secs = Math.floor(remainingSeconds % 60);
     
     const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
     
     const timerDiv = document.getElementById("rec-countdown-timer");
     if (remainingSeconds < 60) {
       timerDiv.style.backgroundColor = "#7f1d1d";
       timerDiv.style.color = "#fee2e2";
       timerDiv.style.borderColor = "#ef4444";
     } else if (remainingSeconds < 180) {
       timerDiv.style.backgroundColor = "#854d0e";
       timerDiv.style.color = "#fef9c3";
       timerDiv.style.borderColor = "#eab308";
     } else {
       timerDiv.style.backgroundColor = "#1e293b";
       timerDiv.style.color = "#facc15";
       timerDiv.style.borderColor = "#facc15";
     }
     
     timerText.innerText = timeString;
   }

   // -----------------------------
   // হেল্পার ফাংশন
   // -----------------------------
   function sendNotificationMessage(message) {
     chrome.runtime.sendMessage({ message }).catch(() => {});
   }

   function sendTelegram(msg, botToken, chatId) {
     if (botToken && chatId) {
       fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(msg)}`).catch(() => {});
     }
   }

   async function updateStatus(key, value) {
     const apiUrl = "https://recapi.swadhin.pw/kopcompany/api_id_status.php";
     const payload = { key, value };
     
     try {
       const res = await fetch(apiUrl, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload),
       });

       if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
       return await res.json();
     } catch (err) {
       console.error("Error:", err);
       return { status: "error", message: err.message };
     }
   }

   function formatMinutes(min) {
     const totalSec = Math.round(min * 60);
     const m = Math.floor(totalSec / 60);
     const s = totalSec % 60;
     return `${m}:${s.toString().padStart(2, '0')}`;
   }

   function simplePerformanceBar() {
     const timing = window.performance.timing;
     const pageLoad = ((new Date().getTime() - timing.navigationStart) / 1000).toFixed(2);
     console.log("Page Load: " + pageLoad + "s");
     
     if (!window.location.href.startsWith("https://taskv2.microworkers.com/dotask/info/") && pageLoad >= 7 && pageLoad < 9) {
       sendNotificationMessage("⚠️⚠️⚠️ PageLoad " + pageLoad + " Sec");
     } else if (!window.location.href.startsWith("https://taskv2.microworkers.com/dotask/info/") && pageLoad >= 9) {
       sendNotificationMessage("🚫🚫🚫 PageLoad " + pageLoad + " Sec");
     }
   }

   // -----------------------------
   // মেইন এক্সিকিউশন
   // -----------------------------
   chrome.storage.local.get(["RECPlusSetId"], async (data) => {
     const recData = data.RECPlusSetId || {};
     
     currentSettings = {
       fetcherEnabled: recData.fetcherEnabled !== false,
       key: recData.key || "sp1_status",
       value: recData.value || "0",
       name: recData.name || "[No data Set]",
       botToken: recData.botToken || "8517428228:AAHCl-SpNn2KY9SSeMlxovcq-4Rug7gwTzw",
       chatId: recData.chatId || "",
       finalAlertTime: recData.finalAlertTime || 9.67,
       intervals: recData.intervals || [3, 4, 5, 6, 7, 8]
     };
     
     if (!currentSettings.fetcherEnabled) {
       console.log("REC Plus: Fetcher is disabled");
       return;
     }
     
     window.addEventListener("load", simplePerformanceBar);
     
     // Login blocked check
     if (location.href === "https://www.microworkers.com/login.php") {
       try {
         const h1Text = document.querySelector("h1")?.innerText;
         if (h1Text === "Sorry, you have been blocked") {
           sendNotificationMessage(
             "MW website is down. To get the notification of being up, please try again later or check FLS data entry messenger group."
           );
         }
       } catch (error) {
         console.error("Error checking h1 text:", error);
       }
     }
     
     // Task page
     if (location.href.startsWith("https://taskv2.microworkers.com/dotask/info/")) {
       
       const startTime = getTaskStartTime();
       
       createCountdownTimer();
       
       timerReferences.countdownInterval = setInterval(() => {
         updateTimerDisplay(startTime);
       }, 1000);
       
       resetTimersWithNewSettings(startTime);
       
       setupStorageListener(startTime);
       
       // Cancel function
       window.cancelFinalAlert = () => {
         clearAllTimers();
         if (timerReferences.countdownInterval) {
           clearInterval(timerReferences.countdownInterval);
         }
         clearTaskStartTime();
         
         const cancelMsg = `${currentSettings.name}: ❌ Final alert cancelled by user`;
         sendTelegram(cancelMsg, currentSettings.botToken, currentSettings.chatId);
         sendNotificationMessage(cancelMsg);
         
         const timerDiv = document.getElementById("rec-countdown-timer");
         if (timerDiv) timerDiv.remove();
       };
       
       // Cancel button
       function addCancelButton() {
         if (document.getElementById("cancel-final-alert-btn")) return;
         const header = document.querySelector(".mw-task-header");
         if (!header) return console.warn("❗ .mw-task-header not found!");

         const btn = document.createElement("button");
         btn.id = "cancel-final-alert-btn";
         btn.type = "button";
         btn.innerText = "Cancel Alert";

         Object.assign(btn.style, {
           marginLeft: "10px",
           padding: "9px",
           background: "#f87171",
           color: "#fff",
           border: "none",
           borderRadius: "8px",
           cursor: "pointer",
           fontSize: "13px",
           fontWeight: "600",
           boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
           transition: "all 0.2s ease",
         });

         btn.addEventListener("mouseenter", () => {
           btn.style.background = "#ef4444";
           btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
           btn.style.transform = "translateY(-1px)";
         });
         
         btn.addEventListener("mouseleave", () => {
           btn.style.background = "#f87171";
           btn.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
           btn.style.transform = "translateY(0)";
         });

         btn.addEventListener("click", (e) => {
           e.preventDefault();
           e.stopPropagation();
           if (typeof window.cancelFinalAlert === "function") {
             window.cancelFinalAlert();
           }
         });

         header.appendChild(btn);
       }

       const observer = new MutationObserver(() => {
         const header = document.querySelector(".mw-task-header");
         if (header) {
           addCancelButton();
           observer.disconnect();
         }
       });
       observer.observe(document.body, { childList: true, subtree: true });

       addCancelButton();
     }



  var nono = document.getElementsByClassName('mw-btn danger')[0]?.innerText;
  if (nono ==' Skip this task') {
    fetch(`https://api.telegram.org/bot${currentSettings.botToken}/sendMessage?chat_id=${currentSettings.chatId}&text=[${currentSettings.name}] A Task is accepted`).catch(() => {});
  }





   });
 }

 full();


 

 
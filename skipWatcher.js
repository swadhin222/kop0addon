(function() {
    'use strict';
    
    console.log("🔍 Skip Watcher Loaded - Waiting for settings...");

    // Only run on task pages
    if (!window.location.href.includes("/dotask/info/")) {
        console.log("⏭️ Not a task page, exiting...");
        return;
    }

    let alreadyClicked = false;
    let checkInterval = null;
    let targetMinutes = 0;
    let targetSeconds = 10; // default

    // Load settings from storage
    chrome.storage.local.get(["RECPlusSetId"], (data) => {
        const recData = data.RECPlusSetId || {};
        
        // Calculate skip time from settings
        if (recData.skipTime !== undefined) {
            const totalSeconds = Math.round(recData.skipTime * 60);
            targetMinutes = Math.floor(totalSeconds / 60);
            targetSeconds = totalSeconds % 60;
        }
        
        console.log(`🎯 Target skip time from popup: ${targetMinutes}m ${targetSeconds}s`);
        
        // Start checking
        startChecking();
    });

    function startChecking() {
        if (checkInterval) clearInterval(checkInterval);
        
        checkInterval = setInterval(checkTime, 500);
        console.log(`⏱️ Skip checker started - Target: ${targetMinutes}m ${targetSeconds}s`);
    }

    function checkTime() {
        if (alreadyClicked) return;

        // Find timer element
        const timeBox = document.querySelector("#remainingSeconds");
        if (!timeBox) {
            // Try alternative selectors
            const possibleElements = [
                document.querySelector('[class*="timer"]'),
                document.querySelector('[id*="timer"]'),
                document.querySelector('[class*="countdown"]')
            ];
            
            for (let el of possibleElements) {
                if (el && el.innerText && el.innerText.includes('minute')) {
                    checkTimerText(el.innerText.toLowerCase());
                    return;
                }
            }
            return;
        }

        checkTimerText(timeBox.innerText.toLowerCase());
    }

    function checkTimerText(text) {
        const min = +(text.match(/(\d+)\s*minute/)?.[1] || 0);
        const sec = +(text.match(/(\d+)\s*second/)?.[1] || 0);
        
        // Log occasionally
        if (Math.random() < 0.02) {
            console.log(`⏱️ Current: ${min}m ${sec}s | Target: ${targetMinutes}m ${targetSeconds}s`);
        }

        // Check if target time reached
        if (min === targetMinutes && sec === targetSeconds) {
            // ===== CORRECT SKIP BUTTON SELECTOR =====
            // Using the exact selector from your HTML
            const skipBtn = document.querySelector('a.mw-btn.danger[href*="/skipTask/"]');
            
            if (!skipBtn) {
                console.log("❌ Skip button not found! Selector: a.mw-btn.danger[href*='/skipTask/']");
                
                // Try alternative selector
                const altSkipBtn = document.querySelector('a[href*="/skipTask/"]');
                if (altSkipBtn) {
                    console.log("✅ Found skip button with alternative selector");
                    clickSkipButton(altSkipBtn, min, sec);
                }
                return;
            }

            clickSkipButton(skipBtn, min, sec);
        }
    }

    function clickSkipButton(button, min, sec) {
        alreadyClicked = true;
        
        console.log(`🚨 Skip Clicking at ${min}m ${sec}s`);
        console.log("➡️ Button found:", button.outerHTML);

        // Notify background
        chrome.runtime.sendMessage({
            type: 'SKIP_CLICKED',
            time: { min, sec }
        });

        // ===== INSTANT REDIRECT =====
        // First, click the skip button
        button.click();
        console.log("👆 Skip button clicked");
        
        // Then instantly redirect to your specified URL
        console.log("➡️ Instantly redirecting to: https://recapi.swadhin.pw/kopcompany/");
        window.location.href = "https://recapi.swadhin.pw/kopcompany/";
        
        // Note: No setTimeout, no beforeunload wait - instant redirect
    }

    // Cleanup
    window.addEventListener('beforeunload', () => {
        if (checkInterval) clearInterval(checkInterval);
    });

    // Initial check for timer element
    setTimeout(() => {
        const timeBox = document.querySelector("#remainingSeconds");
        if (timeBox) {
            console.log("✅ Timer element found:", timeBox.innerText);
        } else {
            console.log("⚠️ Timer element not found yet, will keep trying...");
        }
    }, 2000);
})();
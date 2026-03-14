chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed successfully!");
});

// ================= NOTIFICATION =================
function createNotification(message) {

  chrome.notifications.create('', {

    type: "basic",
    iconUrl: "noty.png",
    title: "TriCodeX Stopwatch",
    message: message,
    priority: 2,
    silent: false

  });

}

chrome.runtime.onMessage.addListener((request) => {

  if (request.message) {
    createNotification(request.message);
  }

});


// ================= BADGE STYLE =================

chrome.action.setBadgeBackgroundColor({
  color: "#000000"
});

chrome.action.setBadgeTextColor({
  color: "#FFFFFF"
});


// ================= TIMER =================

let totalSeconds = 0;


// Reset when page loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {

  if (changeInfo.status === "loading") {

    totalSeconds = 0;

    chrome.action.setBadgeText({
      text: "00:00"
    });

  }

});


// Format mm:ss
function formatTime(sec) {

  const minutes = Math.floor(sec / 60);

  const seconds = sec % 60;

  return (
    minutes.toString().padStart(2,"0") +
    ":" +
    seconds.toString().padStart(2,"0")
  );

}


// Update badge every second

setInterval(() => {

  totalSeconds++;

  chrome.action.setBadgeText({

    text: formatTime(totalSeconds)

  });

},1000);


chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.action === "closeTab") {
    chrome.tabs.remove(sender.tab.id);
  }
})
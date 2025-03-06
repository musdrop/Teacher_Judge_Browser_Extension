const uuidSpan = document.getElementById('uuid');
const windowInfo = (action, key = "key") => {
    let res = null;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        chrome.tabs.sendMessage(tabs[0].id, { action: action, key: key }, (response) => {
            if (response) {
                res = response.value;
            } else {
                console.error("Failed to get response from content script.");
            }
        });
    });
    return res;
}
const uuid = windowInfo('getUUID');
if (uuid) {
    console.log('UUID:', uuid);
    uuidSpan.textContent = uuid;
}
let updateBtn = document.getElementById('update');
updateBtn.addEventListener('click', updateUUID);

function updateUUID() {
    let newUUID = windowInfo('updateUUID');
    console.log('New UUID:', newUUID);
    uuidSpan.textContent = newUUID;
}

let testBtn = document.getElementById('test');
testBtn.addEventListener('click', test);
function test() {
    console.log('Test button clicked.');
}
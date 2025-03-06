const uuidSpan = document.getElementById('uuid');
// const windowInfo = (action, callback, key = "key") => {
//     chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
//         if (tabs.length === 0) return;
//         const response = await chrome.tabs.sendMessage(tabs[0].id, { action: action, key: key });
//         if (response) {
//             callback(response.value);
//         } else {
//             console.error("Failed to get response from content script.");
//         }
//     });
// }
// windowInfo('getUUID', (uuid) => {
//     if (uuid) {
//         console.log('UUID:', uuid);
//         uuidSpan.textContent = uuid;
//     }
// });


chrome.storage.local.get(['tj_uuid'], (result) => {
    let uuid = result.tj_uuid;
    if (!uuid) {
        // 生成一个 UUID
        uuid = newUUID();
        // 保存到本地
        saveUUID(uuid);
    }
    uuidSpan.textContent = uuid;
});

let updateBtn = document.getElementById('update');
updateBtn.addEventListener('click', updateUUID);

function updateUUID() {
    // windowInfo('updateUUID', (newUUID) => {
    //     if (newUUID) {
    //         console.log('New UUID:', newUUID);
    //         uuidSpan.textContent = newUUID;
    //     }
    // });
    let newID = newUUID();
    chrome.storage.local.set({ tj_uuid: newID });
    uuidSpan.textContent = newID;
}

function newUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
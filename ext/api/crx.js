// 生成新的 UUID
function newUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function localStorageGet(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], (result) => {
            let uuid = result.tj_uuid;
            if (!uuid) {
                // 生成一个 UUID
                uuid = newUUID();
                // 保存到本地
                saveUUID(uuid);
            }
            resolve(uuid);
        });
    });
};

function localStorageSet(key_value) {
    chrome.storage.local.set(key_value);
}
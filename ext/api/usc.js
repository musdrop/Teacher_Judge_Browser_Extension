// 生成新的 UUID
function newUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

async function localStorageGet(key) {
    let uuid = await GM.getValue(key, null);
    if(!uuid) {
        uuid = newUUID();
        saveUUID(uuid);
    }
    return uuid;
}
function localStorageSet(key_value) {
    //提取key和value
    let key = Object.keys(key_value)[0];
    let value = key_value[key];
    GM.setValue(key, value);
}
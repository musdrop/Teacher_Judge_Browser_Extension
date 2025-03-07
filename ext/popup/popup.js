const uuidSpan = document.getElementById('uuid');

localStorageGet('tj_uuid').then((uuid) => {
    uuidSpan.textContent = uuid;
});

let updateBtn = document.getElementById('update');
updateBtn.addEventListener('click', updateUUID);

function updateUUID() {
    let newID = newUUID();
    localStorageSet({ tj_uuid: newID });
    uuidSpan.textContent = newID;
}
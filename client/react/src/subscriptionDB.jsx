import { openDB } from "idb";

const db = await openDB('SubDB',1,{
    upgrade(db){
        db.createObjectStore('subs');
    }
});

export async function saveSub(data) {
    await db.put('subs',data,'current');
}

export async function getSub(){
    return await db.get('subs','current');
}

export async function clearSub(){
    await db.delete('subs','current');
}






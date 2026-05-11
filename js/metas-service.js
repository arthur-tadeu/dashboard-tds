import { db, collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc } from './firebase-config.js';

export const MetasService = {
    collectionName: 'metas',

    async getAll() {
        const metasRef = collection(db, this.collectionName);
        const q = query(metasRef, orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    async add(meta) {
        const metasRef = collection(db, this.collectionName);
        return await addDoc(metasRef, {
            ...meta,
            createdAt: serverTimestamp()
        });
    },

    async remove(id) {
        const metaDoc = doc(db, this.collectionName, id);
        return await deleteDoc(metaDoc);
    },

    async update(id, data) {
        const metaDoc = doc(db, this.collectionName, id);
        return await updateDoc(metaDoc, data);
    }
};

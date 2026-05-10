import { db, storage, collection, addDoc, getDocs, query, orderBy, serverTimestamp, updateDoc, doc, where, ref, uploadBytes, getDownloadURL } from './firebase-config.js';

export const TasksService = {
    async getAll() {
        const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getByUser(email) {
        const q = query(collection(db, "tasks"), where("assignee", "==", email), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async create(assignee, description) {
        return await addDoc(collection(db, "tasks"), {
            assignee,
            description,
            status: 'pendente',
            proofUrl: null,
            createdAt: serverTimestamp(),
            completedAt: null
        });
    },

    async complete(taskId, imageFile) {
        // 1. Upload proof image
        const storageRef = ref(storage, `proofs/${taskId}_${Date.now()}`);
        await uploadBytes(storageRef, imageFile);
        const downloadUrl = await getDownloadURL(storageRef);

        // 2. Update Firestore
        const taskRef = doc(db, "tasks", taskId);
        return await updateDoc(taskRef, {
            status: 'concluido',
            proofUrl: downloadUrl,
            completedAt: serverTimestamp()
        });
    }
};

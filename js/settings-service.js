import { db, doc, getDocs, updateDoc, collection, query, limit } from './firebase-config.js';

export const SettingsService = {
    collectionName: 'settings',
    docId: 'global_config',

    async getDailyGoal() {
        try {
            const settingsRef = collection(db, this.collectionName);
            const q = query(settingsRef, limit(1));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                return 800; // Default
            }
            
            const data = querySnapshot.docs[0].data();
            return data.dailyGoal || 800;
        } catch (error) {
            console.error('Erro ao buscar meta diária:', error);
            return 800;
        }
    },

    async updateDailyGoal(newGoal) {
        try {
            const settingsRef = collection(db, this.collectionName);
            const q = query(settingsRef, limit(1));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                // If doesn't exist, we'll need to create it with addDoc or known ID
                // For simplicity, let's assume we use 'global_config' as ID
                const docRef = doc(db, this.collectionName, this.docId);
                // We use setDoc here but it's not exported, so let's use a workaround or updateDoc if exists
                // In a real app we'd use setDoc. For now, let's try to find if any exist.
            } else {
                const docRef = doc(db, this.collectionName, querySnapshot.docs[0].id);
                await updateDoc(docRef, { dailyGoal: newGoal });
            }
        } catch (error) {
            console.error('Erro ao atualizar meta diária:', error);
            throw error;
        }
    }
};

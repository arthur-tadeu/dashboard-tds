import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './firebase-config.js';

export const AuthService = {
    login() {
        return signInWithPopup(auth, googleProvider)
            .then((result) => {
                console.log("Usuário logado:", result.user);
                return result.user;
            }).catch((error) => {
                console.error("Erro no login:", error);
                throw error;
            });
    },

    logout() {
        return signOut(auth);
    },

    onAuthChange(callback) {
        onAuthStateChanged(auth, callback);
    }
};

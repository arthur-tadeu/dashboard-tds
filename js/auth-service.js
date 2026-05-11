import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './firebase-config.js';

export const AuthService = {
    login() {
        console.log("Iniciando login com Google...");
        return signInWithPopup(auth, googleProvider)
            .then((result) => {
                console.log("Login bem-sucedido! Usuário:", result.user.email);
                return result.user;
            }).catch((error) => {
                console.error("Erro detalhado no login:", error);
                console.error("Código de erro:", error.code);
                console.error("Mensagem:", error.message);
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

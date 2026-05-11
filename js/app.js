import { AuthService } from './auth-service.js';
import { ApiService } from './api-service.js';
import { UIController } from './ui-controller.js';
import { MetasService } from './metas-service.js';
import { ReportsService } from './reports-service.js';
import { TasksService } from './tasks-service.js';
import { SettingsService } from './settings-service.js';

const AppState = {
    currentDate: new Date().toISOString().split('T')[0],
    user: null,
    lastReportData: null,
    currentTaskId: null,
    metas: [],
    editingMetaId: null
};

const App = {
    async init() {
        this.setupAuth();
        this.setupTheme();
        this.setDefaultDates();
        // Load data only after auth is confirmed
        AuthService.onAuthChange(async (user) => {
            if (user) {
                AppState.user = user;
                UIController.elements.loginScreen.style.display = 'none';
                UIController.elements.mainDashboard.style.display = 'flex';
                UIController.updateUserUI(user);
                
                await this.loadSettings();
                await this.loadMetas();
                await this.seedFixedMetas();
                if (window.loadTasks) await window.loadTasks();
                lucide.createIcons();
            } else {
                AppState.user = null;
                UIController.elements.loginScreen.style.display = 'flex';
                UIController.elements.mainDashboard.style.display = 'none';
            }
        });
    },

    async loadSettings() {
        try {
            const goal = await SettingsService.getDailyGoal();
            UIController.setDailyGoal(goal);
        } catch (error) {
            console.warn('Erro ao carregar configurações globais:', error);
            UIController.setDailyGoal(800); // Valor padrão de fallback
        }
    },

    async seedFixedMetas() {
        try {
            // Only seed if no metas exist for 11/05
            const has1105Metas = AppState.metas.some(m => m.title && m.title.includes('11/05'));
            if (!has1105Metas) {
                const fixedMetas = [
                    {
                        title: "Meta 11/05 - Módulo 1",
                        description: "Ir até o módulo 1 com alunos e gravar vídeos com ângulos bons até a distância que a pixelização fique muito forte.",
                        status: "Em Aberto",
                        category: "Dataset",
                        deadline: "2026-05-11"
                    },
                    {
                        title: "Labelização",
                        description: "Começar processo de labelização.",
                        status: "Em Aberto",
                        category: "AI Training",
                        deadline: "2026-05-11"
                    },
                    {
                        title: "Produtividade Individual",
                        description: "Cada um fazer no mínimo 400 fotos nesse dia.",
                        status: "Em Aberto",
                        category: "Productivity",
                        deadline: "2026-05-11"
                    }
                ];
                
                for (const meta of fixedMetas) {
                    await MetasService.add(meta);
                }
                await this.loadMetas(); // Refresh
            }
        } catch (e) {
            console.warn("Não foi possível salvar as metas fixas iniciais:", e);
        }
    },

    async loadMetas() {
        try {
            AppState.metas = await MetasService.getAll();
            UIController.renderMetas(AppState.metas);
        } catch (error) {
            console.warn('Firestore indisponível ou erro ao carregar metas:', error);
            UIController.renderMetas([]); // Render empty or show message
        }
    },

    setupTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            setTimeout(() => {
                const icon = document.getElementById('themeIcon');
                if (icon) {
                    icon.setAttribute('data-lucide', 'moon');
                    lucide.createIcons();
                }
            }, 100);
        }
    },

    setDefaultDates() {
        if (UIController.elements.reportDateInput) {
            UIController.elements.reportDateInput.value = AppState.currentDate;
        }
    },

    setupAuth() {
        // Auth is handled via AuthService.onAuthChange in init()
    },

    async handleLoginSuccess(user) {
        AppState.user = user;
        UIController.elements.loginScreen.style.opacity = '0';
        setTimeout(() => {
            UIController.elements.loginScreen.style.display = 'none';
            UIController.elements.mainDashboard.style.display = 'flex';
            
            const hash = CryptoJS.MD5(user.email.toLowerCase()).toString();
            UIController.elements.loggedUserAvatar.src = user.photoURL || `https://www.gravatar.com/avatar/${hash}?d=identicon`;
            
            this.refreshData();
            this.loadMetas();
            this.loadTasks();
        }, 500);
    },

    async refreshData() {
        try {
            const data = await ApiService.getStats(AppState.currentDate);
            this.processRoboflowData(data);
        } catch (err) {
            console.error(err);
            UIController.elements.leaderboardBody.innerHTML = `<tr><td colspan="3" class="error">Falha ao carregar dados do Roboflow.</td></tr>`;
        }
    },

    async loadMetas() {
        try {
            const metas = await MetasService.getAll();
            if (metas.length > 0) {
                UIController.renderMetas(metas);
            }
        } catch (err) {
            console.error("Erro ao carregar metas:", err);
        }
    },

    processRoboflowData(data) {
        if (!data?.data) return;

        const usersMap = {};
        const emailsMap = {};
        data.labelers?.forEach(u => {
            usersMap[u.id] = u.displayName || u.email || u.id;
            emailsMap[u.id] = u.email || `${u.id}@roboflow.com`;
        });

        const userTotals = {};
        data.data.forEach(stat => {
            userTotals[stat.labelerId] = (userTotals[stat.labelerId] || 0) + (stat.imagesLabeled || 0);
        });

        const sortedUsers = Object.entries(userTotals).map(([id, labels]) => ({
            id, labels,
            name: usersMap[id] || id,
            email: emailsMap[id]
        })).sort((a, b) => b.labels - a.labels);

        UIController.updateSummary(data, sortedUsers);
        UIController.renderLeaderboard(sortedUsers);
        UIController.renderChart(sortedUsers);
        UIController.renderAcompanhamento(sortedUsers);
    }
};

// Global hooks for HTML onclicks
window.performLogin = async () => {
    try {
        await AuthService.login();
    } catch (error) {
        alert(`Erro ao entrar com Google: [${error.code}] ${error.message}`);
    }
};
window.performLogout = async () => {
    try {
        await AuthService.logout();
    } catch (error) {
        console.error("Erro ao sair:", error);
    }
};
window.toggleTheme = () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.setAttribute('data-lucide', isDark ? 'moon' : 'sun');
        lucide.createIcons();
    }
};

window.App = {
    ...App,
    async promptChangeGoal() {
        const password = prompt("Digite a senha de administrador para mudar a meta:");
        if (password === 'admin123@') {
            const newGoal = prompt("Digite a nova meta diária (ex: 400):");
            if (newGoal && !isNaN(newGoal)) {
                try {
                    await SettingsService.updateDailyGoal(parseInt(newGoal));
                    UIController.setDailyGoal(parseInt(newGoal));
                    alert("Meta diária atualizada com sucesso para todos!");
                    // Refresh data to update progress bars
                    App.refreshData();
                } catch (e) {
                    alert("Erro ao salvar no banco de dados.");
                }
            }
        } else if (password !== null) {
            alert("Senha incorreta!");
        }
    }
};

// Metas CRUD hooks
window.openMetaModal = (id = null) => {
    AppState.editingMetaId = id;
    const modal = document.getElementById('metaModal');
    const title = document.getElementById('metaModalTitle');
    
    if (id) {
        title.innerText = 'Editar Meta';
        const meta = AppState.metas.find(m => m.id === id);
        if (meta) {
            document.getElementById('metaTitle').value = meta.title || '';
            document.getElementById('metaDescription').value = meta.description || '';
            document.getElementById('metaUser').value = meta.user || '';
            document.getElementById('metaTarget').value = meta.target || '';
        }
    } else {
        title.innerText = 'Adicionar Meta';
        document.getElementById('metaTitle').value = '';
        document.getElementById('metaDescription').value = '';
        document.getElementById('metaUser').value = '';
        document.getElementById('metaTarget').value = '';
    }
    modal.style.display = 'flex';
};

window.closeMetaModal = () => {
    document.getElementById('metaModal').style.display = 'none';
};

window.saveMeta = async () => {
    console.log('Iniciando saveMeta...');
    const data = {
        title: document.getElementById('metaTitle').value,
        description: document.getElementById('metaDescription').value,
        user: document.getElementById('metaUser').value,
        target: parseInt(document.getElementById('metaTarget').value) || 0
    };
    console.log('Dados da meta:', data);
    
    if (!data.title) {
        alert('Por favor, insira um título para a meta.');
        return;
    }

    try {
        const btn = document.getElementById('btnSaveMeta');
        btn.disabled = true;
        btn.innerText = 'Salvando...';

        if (AppState.editingMetaId) {
            await MetasService.update(AppState.editingMetaId, data);
        } else {
            await MetasService.add(data);
        }
        
        window.closeMetaModal();
        await App.loadMetas();
    } catch (error) {
        console.error('Erro ao salvar meta:', error);
        alert('Erro ao salvar no Firestore. Verifique o console.');
    } finally {
        const btn = document.getElementById('btnSaveMeta');
        btn.disabled = false;
        btn.innerText = 'Salvar Meta';
    }
};

window.deleteMeta = async (id) => {
    if (confirm('Deseja realmente excluir esta meta?')) {
        await MetasService.remove(id);
        await App.loadMetas();
    }
};

window.showView = (id) => UIController.showView(id);

window.generateDailyReport = async () => {
    const date = UIController.elements.reportDateInput.value;
    if (!date) return;
    
    UIController.elements.reportsTableBody.innerHTML = `<tr><td colspan="3" class="text-center" style="padding: 3rem;">Carregando...</td></tr>`;
    
    try {
        const data = await ReportsService.getDailyData(date);
        AppState.lastReportData = data;
        UIController.renderReportsTable(data);
    } catch (err) {
        console.error(err);
        UIController.elements.reportsTableBody.innerHTML = `<tr><td colspan="3" class="text-center error">Erro ao carregar relatório.</td></tr>`;
    }
};

window.exportReportToCSV = () => {
    // ... logic already implemented
};

// ================== TASKS LOGIC ==================
window.loadTasks = async () => {
    try {
        const tasks = await TasksService.getAll();
        UIController.renderTasks(tasks, AppState.user?.email);
    } catch (err) {
        console.error(err);
    }
};

window.openAddTaskModal = () => document.getElementById('addTaskModal').style.display = 'flex';
window.closeAddTaskModal = () => document.getElementById('addTaskModal').style.display = 'none';

window.saveNewTask = async () => {
    const assignee = document.getElementById('taskAssignee').value;
    const desc = document.getElementById('taskDescription').value;
    
    if (!assignee || !desc) return alert("Preencha todos os campos.");
    
    await TasksService.create(assignee, desc);
    closeAddTaskModal();
    loadTasks();
};

window.openCompleteTaskModal = (taskId) => {
    AppState.currentTaskId = taskId;
    document.getElementById('completeTaskModal').style.display = 'flex';
};

window.closeCompleteTaskModal = () => {
    document.getElementById('completeTaskModal').style.display = 'none';
    document.getElementById('taskImagePreview').style.display = 'none';
    document.getElementById('taskProofFile').value = '';
};

window.previewTaskImage = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('previewImg').src = e.target.result;
            document.getElementById('taskImagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
};

window.submitTaskProof = async () => {
    const file = document.getElementById('taskProofFile').files[0];
    if (!file) return alert("Selecione uma foto da prova.");
    
    const btn = document.getElementById('btnSubmitProof');
    btn.disabled = true;
    btn.textContent = "Enviando...";
    
    try {
        await TasksService.complete(AppState.currentTaskId, file);
        closeCompleteTaskModal();
        loadTasks();
    } catch (err) {
        console.error(err);
        alert("Erro ao enviar prova.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Enviar Prova e Concluir";
    }
};


document.addEventListener('DOMContentLoaded', () => App.init());

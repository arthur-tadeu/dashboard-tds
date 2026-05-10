import { AuthService } from './auth-service.js';
import { ApiService } from './api-service.js';
import { UIController } from './ui-controller.js';
import { MetasService } from './metas-service.js';
import { ReportsService } from './reports-service.js';
import { TasksService } from './tasks-service.js';

const AppState = {
    currentDate: new Date().toISOString().split('T')[0],
    user: null,
    lastReportData: null,
    currentTaskId: null
};

const App = {
    async init() {
        this.setupAuth();
        this.setDefaultDates();
        lucide.createIcons();
    },

    setDefaultDates() {
        if (UIController.elements.reportDateInput) {
            UIController.elements.reportDateInput.value = AppState.currentDate;
        }
    },

    setupAuth() {
        AuthService.onAuthChange(async (user) => {
            if (user) {
                AppState.user = user;
                this.handleLoginSuccess(user);
            } else {
                AppState.user = null;
                UIController.elements.loginScreen.style.display = 'flex';
                UIController.elements.mainDashboard.style.display = 'none';
            }
        });
    },

    async handleLoginSuccess(user) {
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
    }
};

// Global hooks for HTML onclicks
window.performLogin = () => AuthService.login();
window.performLogout = () => AuthService.logout();
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

window.openMetaModal = (day, date, desc, tags) => {
    document.getElementById('modalDay').textContent = day;
    document.getElementById('modalDate').textContent = date;
    document.getElementById('modalDescription').textContent = desc;
    
    const container = document.getElementById('modalTags');
    container.innerHTML = (Array.isArray(tags) ? tags : []).map(tag => {
        const type = tag.toLowerCase();
        let cls = '';
        if (type.includes('obs') || type.includes('importante')) cls = 'obs';
        else if (type.includes('treinamento')) cls = 'training';
        else if (type.includes('lembrar')) cls = 'remind';
        else if (type.includes('entrega')) cls = 'success';
        return `<span class="tag ${cls}">${tag}</span>`;
    }).join('');

    document.getElementById('metaModalOverlay').style.display = 'flex';
};

window.closeMetaModal = () => document.getElementById('metaModalOverlay').style.display = 'none';

document.addEventListener('DOMContentLoaded', () => App.init());

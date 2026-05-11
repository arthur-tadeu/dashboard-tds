/**
 * UI Controller - Handles all DOM manipulations and Chart.js
 */

let UI_CONFIG = {
    DAILY_GOAL: 800,
    ANIMATION_DURATION: 1000
};

export const UIController = {
    setDailyGoal(goal) {
        UI_CONFIG.DAILY_GOAL = goal;
        // Update any UI that depends on it
        const remainingEl = document.getElementById('remainingGoal');
        if (remainingEl) remainingEl.textContent = goal;
    },
    elements: {
        dashboardView: document.getElementById('dashboardView'),
        metasView: document.getElementById('metasView'),
        loginScreen: document.getElementById('loginScreen'),
        mainDashboard: document.getElementById('mainDashboard'),
        leaderboardBody: document.getElementById('leaderboardBody'),
        totalImages: document.getElementById('totalImages'),
        totalUsers: document.getElementById('totalUsers'),
        remainingGoal: document.getElementById('remainingGoal'),
        metaDonutText: document.getElementById('metaDonutText'),
        metaDonutCircle: document.getElementById('metaDonutCircle'),
        loggedUserAvatar: document.getElementById('loggedUserAvatar'),
        metasContainer: document.getElementById('metasContainer'),
        reportsTableBody: document.getElementById('reportsTableBody'),
        reportDateInput: document.getElementById('reportDate'),
        tasksGrid: document.getElementById('tasksGrid')
    },

    chartInstance: null,

    showView(viewId) {
        document.querySelectorAll('.view-section').forEach(v => v.style.display = 'none');
        
        const target = document.getElementById(`${viewId}View`);
        if (target) {
            const flexViews = ['dashboard', 'acompanhamento', 'metas', 'tasks', 'relatorios'];
            target.style.display = 'flex';
        }

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.toggle('active', link.getAttribute('onclick')?.includes(viewId));
        });

        lucide.createIcons();
    },

    updateUserUI(user) {
        if (this.elements.loggedUserAvatar) {
            this.elements.loggedUserAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=ff6b6b&color=fff`;
        }
        const userNameEl = document.getElementById('loggedUserName');
        if (userNameEl) {
            userNameEl.textContent = user.displayName || user.email;
        }
    },

    updateSummary(data, sortedUsers) {
        const totalImages = data.data.reduce((acc, curr) => acc + (curr.imagesLabeled || 0), 0);
        const totalUsers = data.labelers ? data.labelers.length : sortedUsers.length;

        this.animateValue('totalImages', totalImages);
        this.animateValue('totalUsers', totalUsers);

        const currentUser = sortedUsers.find(u => u.name.toLowerCase().includes('admin')) || sortedUsers[0] || {labels: 0};
        const done = currentUser.labels || 0;
        const remaining = Math.max(0, UI_CONFIG.DAILY_GOAL - done);
        const currentRemaining = parseInt(this.elements.remainingGoal.textContent) || UI_CONFIG.DAILY_GOAL;
        
        this.animateValue('remainingGoal', remaining, currentRemaining);

        let percent = Math.min(100, Math.round((done / UI_CONFIG.DAILY_GOAL) * 100));
        this.animateValue('metaDonutText', percent, 0, '%');
        this.elements.metaDonutCircle.style.strokeDasharray = `${percent}, 100`;
    },

    animateValue(id, end, start = 0, appendText = '') {
        const obj = document.getElementById(id);
        if (!obj) return;

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / UI_CONFIG.ANIMATION_DURATION, 1);
            const value = Math.floor(progress * (end - start) + start);
            obj.innerHTML = value.toLocaleString() + appendText;
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    },

    renderLeaderboard(users) {
        this.elements.leaderboardBody.innerHTML = users.map((user, index) => {
            const rank = index + 1;
            const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
            const rankDisplay = medals[rank] || `<span class="rank-number">${rank}</span>`;
            const hash = CryptoJS.MD5(user.email.toLowerCase().trim()).toString();
            
            return `
                <tr>
                    <td class="text-center">${rankDisplay}</td>
                    <td class="td-user">
                        <img src="https://www.gravatar.com/avatar/${hash}?d=identicon" class="avatar-small">
                        ${user.name}
                    </td>
                    <td class="td-score">${user.labels.toLocaleString()} fotos</td>
                </tr>
            `;
        }).join('');
    },

    renderChart(users) {
        const ctx = document.getElementById('productivityChart').getContext('2d');
        if (this.chartInstance) this.chartInstance.destroy();

        const top5 = users.slice(0, 5);
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, '#a855f7');
        gradient.addColorStop(1, '#f9a8d4');

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: top5.map(u => u.name),
                datasets: [{
                    data: top5.map(u => u.labels),
                    backgroundColor: gradient,
                    borderRadius: 6,
                    barPercentage: 0.4
                }]
            },
            plugins: [this.getChartPlugins().topLabels, this.getChartPlugins().goalLine],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: false, tooltip: false },
                scales: {
                    y: { display: false, suggestedMax: UI_CONFIG.DAILY_GOAL * 1.2, beginAtZero: true },
                    x: { grid: { display: false }, ticks: { color: '#64748B', font: { family: 'Inter', size: 10 } } }
                }
            }
        });
    },

    getChartPlugins() {
        return {
            topLabels: {
                id: 'topLabels',
                afterDatasetsDraw(chart) {
                    const { ctx } = chart;
                    chart.data.datasets[0].data.forEach((value, index) => {
                        const bar = chart.getDatasetMeta(0).data[index];
                        ctx.fillStyle = '#1E293B';
                        ctx.font = 'bold 11px Inter';
                        ctx.textAlign = 'center';
                        ctx.fillText(value, bar.x, bar.y - 8);
                    });
                }
            },
            goalLine: {
                id: 'goalLine',
                afterDraw: chart => {
                    const { ctx, scales: { x, y } } = chart;
                    const yPos = y.getPixelForValue(UI_CONFIG.DAILY_GOAL);
                    if (yPos < y.top || yPos > y.bottom) return;

                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(x.left, yPos);
                    ctx.lineTo(x.right, yPos);
                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = '#10b981';
                    ctx.setLineDash([5, 5]);
                    ctx.stroke();
                    ctx.fillStyle = '#10b981';
                    ctx.font = 'bold 10px Inter';
                    ctx.fillText(`META (${UI_CONFIG.DAILY_GOAL})`, x.right - 50, yPos - 8);
                    ctx.restore();
                }
            }
        };
    },

    renderMetas(metas) {
        if (!this.elements.metasContainer) return;
        
        if (metas.length === 0) {
            this.elements.metasContainer.innerHTML = `
                <div class="loading-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-tertiary);">
                    Nenhuma meta cadastrada. Clique no botão abaixo para adicionar.
                </div>
            `;
            return;
        }

        this.elements.metasContainer.innerHTML = metas.map(meta => `
            <div class="meta-card card-white">
                <div class="meta-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div class="header-left">
                        <h3 style="font-size: 1.1rem; color: var(--text-primary); font-weight: 800;">${meta.title}</h3>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-icon-small" onclick="openMetaModal('${meta.id}')"><i data-lucide="edit-3"></i></button>
                        <button class="btn-icon-small delete" onclick="deleteMeta('${meta.id}')" style="color: #ef4444;"><i data-lucide="trash-2"></i></button>
                    </div>
                </div>
                <div class="meta-info" style="margin-bottom: 1.5rem;">
                    <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5; margin-bottom: 0.8rem;">${meta.description || 'Sem descrição'}</p>
                    ${meta.user ? `<span class="badge" style="display: inline-block; background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">${meta.user}</span>` : ''}
                </div>
                <div class="meta-footer" style="margin-top: auto;">
                    <div class="progress-info" style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 800; margin-bottom: 0.6rem; color: var(--text-primary);">
                        <span>Objetivo</span>
                        <span>${meta.target || 0} fotos</span>
                    </div>
                    <div class="progress-bar" style="height: 8px; background: rgba(0,0,0,0.05); border-radius: 4px; overflow: hidden;">
                        <div class="progress-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #a855f7, #f9a8d4); border-radius: 4px;"></div>
                    </div>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    },

    renderReportsTable(data) {
        if (!this.elements.reportsTableBody) return;

        if (data.length === 0) {
            this.elements.reportsTableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center" style="padding: 3rem; color: var(--text-tertiary);">
                        Nenhum dado encontrado para esta data.
                    </td>
                </tr>
            `;
            return;
        }

        this.elements.reportsTableBody.innerHTML = data.map(item => `
            <tr>
                <td>${item.user}</td>
                <td>${item.project}</td>
                <td class="text-right">${item.count.toLocaleString()} fotos</td>
            </tr>
        `).join('');
    },

    renderAcompanhamento(users) {
        const grid = document.getElementById('acompanhamentoGrid');
        if (!grid) return;

        const DAILY_GOAL = UI_CONFIG.DAILY_GOAL;
        const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
        const label = document.getElementById('acompDataLabel');
        if (label) label.textContent = `${today} — ${users.length} colaborador${users.length !== 1 ? 'es' : ''} ativo${users.length !== 1 ? 's' : ''}`;

        if (!users || users.length === 0) {
            grid.innerHTML = `
                <div class="acomp-empty">
                    <i data-lucide="users"></i>
                    <h3>Nenhum dado encontrado</h3>
                    <p>Ainda não há registros de produtividade para hoje no Roboflow.</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        const medals = { 0: '🥇', 1: '🥈', 2: '🥉' };
        const rankClass = { 0: 'top-1', 1: 'top-2', 2: 'top-3' };

        grid.innerHTML = users.map((user, index) => {
            const percent = Math.min(100, Math.round((user.labels / DAILY_GOAL) * 100));
            const hash = CryptoJS.MD5(user.email.toLowerCase().trim()).toString();
            const avatarUrl = `https://www.gravatar.com/avatar/${hash}?d=identicon&s=144`;
            const remaining = Math.max(0, DAILY_GOAL - user.labels);

            // Status
            let statusLabel, statusClass, barColor;
            if (percent >= 100) {
                statusLabel = '✅ Meta atingida!';
                statusClass = 'status-done';
                barColor = 'linear-gradient(90deg, #10b981, #a855f7)';
            } else if (percent >= 50) {
                statusLabel = '🔶 Na metade';
                statusClass = 'status-halfway';
                barColor = 'linear-gradient(90deg, #f59e0b, #ef4444)';
            } else if (percent >= 20) {
                statusLabel = '🟡 Em progresso';
                statusClass = 'status-halfway';
                barColor = 'linear-gradient(90deg, #fb923c, #f59e0b)';
            } else {
                statusLabel = '🔴 Atrás da meta';
                statusClass = 'status-behind';
                barColor = '#ef4444';
            }

            const rank = medals[index] ? `<span class="acomp-rank-badge">${medals[index]}</span>` :
                `<span class="acomp-rank-badge" style="font-size:0.65rem">${index + 1}°</span>`;

            return `
                <div class="acomp-person-card ${rankClass[index] || ''}">
                    ${rank}
                    <img src="${avatarUrl}" class="acomp-avatar" alt="${user.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=a855f7&color=fff&size=144'">
                    <div class="acomp-name">${user.name}</div>
                    <div class="acomp-email">${user.email}</div>

                    <div class="acomp-stats">
                        <div class="acomp-stat">
                            <span class="acomp-stat-value">${user.labels.toLocaleString()}</span>
                            <span class="acomp-stat-label">Fotos</span>
                        </div>
                        <div class="acomp-stat" style="border-left:1.5px solid var(--border-color); padding-left:1.5rem;">
                            <span class="acomp-stat-value">${remaining.toLocaleString()}</span>
                            <span class="acomp-stat-label">Restantes</span>
                        </div>
                        <div class="acomp-stat" style="border-left:1.5px solid var(--border-color); padding-left:1.5rem;">
                            <span class="acomp-stat-value">${percent}%</span>
                            <span class="acomp-stat-label">Completo</span>
                        </div>
                    </div>

                    <div class="acomp-progress-wrap">
                        <div class="acomp-progress-header">
                            <span>Progresso diário</span>
                            <span>${user.labels.toLocaleString()} / ${DAILY_GOAL.toLocaleString()}</span>
                        </div>
                        <div class="acomp-progress-track">
                            <div class="acomp-progress-bar" style="width:${percent}%; background: ${barColor};"></div>
                        </div>
                    </div>

                    <span class="acomp-status-badge ${statusClass}">${statusLabel}</span>
                </div>
            `;
        }).join('');
    },

    renderTasks(tasks, currentUserEmail) {
        if (!this.elements.tasksGrid) return;

        if (tasks.length === 0) {
            this.elements.tasksGrid.innerHTML = `
                <div class="loading-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-tertiary);">
                    Nenhuma tarefa atribuída ainda.
                </div>
            `;
            return;
        }

        this.elements.tasksGrid.innerHTML = tasks.map(task => {
            const isCompleted = task.status === 'concluido';
            const isOwner = task.assignee === currentUserEmail;
            
            return `
                <div class="task-card card-white ${isCompleted ? 'completed' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <span class="task-status-badge ${isCompleted ? 'status-completed' : 'status-pending'}">
                            ${task.status}
                        </span>
                        <div class="task-assignee">
                            <i data-lucide="user"></i> ${task.assignee}
                        </div>
                    </div>
                    
                    <div class="task-info">
                        <p>${task.description}</p>
                    </div>

                    ${isCompleted && task.proofUrl ? `
                        <img src="${task.proofUrl}" class="proof-image" onclick="window.open('${task.proofUrl}')">
                    ` : ''}

                    ${!isCompleted && isOwner ? `
                        <button class="btn-primary" style="margin-top: auto;" onclick="openCompleteTaskModal('${task.id}')">
                            <i data-lucide="camera"></i> Enviar Prova
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        lucide.createIcons();
    }
};

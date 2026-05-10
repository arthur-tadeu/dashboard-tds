/**
 * UI Controller - Handles all DOM manipulations and Chart.js
 */

const UI_CONFIG = {
    DAILY_GOAL: 800,
    ANIMATION_DURATION: 1000
};

export const UIController = {
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
        metasContainer: document.querySelector('.metas-container'),
        reportsTableBody: document.getElementById('reportsTableBody'),
        reportDateInput: document.getElementById('reportDate'),
        tasksGrid: document.getElementById('tasksGrid')
    },

    chartInstance: null,

    showView(viewId) {
        document.querySelectorAll('.view-section').forEach(v => v.style.display = 'none');
        
        const target = document.getElementById(`${viewId}View`);
        if (target) {
            target.style.display = viewId === 'dashboard' ? 'flex' : 'block';
        }

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.toggle('active', link.getAttribute('onclick')?.includes(viewId));
        });

        lucide.createIcons();
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
        
        this.elements.metasContainer.innerHTML = metas.map(meta => `
            <div class="meta-card card-white" onclick="openMetaModal('${meta.day}', '${meta.date}', '${meta.description}', ${JSON.stringify(meta.tags).replace(/"/g, '&quot;')})">
                <div class="meta-date">
                    <span class="day">${meta.day.split('-')[0]}</span>
                    <span class="full-date">${meta.date}</span>
                </div>
                <div class="meta-content">
                    <p>${meta.description.substring(0, 60)}${meta.description.length > 60 ? '...' : ''}</p>
                </div>
            </div>
        `).join('');
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

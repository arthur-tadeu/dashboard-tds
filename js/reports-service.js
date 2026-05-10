import { ApiService } from './api-service.js';

export const ReportsService = {
    async getDailyData(date) {
        const data = await ApiService.getStats(date);
        if (!data?.data) return [];

        const usersMap = {};
        data.labelers?.forEach(u => {
            usersMap[u.id] = u.displayName || u.email || u.id;
        });

        return data.data.map(stat => ({
            user: usersMap[stat.labelerId] || stat.labelerId,
            project: stat.projectId,
            count: stat.imagesLabeled || 0,
            date: date
        })).sort((a, b) => b.count - a.count);
    },

    exportToCSV(data, filename = 'relatorio_produtividade.csv') {
        if (!data || !data.length) return;

        const headers = ['Data', 'Colaborador', 'Projeto', 'Fotos Rotuladas'];
        const rows = data.map(item => [
            item.date,
            item.user,
            item.project,
            item.count
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};

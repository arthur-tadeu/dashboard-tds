const CONFIG = {
    API_KEY: "UK9bpk6c1x3CdSRFqxmQ",
    WORKSPACE: "arthur-tadeu-s-workspace"
};

export const ApiService = {
    async getStats(date) {
        const url = `https://api.roboflow.com/${CONFIG.WORKSPACE}/stats?api_key=${CONFIG.API_KEY}&startDate=${date}&endDate=${date}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('API Failure');
        return await response.json();
    }
};

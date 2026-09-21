const API_BASE_URL = import.meta.env.PROD 
    ? 'https://tasksphere-backend-b143.onrender.com/api' // Note: Remove '/api' here if your Spring Boot controllers do NOT use @RequestMapping("/api/...")
    : '/api';

    
export const request = async (endpoint, method = 'GET', body = null) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
    };

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;
    
    if (!response.ok) {
        throw new Error(data?.message || data?.error || 'An unexpected error occurred');
    }
    
    return data;
};
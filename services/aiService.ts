import { AIQuestion, GenerateFromContentRequest, GenerateQuestionsRequest } from '../types';

const API_BASE_URL = 'http://192.168.1.4:3000/api'; // For physical device testing
// For iOS simulator use: 'http://localhost:3000/api'
// For Android emulator use: 'http://10.0.2.2:3000/api'

export class AIService {
    static async generateQuestions(request: GenerateQuestionsRequest): Promise<AIQuestion[]> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

        try {
            console.log('Sending request:', request);
            const response = await fetch(`${API_BASE_URL}/generate-questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                signal: controller.signal,
                body: JSON.stringify(request),
            });

            const data = await response.json();
            console.log('Response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate questions');
            }

            if (!data.questions) {
                throw new Error('No questions returned from server');
            }

            return data.questions;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.error('Request to generate questions timed out.');
                throw new Error('Request timed out. The server is taking too long to respond.');
            }
            console.error('Error generating questions:', error);
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    static async generateFromContent(request: GenerateFromContentRequest): Promise<AIQuestion[]> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

        try {
            const response = await fetch(`${API_BASE_URL}/generate-from-content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                signal: controller.signal,
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({})); // Try to parse error, but don't fail if no body
                throw new Error(data.error || 'Failed to generate questions from content');
            }

            const data = await response.json();
            if (!data.questions) {
                throw new Error('No questions returned from server');
            }
            return data.questions;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.error('Request to generate from content timed out.');
                throw new Error('Request timed out. The server is taking too long to respond.');
            }
            console.error('Error generating questions from content:', error);
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }
}

export { GenerateQuestionsRequest };

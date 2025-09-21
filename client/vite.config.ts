import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const target = env.VITE_API_URL;
	if (!target) {
		throw new Error('VITE_API_URL is required');
	}
    return {
        plugins: [tailwindcss(), sveltekit()],
        server: {
            proxy: {
                '/api': {
                    target,
                    changeOrigin: true,
                }
            }
        }
    };
});

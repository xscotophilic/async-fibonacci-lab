import { writable, type Readable } from 'svelte/store';

const MAX_VISIBLE = 3;

let idCounter = 0;
let queue: SnackbarItem[] = [];
let visible: SnackbarItem[] = [];
const snackbarsWritable = writable<SnackbarItem[]>([]);

function processQueue() {
	while (visible.length < MAX_VISIBLE && queue.length > 0) {
		const item = queue.shift()!;
		visible = [item, ...visible];
		snackbarsWritable.set(visible);

		setTimeout(() => {
			visible = visible.filter((s) => s.id !== item.id);
			snackbarsWritable.set(visible);
			processQueue();
		}, item.duration);
	}
}

export type SnackbarType = 'info' | 'warning' | 'error' | 'success';

export type SnackbarItem = {
	id: number;
	message: string;
	type: SnackbarType;
	duration: number;
};

export const snackbars: Readable<SnackbarItem[]> = { subscribe: snackbarsWritable.subscribe };

export function showSnackbar(message: string, type: SnackbarType = 'info', duration = 3000) {
	const item: SnackbarItem = {
		id: ++idCounter,
		message,
		type,
		duration
	};
	queue.push(item);
	processQueue();
}

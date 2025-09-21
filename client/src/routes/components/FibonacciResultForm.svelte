<script lang="ts">
	import type { FibonacciResult } from '$lib/types';
	import { showSnackbar } from '../../stores/snackbarStore';

	export let onResult: (res: FibonacciResult | null) => void = () => {};

	let index = '';
	let loading = false;
	let lastSubmit = 0;
	const MIN_SUBMIT_INTERVAL = 800; // ms

	const handleSubmit = async () => {
		if (loading) return;
		const now = Date.now();
		if (now - lastSubmit < MIN_SUBMIT_INTERVAL) {
			showSnackbar('Please wait a moment before submitting again.', 'info');
			return;
		}
		lastSubmit = now;

		loading = true;
		try {
			onResult?.(null);
			const response = await fetch(`/api/v1/fibonacci/calculated/${index}`);
			if (!response.ok) {
				const { error } = await response.json();
				showSnackbar(error || 'Something went wrong.', 'error');
			} else {
				const data = await response.json();
				if (data.calculated_value === null) {
					showSnackbar('No result found for index: ' + index, 'error');
				} else if (typeof data.calculated_value === 'string' && data.calculated_value.toLowerCase() === 'calculating...') {
					showSnackbar('Still Calculating... Please wait for a moment.', 'info');
				} else {
					onResult?.({ index: Number(index), value: Number(data.calculated_value) });
				}
			}
		} catch (err) {
			showSnackbar('Something went wrong. Please try again.', 'error');
		} finally {
			loading = false;
		}
	};
</script>

<form on:submit|preventDefault={handleSubmit} class="form">
	<input
		type="number"
		bind:value={index}
		class="glass-input"
		aria-label="Fibonacci index"
		placeholder="Enter index"
		min="0"
		required
	/>

	<button
		type="submit"
		class="submit-btn {loading ? 'shimmer hover:cursor-not-allowed' : ''}"
		aria-busy={loading}
		disabled={loading}
	>
		Check Result
	</button>
</form>

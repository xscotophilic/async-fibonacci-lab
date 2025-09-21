<script lang="ts">
	import { showSnackbar } from "../../stores/snackbarStore";


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
			const response = await fetch(`/api/v1/fibonacci/calculate/${index}`, {
				method: 'POST'
			});

			if (response.ok) {
				showSnackbar(`Calculating Fibonacci for index: ${index}`, 'success');
			} else if (response.status === 422) {
				const { error } = await response.json();
				showSnackbar(error, 'error');
			} else if (response.status === 409) {
				showSnackbar(`Fibonacci for index: ${index} is already calculated`, 'error');
			} else {
				const { error } = await response.json();
				showSnackbar(error || 'Something went wrong.', 'error');
			}
		} catch (err) {
			console.error(err);
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
		Calculate
	</button>
</form>

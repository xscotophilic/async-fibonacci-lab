<script lang="ts">
	import { fade } from 'svelte/transition';
	import { snackbars } from '../stores/snackbarStore';
</script>

<div class="glass-snackbar-container">
	{#each $snackbars as snackbar (snackbar.id)}
		<div
			class="glass-snackbar glass-snackbar-{snackbar.type}"
			in:fade={{ duration: 250 }}
			out:fade={{ duration: 400 }}
		>
			{snackbar.message}
		</div>
	{/each}
</div>

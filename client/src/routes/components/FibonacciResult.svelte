<script lang="ts">
    import type { FibonacciResult } from '$lib/types';
    export let result: FibonacciResult | null = null;
</script>

{#if result}
    <div class="constrained-glass-card emerald-bg-border">
        <h2>For index {result.index}, calculated value is {result.value}</h2>
    </div>
{:else}
	<div class="constrained-glass-card red-bg-border">
		<h2>No result yet.</h2>
	</div>
{/if}

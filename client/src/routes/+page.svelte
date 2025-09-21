<script lang="ts">
	import PageTitle from './components/PageTitle.svelte';
	import FibonacciCalculationForm from './components/FibonacciCalculationForm.svelte';
	import FibonacciResultForm from './components/FibonacciResultForm.svelte';
	import FibonacciResult from './components/FibonacciResult.svelte';
	import type { FibonacciResult as FibonacciResultType } from '$lib/types';
	import MostRequestedInfo from './components/MostRequestedInfo.svelte';

	let result: FibonacciResultType | null = null;
	function handleResult(res: FibonacciResultType | null) {
		result = res;
	}
</script>

<div class="fullscreen-center light-font">
	<div class="glass-card">
		<PageTitle />
		<FibonacciCalculationForm />
		<FibonacciResultForm onResult={handleResult} />
		{#if result}
			<FibonacciResult {result} />
		{/if}
		<MostRequestedInfo />
	</div>
</div>

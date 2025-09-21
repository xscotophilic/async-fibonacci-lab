<script lang="ts">
    import { onMount } from 'svelte';
    let mostRequested: { number: number; count: number } | null = null;

    async function fetchMostRequested() {
        const response = await fetch(`/api/v1/fibonacci/most-requested`);

        if (!response.ok) {
            if (response.status === 404) {
                mostRequested = null;
            }
        } else {
            const data = await response.json();
            mostRequested = data.most_requested;
        }
    }
    onMount(() => {
        void fetchMostRequested();
    });
</script>

{#if mostRequested}
    <div class="constrained-glass-card purple-bg-border">
        <h2>Most requested index is {mostRequested?.number}</h2>
    </div>
{/if}

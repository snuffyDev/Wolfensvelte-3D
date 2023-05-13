<script lang="ts">
	import { isValidTexture } from "$lib/utils/validation";
	import { getContext } from "svelte";
	import type { Texture } from "../../../../lib/types/core";
	import { TEXTURE_KEYS } from "../../../../lib/utils/engine/textures";
	import { ctxKey, type WSContext } from "../../../key";

	export let selected: Texture | undefined;
	const { textures }: WSContext = getContext(ctxKey);

	const items = TEXTURE_KEYS.map((t) => ({ key: t, active: false }));
	let current: number;

	$: {
		current = items.findIndex((t) => t.key === selected);
		current = current < 0 ? 0 : current;
	}
</script>

<select bind:value={selected}>
	{#each items as texture, idx}
		<option
			selected={texture["key"] === selected}
			value={texture.key}
		>
			{#if isValidTexture(texture.key)}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div
					on:click={() => {
						current = idx;
						selected = items[current].key;
					}}
					class=""
				>
					<img
						src={$textures[texture.key].original}
						alt=""
					/>
					<p>{$textures[texture.key].name}</p>
				</div>
			{/if}
		</option>
	{/each}
</select>

<style lang="scss">
</style>

export const prerender = false;
export const ssr = false;

export const load = async ({ parent, params, depends }) => {
	depends("map:load");
	return {
		page: params.level,

		...{ ...(await parent()) }
	};
};

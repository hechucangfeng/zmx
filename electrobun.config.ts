import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "zenxie",
		identifier: "zenxie.electrobun.dev",
		version: "0.0.1",
	},
	update: {
		enabled: true,
		provider: "github",
		url: "https://github.com/hechucangfeng/zmx",
		channel: "latest",
		checkInterval: 3600000,
		autoDownload: true,
		autoInstall: false,
	},
	build: {
		views: {
			mainview: {
				entrypoint: "src/mainview/index.ts",
			},
		},
		copy: {
			"src/mainview/index.html": "views/mainview/index.html",
			"src/mainview/index.css": "views/mainview/index.css",
			"node_modules/gif.js/dist/gif.worker.js": "views/mainview/gif.worker.js",
		},
		mac: {
			bundleCEF: false,
		},
		linux: {
			bundleCEF: false,
		},
		win: {
			bundleCEF: false,
		},
	},
} satisfies ElectrobunConfig;

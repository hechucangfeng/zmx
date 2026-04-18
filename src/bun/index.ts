import { BrowserWindow, BrowserView, Utils } from "electrobun/bun";
import { writeFileSync } from "fs";

interface AppRPCSchema {
	bun: {
		requests: {
			openFileDialog: {
				params: {
					canChooseFiles: boolean;
					canChooseDirectory: boolean;
					allowsMultipleSelection: boolean;
					startingFolder: string;
					allowedFileTypes: string;
				};
				response: string[];
			};
			saveFile: {
				params: {
					filePath: string;
					blob: ArrayBuffer;
				};
				response: {
					success: boolean;
					filePath: string;
					error?: string;
				};
			};
		};
		messages: {};
	};
	webview: {
		requests: {};
		messages: {};
	};
}

const rpc = BrowserView.defineRPC<AppRPCSchema>({
	maxRequestTime: 30000,
	handlers: {
		requests: {
			openFileDialog: async (params) => {
				console.log("处理 openFileDialog 请求:", params);
				try {
					const result = await Utils.openFileDialog(params);
					console.log("openFileDialog 结果:", result);
					return result;
				} catch (error: any) {
					console.error("openFileDialog 错误:", error);
					throw error;
				}
			},
			saveFile: (params) => {
				console.log("处理 saveFile 请求:", params);
				try {
					const { filePath, blob } = params;
					const buffer = Buffer.from(blob);
					writeFileSync(filePath, buffer);
					console.log("saveFile 成功:", filePath);
					return { success: true, filePath };
				} catch (error: any) {
					console.error("saveFile 错误:", error);
					return { success: false, filePath: params.filePath, error: error.message };
				}
			},
		},
		messages: {},
	},
});

const mainWindow = new BrowserWindow({
	title: "怎么写",
	url: "views://mainview/index.html",
	frame: {
		width: 800,
		height: 800,
		x: 200,
		y: 200,
	},
	rpc,
});

console.log("怎么写应用启动成功！");

// 更新功能已配置在 electrobun.config.ts 中
console.log("更新功能已配置");
console.log("应用启动时会自动检查更新");
console.log("实际部署时，请确保更新服务器可访问");

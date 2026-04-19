import { BrowserWindow, BrowserView, Utils } from "electrobun/bun";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";

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
			loadCharData: {
				params: {
					char: string;
				};
				response: {
					success: boolean;
					data?: {
						strokes: string[];
						medians: number[][][];
					};
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

const charDataCache = new Map<string, { strokes: string[]; medians: number[][][] }>();

function charToFileName(char: string): string {
	const codePoint = char.codePointAt(0);
	if (codePoint === undefined) return `${char}.json`;
	const hex = codePoint.toString(16).toUpperCase();
	return `${hex}.json`;
}

function findProjectRoot(startDir: string): string | null {
	let dir = startDir;
	for (let i = 0; i < 20; i++) {
		if (existsSync(join(dir, "electrobun.config.ts")) || existsSync(join(dir, "package.json"))) {
			if (existsSync(join(dir, "hanzi-writer-data")) || existsSync(join(dir, "build-data")) || existsSync(join(dir, "node_modules/hanzi-writer-data"))) {
				return dir;
			}
		}
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}

const projectRoot = findProjectRoot(import.meta.dir);

const possibleDataDirs: string[] = [];
if (projectRoot) {
	possibleDataDirs.push(
		join(projectRoot, "build-data"),
		join(projectRoot, "hanzi-writer-data/data"),
		join(projectRoot, "node_modules/hanzi-writer-data"),
	);
}
possibleDataDirs.push(
	join(import.meta.dir, "../data"),
	join(import.meta.dir, "../../build-data"),
	join(import.meta.dir, "../../hanzi-writer-data/data"),
	join(import.meta.dir, "../../node_modules/hanzi-writer-data"),
);

let resolvedDataDir: string | null = null;
for (const dir of possibleDataDirs) {
	if (existsSync(dir)) {
		resolvedDataDir = dir;
		break;
	}
}

let useCodePointNames = false;
if (resolvedDataDir) {
	const indexFile = join(resolvedDataDir, "_index.json");
	useCodePointNames = existsSync(indexFile);
	console.log(`汉字数据目录: ${resolvedDataDir} (码点命名: ${useCodePointNames})`);
} else {
	console.error("未找到汉字数据目录，请确保 hanzi-writer-data 已安装");
	console.error("import.meta.dir:", import.meta.dir);
	console.error("尝试的路径:", possibleDataDirs);
}

function loadCharDataFromDisk(char: string): { success: boolean; data?: { strokes: string[]; medians: number[][][] }; error?: string } {
	if (charDataCache.has(char)) {
		return { success: true, data: charDataCache.get(char) };
	}

	if (!resolvedDataDir) {
		return { success: false, error: "汉字数据目录未找到" };
	}

	const fileName = useCodePointNames ? charToFileName(char) : `${char}.json`;
	const dataPath = join(resolvedDataDir, fileName);

	if (!existsSync(dataPath)) {
		return { success: false, error: `字符 "${char}" 的数据文件不存在 (${fileName})` };
	}

	try {
		const raw = readFileSync(dataPath, "utf-8");
		const parsed = JSON.parse(raw);
		charDataCache.set(char, parsed);
		return { success: true, data: parsed };
	} catch (err: any) {
		return { success: false, error: `读取字符 "${char}" 数据失败: ${err.message}` };
	}
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
			loadCharData: (params) => {
				return loadCharDataFromDisk(params.char);
			},
		},
		messages: {},
	},
});

const mainWindow = new BrowserWindow({
	title: "怎么写",
	url: "views://mainview/index.html",
	renderer: "cef",
	frame: {
		width: 800,
		height: 800,
		x: 200,
		y: 200,
	},
	rpc,
});

console.log("怎么写应用启动成功！ - 离线模式");
console.log("更新功能已配置，应用启动时会自动检查更新");
console.log("更新源：https://github.com/hechucangfeng/zmx");

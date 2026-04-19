import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from "fs";
import { join } from "path";

const srcDir = join(import.meta.dir, "../hanzi-writer-data/data");
const outDir = join(import.meta.dir, "../build-data");

if (!existsSync(srcDir)) {
	console.error("源数据目录不存在:", srcDir);
	process.exit(1);
}

if (existsSync(outDir)) {
	console.log("清理旧输出目录...");
	const { rmSync } = require("fs");
	rmSync(outDir, { recursive: true, force: true });
}

mkdirSync(outDir, { recursive: true });

const files = readdirSync(srcDir).filter((f) => f.endsWith(".json"));

let converted = 0;
let skipped = 0;

for (const file of files) {
	const srcPath = join(srcDir, file);

	if (/^[a-zA-Z0-9._-]+$/.test(file)) {
		const destPath = join(outDir, file);
		cpSync(srcPath, destPath);
		skipped++;
		continue;
	}

	const charName = file.replace(".json", "");
	const codePoint = charName.codePointAt(0);
	if (codePoint === undefined) {
		console.warn(`跳过无法解析的文件: ${file}`);
		continue;
	}

	const newName = `${codePoint.toString(16).toUpperCase()}.json`;
	const destPath = join(outDir, newName);

	try {
		const data = readFileSync(srcPath, "utf-8");
		const parsed = JSON.parse(data);
		parsed._char = charName;
		writeFileSync(destPath, JSON.stringify(parsed));
		converted++;
	} catch (err) {
		console.warn(`处理文件 ${file} 时出错:`, err);
	}
}

const indexMap: Record<string, string> = {};
for (const file of files) {
	const charName = file.replace(".json", "");
	if (/^[a-zA-Z0-9._-]+$/.test(file)) {
		indexMap[charName] = file;
	} else {
		const codePoint = charName.codePointAt(0);
		if (codePoint !== undefined) {
			indexMap[charName] = `${codePoint.toString(16).toUpperCase()}.json`;
		}
	}
}
writeFileSync(join(outDir, "_index.json"), JSON.stringify(indexMap));

console.log(`数据预处理完成: ${converted} 个文件已重命名, ${skipped} 个ASCII文件直接复制`);
console.log(`输出目录: ${outDir}`);

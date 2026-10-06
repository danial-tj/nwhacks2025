import { readFile, copyFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  await readFile(join(root, "docs/assets.json"), "utf8"),
);
const [mode = "check", sourceDirectory] = process.argv.slice(2);
if (
  !["check", "import"].includes(mode) ||
  (mode === "import" && !sourceDirectory)
)
  throw new Error(
    'Usage: npm run assets:import -- "path/to/recovery-root" (see docs/ASSETS.md)',
  );
await mkdir(join(root, "public/models"), { recursive: true });
let errors = 0;
for (const asset of manifest) {
  try {
    if (mode === "import") {
      const source = join(
        resolve(sourceDirectory),
        asset.recoveredFrom,
      );
      const content = await readFile(source);
      if (createHash("sha256").update(content).digest("hex") !== asset.sha256)
        throw new Error(
          "Source hash differs from the recovered original; no file copied.",
        );
      const destination = join(root, asset.directory || "public/models", asset.file);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(source, destination);
    }
    const content = await readFile(join(root, asset.directory || "public/models", asset.file));
    if (
      content.toString("ascii", 0, 4) !== "glTF" ||
      content.readUInt32LE(4) !== 2 ||
      content.readUInt32LE(8) !== content.length
    )
      throw new Error("Invalid GLB container");
    if (createHash("sha256").update(content).digest("hex") !== asset.sha256)
      throw new Error("Hash differs from the recovered original");
    const gltf = JSON.parse(
      content.subarray(20, 20 + content.readUInt32LE(12)).toString(),
    );
    if (
      [...(gltf.buffers || []), ...(gltf.images || [])].some(
        (item) => item.uri && !item.uri.startsWith("data:"),
      )
    )
      throw new Error("Model references an external asset");
    console.log(
      `OK ${asset.file} (${content.length.toLocaleString()} bytes, ${gltf.animations?.length || 0} animation clips)`,
    );
  } catch (error) {
    errors++;
    console.error(`${asset.file}: ${error.message}`);
  }
}
if (errors) {
  console.error(
    'Recover the models with npm run assets:import -- "path/to/recovery-root". See docs/ASSETS.md.',
  );
  process.exitCode = 1;
}

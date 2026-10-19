import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const modules = new Map();
async function loadModule(pathStr) {
  const url = new URL(pathStr, import.meta.url);
  const compile = (file) => {
    if (modules.has(file.href)) return modules.get(file.href);
    const source = fs.readFileSync(file, "utf8");
    let { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
      },
    });
    outputText = outputText.replace(
      /(from\s*["'])(\.[^"']+)(["'])/g,
      (_, before, specifier, after) => {
        const dependency = new URL(
          specifier.endsWith(".ts") ? specifier : `${specifier}.ts`,
          file,
        );
        return `${before}${compile(dependency)}${after}`;
      },
    );
    const data = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
    modules.set(file.href, data);
    return data;
  };
  return import(compile(url));
}

const { kBoothTemplates } = await loadModule("../src/templates.ts");

test("kBoothTemplates contains all 15 authentic Canva photobooth templates", () => {
  assert.equal(kBoothTemplates.length, 15, `Expected exactly 15 K-Booth templates, got ${kBoothTemplates.length}`);

  for (let i = 1; i <= 15; i++) {
    const id = `tmpl-kbooth-${String(i).padStart(2, "0")}`;
    const tmpl = kBoothTemplates.find((t) => t.id === id);
    assert.ok(tmpl, `Missing K-Booth template for ${id}`);
    assert.equal(tmpl.category, "K-Booth (인생네컷)");
    assert.ok(tmpl.name.length > 0, `Missing name for ${id}`);
    assert.ok(tmpl.slots.length > 0, `Template ${id} has no slots`);
    assert.equal(tmpl.slots.length, tmpl.count, `Template ${id} slot count mismatch: slots=${tmpl.slots.length}, count=${tmpl.count}`);

    // Verify thumbnail exists in public/kbooth/
    assert.ok(tmpl.thumbnail, `Missing thumbnail path for ${id}`);
    const localThumbnailPath = path.join(process.cwd(), "public", tmpl.thumbnail.replace(/^\//, ""));
    assert.ok(fs.existsSync(localThumbnailPath), `Thumbnail file does not exist on disk: ${localThumbnailPath}`);
    const stat = fs.statSync(localThumbnailPath);
    const content = fs.readFileSync(localThumbnailPath, "utf8");
    if (content.startsWith("version https://git-lfs.github.com")) {
      assert.ok(stat.size > 50, `LFS pointer file valid for ${id}`);
    } else {
      assert.ok(stat.size > 2000, `Thumbnail file size too small (${stat.size} bytes) for ${id}`);
    }

    // Verify slot coordinates validity
    for (const slot of tmpl.slots) {
      assert.ok(slot.x >= 0 && slot.x <= 100, `Slot x out of range: ${slot.x} in ${id}`);
      assert.ok(slot.y >= 0 && slot.y <= 100, `Slot y out of range: ${slot.y} in ${id}`);
      assert.ok(slot.width > 0 && slot.width <= 100, `Slot width out of range: ${slot.width} in ${id}`);
      assert.ok(slot.height > 0 && slot.height <= 100, `Slot height out of range: ${slot.height} in ${id}`);
    }
  }
});

#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ALLOWED_DEPS = {
  "my-app": new Set(["shared-infra", "contract"]),
  cli: new Set(["shared-infra", "contract"]),
  "shared-infra": new Set([]),
  frontend: new Set(["shared-infra"]),
  contract: new Set([]),
};

const NODE_BUILTINS = new Set([
  "assert",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "dns",
  "domain",
  "events",
  "fs",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "net",
  "os",
  "path",
  "perf_hooks",
  "process",
  "punycode",
  "querystring",
  "readline",
  "repl",
  "stream",
  "string_decoder",
  "timers",
  "tls",
  "trace_events",
  "tty",
  "url",
  "util",
  "v8",
  "vm",
  "worker_threads",
  "zlib",
]);

const PACKAGES = [
  { name: "my-app", dir: resolve(__dirname, "..", "pkgs", "backend") },
  { name: "cli", dir: resolve(__dirname, "..", "pkgs", "cli") },
  {
    name: "shared-infra",
    dir: resolve(__dirname, "..", "pkgs", "shared-infra"),
  },
  { name: "frontend", dir: resolve(__dirname, "..", "pkgs", "frontend") },
  { name: "contract", dir: resolve(__dirname, "..", "pkgs", "contract") },
];

function listSourceFiles(rootDir) {
  const files = [];
  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const ent of entries) {
      const p = join(dir, ent);
      let st;
      try {
        st = statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (ent === "node_modules" || ent.startsWith(".")) continue;
        walk(p);
      } else if (st.isFile()) {
        if (/\.(ts|tsx|js|mjs|cjs)$/.test(ent)) files.push(p);
      }
    }
  }
  walk(rootDir);
  return files;
}

function extractImports(code) {
  const imports = [];
  const importRe =
    /import(?:[\s\w*{},]+from\s*)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;
  const requireRe = /require\s*\(\s*["']([^"']+)\s*["']\)/g;

  for (const m of code.matchAll(importRe)) {
    imports.push(m[1] || m[2]);
  }
  for (const m of code.matchAll(requireRe)) {
    imports.push(m[1]);
  }
  return imports;
}

function isCrossPackageRelativeImport(pkgDir, filePath, targetPath) {
  try {
    const abs = resolve(dirname(filePath), targetPath);
    if (abs.startsWith(pkgDir)) return false;
    return true;
  } catch {
    return false;
  }
}

function checkPackage(pkg) {
  const allowed = ALLOWED_DEPS[pkg.name] || new Set();
  const files = listSourceFiles(pkg.dir);
  const violations = [];
  for (const f of files) {
    let code;
    try {
      code = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    const imps = extractImports(code);
    for (const spec of imps) {
      if (!spec) continue;
      if (spec.startsWith(".")) {
        if (isCrossPackageRelativeImport(pkg.dir, f, spec)) {
          violations.push({
            file: f,
            reason: `相対パスで他パッケージを参照: ${spec}`,
          });
        }
        continue;
      }
      if (NODE_BUILTINS.has(spec) || NODE_BUILTINS.has(spec.split("/")[0])) {
        continue;
      }
      const parts = spec.startsWith("@")
        ? spec.split("/").slice(0, 2).join("/")
        : spec.split("/")[0];
      if (parts === pkg.name) continue;
      const otherPkgNames = Object.keys(ALLOWED_DEPS);
      if (otherPkgNames.includes(parts) && !allowed.has(parts)) {
        violations.push({
          file: f,
          reason: `禁止されたパッケージ依存: ${parts}`,
        });
      }
    }
  }
  return violations;
}

function main() {
  const allViolations = [];
  for (const pkg of PACKAGES) {
    const v = checkPackage(pkg);
    if (v.length > 0) {
      allViolations.push({ pkg: pkg.name, list: v });
    }
  }
  if (allViolations.length === 0) {
    console.log("✓ モジュール境界チェックに合格しました");
    process.exit(0);
  }
  console.error("✗ モジュール境界違反を検出しました:");
  for (const v of allViolations) {
    console.error(`- [${v.pkg}]`);
    for (const e of v.list) {
      console.error(`  • ${e.file}`);
      console.error(`    → ${e.reason}`);
    }
  }
  process.exit(1);
}

main();

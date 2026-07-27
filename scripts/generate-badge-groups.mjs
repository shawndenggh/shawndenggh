import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputDirectory = path.join(projectRoot, "assets", "badges");

const groups = [
  {
    filename: "ai-development-stack.svg",
    title: "AI Development Stack",
    badges: [
      "https://img.shields.io/badge/Claude%20Code-D97757?style=for-the-badge&logo=claude&logoColor=white",
      "https://img.shields.io/badge/Codex-10A37F?style=for-the-badge&logo=openai&logoColor=white",
      "https://img.shields.io/badge/GitHub%20Copilot-8957E5?style=for-the-badge&logo=githubcopilot&logoColor=white",
      "https://img.shields.io/badge/Cursor-007ACC?style=for-the-badge&logo=cursor&logoColor=white",
      "https://img.shields.io/badge/Kiro-F59E0B?style=for-the-badge&logoColor=white",
      "https://img.shields.io/badge/Grok-000000?style=for-the-badge&logo=x&logoColor=white",
    ],
  },
  {
    filename: "frontend-stack.svg",
    title: "Frontend and JavaScript Stack",
    badges: [
      "https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white",
      "https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB",
      "https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white",
      "https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white",
    ],
  },
  {
    filename: "backend-languages.svg",
    title: "Backend Languages",
    badges: [
      "https://img.shields.io/badge/Java-ED8B00?style=flat-square&logo=openjdk&logoColor=white",
      "https://img.shields.io/badge/PHP-777BB4?style=flat-square&logo=php&logoColor=white",
      "https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white",
    ],
  },
];

function formatDimension(value) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

async function fetchBadge(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }

  const source = await response.text();
  const root = source.match(/^<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/);

  if (!root) {
    throw new Error(`Invalid SVG returned by ${url}`);
  }

  const width = Number(root[1].match(/\bwidth="([^"]+)"/)?.[1]);
  const height = Number(root[1].match(/\bheight="([^"]+)"/)?.[1]);

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error(`Missing SVG dimensions for ${url}`);
  }

  return { height, inner: root[2], width };
}

async function buildGroup({ badges, filename, title }) {
  const sources = await Promise.all(badges.map(fetchBadge));
  const width = sources.reduce((total, badge) => total + badge.width, 0);
  const height = Math.max(...sources.map((badge) => badge.height));
  let x = 0;

  const children = sources
    .map((badge) => {
      const child = `<svg x="${formatDimension(x)}" y="0" width="${formatDimension(badge.width)}" height="${formatDimension(badge.height)}" viewBox="0 0 ${formatDimension(badge.width)} ${formatDimension(badge.height)}">${badge.inner}</svg>`;
      x += badge.width;
      return child;
    })
    .join("");

  const output = `<svg xmlns="http://www.w3.org/2000/svg" width="${formatDimension(width)}" height="${formatDimension(height)}" viewBox="0 0 ${formatDimension(width)} ${formatDimension(height)}" role="img" aria-label="${title}"><title>${title}</title>${children}</svg>\n`;

  await writeFile(path.join(outputDirectory, filename), output, "utf8");
}

await mkdir(outputDirectory, { recursive: true });
await Promise.all(groups.map(buildGroup));

#!/usr/bin/env node

/**
 * Native addon dependency tree analyzer.
 * Scans node_modules for .node/.so files and traces their dependency chains
 * using yarn or pnpm. Supports live terminal updates and manual package filtering.
 */

import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import readline from 'readline'
import pLimit from 'p-limit'

const execAsync = promisify(exec)

// ANSI color codes
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const CYAN = '\x1b[36m'
const GREEN = '\x1b[32m'
const RESET = '\x1b[0m'

/** @type {boolean} Whether stdout is a terminal (TTY) */
const isTTY = process.stdout.isTTY
/** @type {import('p-limit').Limit} Concurrency limiter for why commands */
const limit = pLimit(5)

/** @type {number} Number of lines currently rendered in the tree (for overlay) */
let currentTreeLines = 0

/**
 * @typedef {Object} TreeNode
 * @property {string} name - Package name
 * @property {string|null} version - Package version
 * @property {Map<string, TreeNode>} children - Child nodes
 * @property {boolean} isLeaf - Whether this node represents a native addon leaf
 * @property {string} [leafFile] - Path to .node/.so file (if leaf)
 * @property {string} [leafPackage] - Native addon package name (if leaf)
 */

/** @type {TreeNode|null} Root of the production dependency tree */
let prodTree = null
/** @type {TreeNode|null} Root of the dev dependency tree */
let devTree = null
/** @type {string} Name of the root project (from package.json) */
let rootProjectName = ''
/** @type {Set<string>} All direct dependencies (dependencies + devDependencies) */
let rootDeps = new Set()
/** @type {Set<string>} Direct devDependencies only */
let rootDevDeps = new Set()

/**
 * Overlays new tree content on top of the previous tree (live terminal update).
 * @param {string} content - The full tree content to display.
 */
function overlayTree(content) {
  content = content + '\n'
  const newLineCount = content.split('\n').length
  if (!isTTY) return
  if (currentTreeLines > 0) {
    readline.moveCursor(process.stdout, 0, -currentTreeLines)
    readline.clearScreenDown(process.stdout)
  }
  console.log(content)
  currentTreeLines = newLineCount
}

/**
 * Recursively finds all .node and .so files inside a directory.
 * @param {string} dir - Starting directory path.
 * @returns {Promise<string[]>} Array of absolute file paths.
 */
async function findNativeFiles(dir) {
  /** @type {string[]} */
  const nativeFiles = []
  async function walk(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name)
        if (entry.isDirectory() && entry.name === 'obj.target') continue
        if (entry.isDirectory()) await walk(fullPath)
        else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase()
          if (ext === '.node' || ext === '.so') nativeFiles.push(fullPath)
        }
      }
    } catch (err) {
      if (err.code !== 'ENOENT' && err.code !== 'EACCES')
        console.error(`Warning: Could not read ${currentDir}: ${err.message}`)
    }
  }
  await walk(dir)
  return nativeFiles
}

/**
 * Extracts the owning package name from a path inside node_modules.
 * @param {string} filePath - Absolute path to .node/.so file.
 * @returns {string|null} Package name (e.g. '@scope/name' or 'name'), or null if not found.
 */
function getPackageNameFromPath(filePath) {
  const nodeModulesIdx = filePath.lastIndexOf('node_modules')
  if (nodeModulesIdx === -1) return null
  const after = filePath.slice(nodeModulesIdx + 'node_modules'.length + 1)
  const segments = after.split(path.sep)
  if (segments[0].startsWith('@')) {
    if (segments.length < 2) return null
    return `${segments[0]}/${segments[1]}`
  } else {
    return segments[0]
  }
}

/**
 * Detects which package manager is used (pnpm or yarn) based on lock file presence.
 * @returns {Promise<'pnpm'|'yarn'|null>}
 */
async function detectPackageManager() {
  try {
    await fs.access('pnpm-lock.yaml')
    return 'pnpm'
  } catch {
    try {
      await fs.access('yarn.lock')
      return 'yarn'
    } catch {
      return null
    }
  }
}

/**
 * Loads root project dependencies and devDependencies from package.json.
 * @returns {Promise<void>}
 */
async function loadRootDeps() {
  try {
    const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'))
    rootProjectName = pkg.name || 'root-project'
    const deps = new Set(Object.keys(pkg.dependencies || {}))
    const devDeps = new Set(Object.keys(pkg.devDependencies || {}))
    rootDeps = new Set([...deps, ...devDeps])
    rootDevDeps = devDeps
  } catch {
    rootProjectName = 'root-project'
    rootDeps = new Set()
    rootDevDeps = new Set()
  }
}

/**
 * @typedef {Object} PackageInfo
 * @property {string|null} name - Package name
 * @property {string|null} version - Package version
 */

/**
 * Parses a yarn/pnpm "value" string into a package name and version.
 * @param {string} value - e.g. "sharp@npm:0.34.5" or "@scope/name@1.2.3"
 * @returns {PackageInfo}
 */
function parsePackageInfo(value) {
  if (value.includes('workspace:.')) return { name: null, version: null }
  let name = value
  let version = ''
  if (name.startsWith('@')) {
    const atIndex = name.indexOf('@', 1)
    if (atIndex !== -1) {
      version = name.substring(atIndex + 1)
      name = name.substring(0, atIndex)
    }
  } else {
    const atIndex = name.indexOf('@')
    if (atIndex !== -1) {
      version = name.substring(atIndex + 1)
      name = name.substring(0, atIndex)
    }
  }
  if (version.startsWith('npm:')) version = version.substring(4)
  return { name, version }
}

/**
 * Recursively traces a Yarn dependency chain from a target package up to a root direct dependency.
 * @param {string} targetPkg - The package to start from (the native addon).
 * @param {Set<string>} [visited] - Set of visited packages to avoid cycles.
 * @returns {Promise<{chain: PackageInfo[], directRootDep: string|null, isDev: boolean} | null>}
 */
async function getYarnChainToRoot(targetPkg, visited = new Set()) {
  if (visited.has(targetPkg)) return null
  visited.add(targetPkg)

  if (rootDeps.has(targetPkg)) {
    const isDev = rootDevDeps.has(targetPkg)
    const chain = [
      { name: rootProjectName, version: null },
      { name: targetPkg, version: null },
    ]
    return { chain, directRootDep: targetPkg, isDev }
  }

  const output = await runWhyCommand('yarn', targetPkg)
  const lines = output.trim().split('\n')

  for (const line of lines) {
    try {
      const obj = JSON.parse(line)
      if (obj.children && typeof obj.children === 'object') {
        for (const childKey of Object.keys(obj.children)) {
          const childInfo = parsePackageInfo(childKey)
          if (childInfo.name === targetPkg) {
            const parentRaw = obj.value
            if (parentRaw && parentRaw.includes('workspace:.')) {
              const isDev = rootDevDeps.has(targetPkg)
              const chain = [
                { name: rootProjectName, version: null },
                { name: targetPkg, version: null },
              ]
              return { chain, directRootDep: targetPkg, isDev }
            }
            const parentInfo = parsePackageInfo(parentRaw)
            if (parentInfo.name && parentInfo.name !== targetPkg) {
              const parentResult = await getYarnChainToRoot(parentInfo.name, visited)
              if (parentResult && parentResult.chain) {
                const chain = [...parentResult.chain, parentInfo]
                return { chain, directRootDep: parentResult.directRootDep, isDev: parentResult.isDev }
              }
            }
            break
          }
        }
      }
    } catch (err) {}
  }
  return null
}

/**
 * Parses pnpm why --json output into dependency chains (root → leaf), excluding the leaf node itself.
 * @param {string} moduleName - The native package name.
 * @param {string} jsonOutput - Raw JSON output from `pnpm why --json`.
 * @returns {Array<{chain: PackageInfo[], depField: string}>}
 */
function parsePnpmWhy(moduleName, jsonOutput) {
  /** @type {Array<{chain: PackageInfo[], depField: string}>} */
  const chains = []
  try {
    const data = JSON.parse(jsonOutput)
    if (!Array.isArray(data) || data.length === 0) return chains

    /**
     * @param {any} node - A pnpm why node.
     * @param {PackageInfo[]} currentChain - Current chain (leaf to root).
     * @param {string|null} depField - Dependency field (dependencies/devDependencies).
     */
    function traverse(node, currentChain = [], depField = null) {
      const nodeInfo = { name: node.name, version: node.version, depField: node.depField || depField }
      const newChain = [nodeInfo, ...currentChain]
      if (!node.dependents || node.dependents.length === 0) {
        let finalChain = newChain.reverse()
        if (finalChain.length > 0 && finalChain[finalChain.length - 1].name === moduleName) {
          finalChain = finalChain.slice(0, -1)
        }
        if (finalChain.some(n => n.name === moduleName)) {
          chains.push({
            chain: finalChain,
            depField: nodeInfo.depField || 'dependencies',
          })
        }
        return
      }
      for (const dependent of node.dependents) {
        traverse(dependent, newChain, dependent.depField || depField)
      }
    }

    for (const item of data) {
      if (item.name === moduleName) traverse(item)
    }
  } catch (err) {}
  return chains
}

/**
 * Executes `yarn why --json` or `pnpm why --json` and returns stdout.
 * @param {'pnpm'|'yarn'} pm - Package manager.
 * @param {string} moduleName - Module name to query.
 * @returns {Promise<string>}
 */
async function runWhyCommand(pm, moduleName) {
  try {
    const { stdout } = await execAsync(`${pm} why --json ${moduleName}`, {
      maxBuffer: 10 * 1024 * 1024,
      cwd: process.cwd(),
    })
    return stdout
  } catch (error) {
    if (error.stdout) return error.stdout
    throw error
  }
}

/**
 * Inserts a dependency chain into a tree structure, attaching the leaf (native addon) at the end.
 * @param {TreeNode} root - Root tree node (usually rootProjectName).
 * @param {PackageInfo[]} chain - Array of packages from root to parent of leaf (excluding leaf).
 * @param {{name: string, file: string}} leafInfo - Leaf native addon info.
 */
function addChainToTree(root, chain, leafInfo) {
  let current = root
  for (const node of chain) {
    if (node.name === rootProjectName) continue
    if (!current.children.has(node.name)) {
      current.children.set(node.name, {
        name: node.name,
        version: node.version,
        children: new Map(),
        isLeaf: false,
      })
    }
    current = current.children.get(node.name)
  }
  current.isLeaf = true
  current.leafFile = leafInfo.file
  current.leafPackage = leafInfo.name
}

/**
 * Renders a tree node and its descendants into an array of strings (ASCII tree).
 * Collapses single-child chains into a single line with arrows.
 * @param {TreeNode} node - Current tree node.
 * @param {string} prefix - Indentation prefix.
 * @param {boolean} isLast - Whether this is the last child of its parent.
 * @param {boolean} isProd - Whether this branch is production (affects bold styling).
 * @param {string[]} outputLines - Accumulated output lines.
 * @returns {string[]} The same outputLines (for chaining).
 */
function renderTreeNode(node, prefix = '', isLast = true, isProd = true, outputLines = []) {
  if (node.name === rootProjectName) {
    const children = Array.from(node.children.values())
    for (let i = 0; i < children.length; i++) {
      renderTreeNode(children[i], '', i === children.length - 1, isProd, outputLines)
    }
    return outputLines
  }

  // Collapse single-child non-leaf chains
  let currentNode = node
  /** @type {TreeNode[]} */
  let chain = [currentNode]
  while (currentNode.children.size === 1 && !currentNode.isLeaf) {
    const onlyChild = Array.from(currentNode.children.values())[0]
    chain.push(onlyChild)
    currentNode = onlyChild
  }

  const versionStr = chain[0].version ? ` ${DIM}${chain[0].version}${RESET}` : ''
  const nameColor = isProd ? BOLD : ''
  const connector = isLast ? '└─ ' : '├─ '
  let line = `${prefix}${connector}${nameColor}${chain[0].name}${RESET}${versionStr}`
  for (let i = 1; i < chain.length; i++) {
    const v = chain[i].version ? ` ${DIM}${chain[i].version}${RESET}` : ''
    line += ` → ${nameColor}${chain[i].name}${RESET}${v}`
  }
  outputLines.push(line)

  const lastNode = chain[chain.length - 1]
  const newPrefix = prefix + (isLast ? '   ' : '│  ')
  if (lastNode.isLeaf) {
    const leafFile = path.basename(lastNode.leafFile)
    const leafDisplay = ` → ${GREEN}${lastNode.leafPackage}${RESET} → ${CYAN}${leafFile}${RESET}`
    outputLines[outputLines.length - 1] += leafDisplay
  } else if (lastNode.children.size > 0) {
    const children = Array.from(lastNode.children.values())
    for (let i = 0; i < children.length; i++) {
      renderTreeNode(children[i], newPrefix, i === children.length - 1 && !lastNode.isLeaf, isProd, outputLines)
    }
  }
  return outputLines
}

/**
 * Renders the full production and dev trees into a single string.
 * @returns {string}
 */
function renderFullTree() {
  /** @type {string[]} */
  const lines = []
  if (prodTree && prodTree.children.size > 0) {
    lines.push(`${BOLD}Production dependencies:${RESET}\n`)
    lines.push(`${BOLD}${rootProjectName}${RESET}`)
    renderTreeNode(prodTree, '', true, true, lines)
    lines.push('')
  }
  if (devTree && devTree.children.size > 0) {
    lines.push(`Dev dependencies:\n`)
    lines.push(`${rootProjectName}`)
    renderTreeNode(devTree, '', true, false, lines)
    lines.push('')
  }
  if (lines.length === 0) lines.push('No native addons found with dependency chains.')
  return lines.join('\n')
}

/**
 * Processes a single native package using Yarn.
 * @param {string} pkg - Native package name.
 * @param {string} nativeFile - Path to the .node/.so file.
 * @returns {Promise<void>}
 */
async function processPackageYarn(pkg, nativeFile) {
  const result = await getYarnChainToRoot(pkg)
  if (!result || !result.chain) return
  let chain = result.chain.slice(1) // remove root project
  const isDev = result.isDev
  const leafInfo = { name: pkg, file: nativeFile }
  if (isDev) {
    if (!devTree) devTree = { name: rootProjectName, children: new Map() }
    addChainToTree(devTree, chain, leafInfo)
  } else {
    if (!prodTree) prodTree = { name: rootProjectName, children: new Map() }
    addChainToTree(prodTree, chain, leafInfo)
  }
}

/**
 * Processes a single native package using pnpm.
 * @param {string} pkg - Native package name.
 * @param {string} nativeFile - Path to the .node/.so file.
 * @returns {Promise<void>}
 */
async function processPackagePnpm(pkg, nativeFile) {
  const output = await runWhyCommand('pnpm', pkg)
  const chainsData = parsePnpmWhy(pkg, output)
  for (const data of chainsData) {
    let chain = data.chain
    if (chain.length > 0 && chain[0].name === rootProjectName) {
      chain = chain.slice(1)
    }
    if (chain.length > 0 && chain[0].name === pkg) {
      chain = chain.slice(1).reverse()
    }
    const isDev = data.depField === 'devDependencies'
    const leafInfo = { name: pkg, file: nativeFile }
    if (isDev) {
      if (!devTree) devTree = { name: rootProjectName, children: new Map() }
      addChainToTree(devTree, chain, leafInfo)
    } else {
      if (!prodTree) prodTree = { name: rootProjectName, children: new Map() }
      addChainToTree(prodTree, chain, leafInfo)
    }
  }
}

/**
 * Main entry point.
 * - Scans node_modules for .node/.so files.
 * - If CLI arguments are given, filters to those package names; otherwise uses all found.
 * - Detects package manager (yarn/pnpm).
 * - Traces dependency chains in parallel, updating the tree live.
 * - Renders final production/dev dependency trees.
 * @returns {Promise<void>}
 */
async function main() {
  const cwd = process.cwd()
  console.log(`Scanning ${cwd}/node_modules for native addons (.node/.so)...\n`)

  let nativeFiles
  try {
    nativeFiles = await findNativeFiles(path.join(cwd, 'node_modules'))
  } catch (err) {
    console.error(`Error scanning node_modules: ${err.message}`)
    process.exit(1)
  }

  if (nativeFiles.length === 0) {
    console.log('No .node or .so files found in node_modules')
    return
  }

  /** @type {Map<string, string>} Package name → example file path */
  const packageMap = new Map()
  for (const file of nativeFiles) {
    const pkgName = getPackageNameFromPath(file)
    if (pkgName && !pkgName.startsWith('.') && !packageMap.has(pkgName)) {
      packageMap.set(pkgName, file)
    }
  }

  /** @type {string[]} */
  let packages
  if (process.argv.length > 2) {
    // User provided explicit package names
    packages = process.argv.slice(2).filter(pkg => packageMap.has(pkg))
    if (packages.length === 0) {
      console.error('None of the specified packages were found among native addons.')
      process.exit(1)
    }
    console.log(`Processing ${packages.length} user‑specified package(s):\n`)
    for (const pkg of packages) {
      console.log(`  ${BOLD}${pkg}${RESET}`)
    }
    console.log(`\nProcessing...\n`)
  } else {
    packages = Array.from(packageMap.keys())
    console.log(`Found ${packages.length} unique native addon packages:\n`)
    for (const pkg of packages) {
      console.log(`  ${BOLD}${pkg}${RESET}`)
    }
    console.log(`\nProcessing...\n`)
  }

  const pm = await detectPackageManager()
  if (!pm) {
    console.error('Could not detect package manager (needs pnpm-lock.yaml or yarn.lock)')
    process.exit(1)
  }

  await loadRootDeps()

  /** @type {Promise<void>[]} */
  const tasks = []
  for (const pkg of packages) {
    const nativeFile = packageMap.get(pkg)
    const task = pm === 'pnpm' ? () => processPackagePnpm(pkg, nativeFile) : () => processPackageYarn(pkg, nativeFile)
    tasks.push(
      limit(task).then(() => {
        if (isTTY) overlayTree(renderFullTree())
      }),
    )
  }

  await Promise.all(tasks)

  if (!isTTY) {
    console.log(renderFullTree())
  } else {
    overlayTree(renderFullTree())
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})

#!/usr/bin/env node

/**
 * GitHub Release 发布脚本
 *
 * 使用方法:
 *   node scripts/release.js [version]
 *
 * 示例:
 *   node scripts/release.js 0.1.1        # 发布 v0.1.1
 *   node scripts/release.js patch        # 自动递增补丁版本 (0.1.0 -> 0.1.1)
 *   node scripts/release.js minor        # 自动递增次版本 (0.1.0 -> 0.2.0)
 *   node scripts/release.js major        # 自动递增主版本 (0.1.0 -> 1.0.0)
 */

import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// 读取 package.json
function readPackageJson() {
  const packagePath = join(rootDir, 'package.json')
  return JSON.parse(readFileSync(packagePath, 'utf-8'))
}

// 写入 package.json
function writePackageJson(pkg) {
  const packagePath = join(rootDir, 'package.json')
  writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
}

// 解析版本号
function parseVersion(version) {
  const parts = version.split('.').map(Number)
  return {
    major: parts[0],
    minor: parts[1],
    patch: parts[2] || 0
  }
}

// 格式化版本号
function formatVersion(versionObj) {
  return `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`
}

// 递增版本号
function incrementVersion(currentVersion, type) {
  const version = parseVersion(currentVersion)

  switch (type) {
    case 'major':
      version.major++
      version.minor = 0
      version.patch = 0
      break
    case 'minor':
      version.minor++
      version.patch = 0
      break
    case 'patch':
      version.patch++
      break
    default:
      throw new Error(`未知的版本类型: ${type}`)
  }

  return formatVersion(version)
}

// 验证版本号格式
function isValidVersion(version) {
  return /^\d+\.\d+\.\d+$/.test(version)
}

// 检查 git 状态
function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8', cwd: rootDir })
    if (status.trim()) {
      console.error('❌ 错误: 工作区有未提交的更改，请先提交或暂存更改')
      console.error('\n未提交的文件:')
      console.error(status)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ 错误: 无法检查 git 状态')
    process.exit(1)
  }
}

// 检查是否在正确的分支
function checkBranch() {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf-8', cwd: rootDir }).trim()
    console.log(`📌 当前分支: ${branch}`)
    return branch
  } catch (error) {
    console.error('❌ 错误: 无法获取当前分支')
    process.exit(1)
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('📦 GitHub Release 发布工具\n')
    console.log('使用方法:')
    console.log('  node scripts/release.js [version|patch|minor|major]')
    console.log('\n示例:')
    console.log('  node scripts/release.js 0.1.1        # 发布指定版本')
    console.log('  node scripts/release.js patch        # 自动递增补丁版本')
    console.log('  node scripts/release.js minor        # 自动递增次版本')
    console.log('  node scripts/release.js major        # 自动递增主版本')
    process.exit(0)
  }

  const versionArg = args[0]
  const pkg = readPackageJson()
  const currentVersion = pkg.version

  console.log('🚀 开始发布流程...\n')
  console.log(`📋 当前版本: ${currentVersion}`)

  // 检查 git 状态
  checkGitStatus()
  const branch = checkBranch()

  // 确定新版本号
  let newVersion
  if (['patch', 'minor', 'major'].includes(versionArg)) {
    newVersion = incrementVersion(currentVersion, versionArg)
    console.log(`📈 版本类型: ${versionArg}`)
  } else if (isValidVersion(versionArg)) {
    newVersion = versionArg
  } else {
    console.error(`❌ 错误: 无效的版本号格式 "${versionArg}"`)
    console.error('版本号格式应为: x.y.z (例如: 0.1.1)')
    process.exit(1)
  }

  console.log(`✨ 新版本: ${newVersion}\n`)

  /**
   * 判断 tag 是否已存在
   * - 避免重复发布同一个版本导致流程中途失败
   */
  function tagExists(tag) {
    try {
      execSync(`git rev-parse -q --verify refs/tags/${tag}`, { cwd: rootDir, stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }

  /**
   * 判断暂存区是否有变更
   * - `git diff --cached --quiet`：无差异返回 0；有差异返回非 0
   */
  function hasStagedChanges() {
    try {
      execSync('git diff --cached --quiet', { cwd: rootDir, stdio: 'ignore' })
      return false
    } catch {
      return true
    }
  }

  const tagName = `v${newVersion}`
  if (tagExists(tagName)) {
    console.error(`❌ 错误: tag ${tagName} 已存在，请更换版本号或先删除旧 tag`)
    process.exit(1)
  }

  // 确认
  console.log('⚠️  即将执行以下操作:')
  console.log(`   1. 更新 package.json 版本号: ${currentVersion} -> ${newVersion}`)
  console.log(`   2. 提交更改（如有）`)
  console.log(`   3. 创建 tag: ${tagName}`)
  console.log(`   4. 推送 tag 到远程仓库`)
  console.log(`   5. GitHub Actions 将自动构建并发布 Release\n`)

  // 更新 package.json + 提交更改（版本未变化时允许跳过提交，仅用于补打 tag）
  if (newVersion !== currentVersion) {
    console.log('📝 更新 package.json...')
    pkg.version = newVersion
    writePackageJson(pkg)
    console.log('✅ package.json 已更新\n')

    console.log('💾 提交更改...')
    try {
      execSync(`git add package.json`, { cwd: rootDir, stdio: 'inherit' })

      if (!hasStagedChanges()) {
        console.log('ℹ️ 未检测到暂存区变更，跳过提交\n')
      } else {
        execSync(`git commit -m "chore: bump version to ${newVersion}"`, {
          cwd: rootDir,
          stdio: 'inherit'
        })
        console.log('✅ 更改已提交\n')
      }
    } catch (error) {
      console.error('❌ 错误: 提交失败')
      process.exit(1)
    }
  } else {
    console.log('ℹ️ 目标版本与当前版本一致，跳过版本号更新与提交（仅创建/推送 tag）\n')
  }

  // 创建并推送 tag
  console.log(`🏷️  创建 tag: ${tagName}...`)
  try {
    execSync(`git tag -a ${tagName} -m "Release ${tagName}"`, {
      cwd: rootDir,
      stdio: 'inherit'
    })
    console.log(`✅ Tag ${tagName} 已创建\n`)
  } catch (error) {
    console.error(`❌ 错误: 创建 tag 失败`)
    process.exit(1)
  }


  // 推送代码和 tag
  console.log('📤 推送代码和 tag 到远程仓库...')
  try {
    execSync(`git push origin ${branch}`, {
      cwd: rootDir,
      stdio: 'inherit'
    })
    execSync(`git push origin ${tagName}`, {
      cwd: rootDir,
      stdio: 'inherit'
    })
    console.log('✅ 已推送到远程仓库\n')
  } catch (error) {
    console.error('❌ 错误: 推送失败')
    process.exit(1)
  }

  console.log('🎉 发布流程完成！\n')
  console.log('📦 GitHub Actions 将自动:')
  console.log('   1. 检测到新的 tag')
  console.log('   2. 在 Windows、macOS、Linux 上构建应用')
  console.log('   3. 创建 GitHub Release 并上传构建产物\n')
  console.log(`🔗 查看构建状态: https://github.com/LittleOrange-i/Youzi-Write/actions`)
  console.log(`🔗 查看 Release: https://github.com/LittleOrange-i/Youzi-Write/releases`)
}

main()
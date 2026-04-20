import { ipcMain } from 'electron'
import { is } from '@electron-toolkit/utils'

/**
 * 注册 AI 相关 IPC 处理器
 * 支持厂商：alibaba（通义千问）、google（Gemini）、anthropic（Claude）、
 *           baidu（文心一言）、default（OpenAI 兼容格式）
 */
export function registerAiHandlers() {
  // AI 模型 API 测试处理
  ipcMain.handle('test-ai-model', async (_, { endpoint, apiKey, modelId, providerId }) => {
    try {
      let requestBody = {}
      const headers = {
        'Content-Type': 'application/json'
      }

      // 根据不同厂商构建不同的请求体
      switch (providerId) {
        case 'alibaba':
          // 阿里云通义千问：使用 input.prompt
          requestBody = {
            model: modelId,
            input: {
              prompt: '你好，请简单回复一个"测试成功"'
            },
            parameters: {
              max_tokens: 10
            }
          }
          if (apiKey && apiKey.trim()) {
            headers['Authorization'] = `Bearer ${apiKey}`
          }
          break

        case 'google':
          // Google Gemini：使用 contents
          requestBody = {
            contents: [
              {
                parts: [
                  {
                    text: '你好，请简单回复一个"测试成功"'
                  }
                ]
              }
            ],
            generationConfig: {
              maxOutputTokens: 10
            }
          }
          // Gemini API Key 通过 URL 参数传递
          if (apiKey && apiKey.trim()) {
            endpoint = `${endpoint}?key=${apiKey}`
          }
          break

        case 'anthropic':
          // Anthropic Claude：使用 messages，但有特殊的 header
          requestBody = {
            model: modelId,
            messages: [
              {
                role: 'user',
                content: '你好，请简单回复一个"测试成功"'
              }
            ],
            max_tokens: 10
          }
          if (apiKey && apiKey.trim()) {
            headers['x-api-key'] = apiKey
            headers['anthropic-version'] = '2023-06-01'
          }
          break

        case 'baidu':
          // 百度文心一言：使用 messages，但需要 access_token
          requestBody = {
            messages: [
              {
                role: 'user',
                content: '你好，请简单回复一个"测试成功"'
              }
            ],
            max_output_tokens: 10
          }
          // 百度需要先用 API Key 换取 access_token
          if (apiKey && apiKey.trim()) {
            endpoint = `${endpoint}?access_token=${apiKey}`
          }
          break

        default:
          // OpenAI 兼容格式（适用于大多数厂商）
          requestBody = {
            model: modelId,
            messages: [
              {
                role: 'user',
                content: '你好，请简单回复一个"测试成功"'
              }
            ],
            max_tokens: 10
          }
          if (apiKey && apiKey.trim()) {
            headers['Authorization'] = `Bearer ${apiKey}`
          }
          break
      }

      // 发送测试请求
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      })

      // 检查响应的 Content-Type
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        // 返回的不是 JSON，可能是 HTML 错误页面
        const text = await response.text()
        return {
          success: false,
          error: `API返回了非JSON格式的响应 (${response.status}): ${text.substring(0, 200)}...`
        }
      }

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        // JSON 解析失败
        return {
          success: false,
          error: `无法解析API响应: ${parseError.message}`
        }
      }

      if (!response.ok) {
        // 请求失败，返回错误信息
        return {
          success: false,
          error:
            data.error?.message || data.message || data.error_msg || `请求失败: ${response.status}`
        }
      }

      // 检查响应是否包含有效内容（支持不同厂商的响应格式）
      const hasValidContent =
        data.choices || // OpenAI、DeepSeek、通用格式
        data.content || // Anthropic Claude
        data.output || // 阿里云通义千问
        data.result || // 百度文心一言
        data.candidates // Google Gemini

      if (hasValidContent) {
        return {
          success: true,
          message: '测试成功！模型配置正确'
        }
      } else {
        return {
          success: false,
          error: '响应格式不正确，未找到预期的内容字段'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || '网络请求失败'
      }
    }
  })

  // AI 调用处理 - 用于改写、扩写、续写、润色、起名助手等功能
  ipcMain.handle(
    'call-ai',
    async (_, { endpoint, apiKey, modelId, providerId, systemPrompt, userPrompt }) => {
      try {
        let requestBody = {}
        const headers = {
          'Content-Type': 'application/json'
        }

        // 根据不同厂商构建不同的请求体
        switch (providerId) {
          case 'alibaba':
            // 阿里云通义千问：使用 input.messages
            requestBody = {
              model: modelId,
              input: {
                messages: [
                  {
                    role: 'system',
                    content: systemPrompt
                  },
                  {
                    role: 'user',
                    content: userPrompt
                  }
                ]
              },
              parameters: {
                result_format: 'message'
              }
            }
            if (apiKey && apiKey.trim()) {
              headers['Authorization'] = `Bearer ${apiKey}`
            }
            break

          case 'google':
            // Google Gemini：使用 contents，不支持 system role，需要合并到 user message
            requestBody = {
              contents: [
                {
                  parts: [
                    {
                      text: `${systemPrompt}\n\n${userPrompt}`
                    }
                  ]
                }
              ],
              generationConfig: {
                maxOutputTokens: 8000
              }
            }
            // Gemini API Key 通过 URL 参数传递
            if (apiKey && apiKey.trim()) {
              endpoint = `${endpoint}?key=${apiKey}`
            }
            break

          case 'anthropic':
            // Anthropic Claude：使用 messages，system 单独字段
            requestBody = {
              model: modelId,
              system: systemPrompt,
              messages: [
                {
                  role: 'user',
                  content: userPrompt
                }
              ],
              max_tokens: 8000
            }
            if (apiKey && apiKey.trim()) {
              headers['x-api-key'] = apiKey
              headers['anthropic-version'] = '2023-06-01'
            }
            break

          case 'baidu':
            // 百度文心一言：使用 messages
            requestBody = {
              messages: [
                {
                  role: 'user',
                  content: `${systemPrompt}\n\n${userPrompt}`
                }
              ],
              max_output_tokens: 8000
            }
            // 百度需要先用 API Key 换取 access_token
            if (apiKey && apiKey.trim()) {
              endpoint = `${endpoint}?access_token=${apiKey}`
            }
            break

          default:
            // OpenAI 兼容格式（适用于大多数厂商：智谱、DeepSeek、硅基流动、Moonshot、腾讯混元等）
            requestBody = {
              model: modelId,
              messages: [
                {
                  role: 'system',
                  content: systemPrompt
                },
                {
                  role: 'user',
                  content: userPrompt
                }
              ],
              max_tokens: 8000
            }
            if (apiKey && apiKey.trim()) {
              headers['Authorization'] = `Bearer ${apiKey}`
            }
            break
        }

        // 发送请求
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody)
        })

        const data = await response.json()

        if (!response.ok) {
          // 请求失败，返回错误信息
          return {
            success: false,
            error:
              data.error?.message ||
              data.message ||
              data.error_msg ||
              `请求失败: ${response.status}`
          }
        }

        // 根据不同厂商提取响应内容
        let content = ''

        if (providerId === 'alibaba') {
          // 阿里云通义千问
          content = data.output?.choices?.[0]?.message?.content || data.output?.text || ''
        } else if (providerId === 'google') {
          // Google Gemini
          content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        } else if (providerId === 'anthropic') {
          // Anthropic Claude
          content = data.content?.[0]?.text || ''
        } else if (providerId === 'baidu') {
          // 百度文心一言
          content = data.result || ''
        } else {
          // OpenAI 兼容格式（默认）
          content = data.choices?.[0]?.message?.content || ''
        }

        if (!content) {
          return {
            success: false,
            error: '响应格式不正确，未找到有效内容'
          }
        }

        return {
          success: true,
          content: content
        }
      } catch (error) {
        return {
          success: false,
          error: error.message || '网络请求失败'
        }
      }
    }
  )

  if (is.dev) {
    console.log('[主进程] AI 模块处理器已注册')
  }
}

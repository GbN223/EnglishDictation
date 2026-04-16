import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const execFileAsync = promisify(execFile)

function youtubeTranscriptPlugin() {
  const handleTranscriptRequest = async (requestUrl: string) => {
    const url = new URL(requestUrl, 'http://localhost')
    const videoUrl = url.searchParams.get('url') || ''
    const lang = url.searchParams.get('lang') || 'en'

    if (!videoUrl.trim()) {
      return {
        status: 400,
        body: {
          success: false,
          text: '',
          error: 'Missing YouTube URL',
        },
      }
    }

    try {
      const scriptPath = path.resolve(__dirname, 'scripts', 'youtube_transcript.py')
      const { stdout } = await execFileAsync('python', [scriptPath, videoUrl, lang], {
        cwd: __dirname,
        timeout: 55000,
      })

      const body = JSON.parse(stdout)
      return { status: body.success ? 200 : 400, body }
    } catch (error) {
      const stderr =
        error && typeof error === 'object' && 'stderr' in error ? String(error.stderr || '') : ''
      const stdout =
        error && typeof error === 'object' && 'stdout' in error ? String(error.stdout || '') : ''
      const detail = stderr.trim() || stdout.trim()

      return {
        status: 500,
        body: {
          success: false,
          text: '',
          error: detail || 'Failed to execute yt-dlp transcript helper.',
        },
      }
    }
  }

  const middleware = async (req: any, res: any, next: () => void) => {
    if (!req.url?.startsWith('/api/youtube-transcript')) {
      next()
      return
    }

    const result = await handleTranscriptRequest(req.url)
    res.statusCode = result.status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result.body))
  }

  return {
    name: 'youtube-transcript-api',
    configureServer(server: any) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig({
  plugins: [react(), youtubeTranscriptPlugin()],
  server: {
    proxy: {
      '/api/exercises': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/api/vocab': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/api/srs': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

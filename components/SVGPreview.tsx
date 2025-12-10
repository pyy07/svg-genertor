'use client'

interface SVGPreviewProps {
  svgCode: string | null
  loading: boolean
}

export default function SVGPreview({ svgCode, loading }: SVGPreviewProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      {loading ? (
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">生成中...</p>
        </div>
      ) : svgCode ? (
        <div
          className="w-full h-full flex items-center justify-center p-8"
          dangerouslySetInnerHTML={{ __html: svgCode }}
        />
      ) : (
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">🎨</div>
          <p className="text-lg text-gray-700">动画预览面板</p>
          <p className="text-sm mt-2 text-gray-500">生成的 SVG 将在这里显示</p>
        </div>
      )}
    </div>
  )
}


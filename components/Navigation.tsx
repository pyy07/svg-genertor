'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavigationProps {
  user?: {
    nickname?: string
    avatar?: string
  }
  onLogout?: () => void
}

export default function Navigation({ user, onLogout }: NavigationProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/gallery', label: '案例' },
    { href: '/assets', label: '我的素材' },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                SVG
              </div>
              <Link href="/" className="text-xl font-bold text-gray-900">
                SVG Generator
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href === '/' && pathname === '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">{user.nickname || '用户'}</span>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    退出
                  </button>
                )}
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                登录
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}


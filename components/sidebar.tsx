'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BarChart3, Layers2, QrCode, Wrench } from 'lucide-react'

const navigation = [
  {
    name: 'Job Cards',
    href: '/job-cards',
    icon: Layers2,
  },
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    name: 'QR Scanner',
    href: '/qr-scanner',
    icon: QrCode,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Wrench,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-border bg-card p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Assembly Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">Factory Floor Management</p>
      </div>

      <nav className="space-y-2 flex-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">v0.1.0</p>
      </div>
    </aside>
  )
}

'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  BarChart3,
  Database,
  Factory,
  FileText,
  HelpCircle,
  Layers2,
  QrCode,
  Search,
  Wrench,
} from 'lucide-react'

import { NavDocuments } from '@/components/nav-documents'
import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import Image from 'next/image'

const data = {
  user: {
    name: 'Floor Operator',
    email: 'operator@assembly.local',
    avatar: '',
  },
  navMain: [
    {
      title: 'Job Cards',
      url: '/job-cards',
      icon: Layers2,
    },
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: BarChart3,
    },
    {
      title: 'QR Scanner',
      url: '/qr-scanner',
      icon: QrCode,
    },
    // {
    //   title: 'Settings',
    //   url: '/settings',
    //   icon: Wrench,
    // },
  ],
  documents: [
    {
      name: 'Dashboard data',
      url: '/dashboard',
      icon: Database,
    },
    {
      name: 'Job queue',
      url: '/job-cards',
      icon: FileText,
    },
  ],
  navSecondary: [
    {
      title: 'Get Help',
      url: '#',
      icon: HelpCircle,
    },
    {
      title: 'Search',
      url: '#',
      icon: Search,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/job-cards" className="flex items-start gap-2">
                <Image src="/logo.jpeg" alt="Lucky Motors Corp" width={32} height={32} />
                <span className="flex min-w-0 flex-col gap-0.5 text-left">
                  <span className="text-base font-semibold leading-tight">
                    Lucky Motors Corp
                  </span>
                  <span className="truncate text-xs font-normal text-sidebar-foreground/70">
                    Wire Harness assembly tracking
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      {/* <SidebarFooter>
        <NavUser user={data.user} />
        <p className="px-2 pb-1 text-xs text-sidebar-foreground/60">
          v0.1.0
        </p>
      </SidebarFooter> */}
    </Sidebar>
  )
}

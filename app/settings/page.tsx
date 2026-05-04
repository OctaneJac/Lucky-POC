import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Bell, Lock, Database } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="h-full bg-background p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Configure your assembly line tracker</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* General Settings */}
        <Card className="p-6 border border-border bg-card">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-5 h-5 text-foreground" />
            <h2 className="text-xl font-semibold text-foreground">General</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="facility" className="text-foreground">Facility Name</Label>
              <Input
                id="facility"
                placeholder="Enter facility name"
                defaultValue="Main Assembly Line"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="location" className="text-foreground">Location</Label>
              <Input
                id="location"
                placeholder="Enter location"
                defaultValue="Building A, Line 1"
                className="mt-2"
              />
            </div>

            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6 border border-border bg-card">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-foreground" />
            <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Job Completion Alerts</p>
                <p className="text-sm text-muted-foreground">Notify when jobs complete a stage</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Flagged Job Alerts</p>
                <p className="text-sm text-muted-foreground">Notify when jobs are flagged</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Daily Reports</p>
                <p className="text-sm text-muted-foreground">Send daily performance summary</p>
              </div>
              <input type="checkbox" className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card className="p-6 border border-border bg-card">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-foreground" />
            <h2 className="text-xl font-semibold text-foreground">Security</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-foreground">Change Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="New password"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="confirm-password" className="text-foreground">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm password"
                className="mt-2"
              />
            </div>

            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Update Password</Button>
          </div>
        </Card>

        {/* Database */}
        <Card className="p-6 border border-border bg-card">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-5 h-5 text-foreground" />
            <h2 className="text-xl font-semibold text-foreground">Database</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="font-medium text-foreground mb-2">Database Status</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <p className="text-sm text-muted-foreground">Connected to Neon PostgreSQL</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Backup & Maintenance
              </p>
              <Button variant="outline" className="mr-2">Backup Database</Button>
              <Button variant="outline">Clear Cache</Button>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card className="p-6 border border-border bg-card bg-slate-50 dark:bg-slate-900/30">
          <h2 className="text-lg font-semibold text-foreground mb-4">About</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Assembly Line Tracker v0.1.0</p>
            <p>Factory floor job tracking and management system</p>
            <p className="pt-2">© 2024 Assembly Tracker. All rights reserved.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

import { Navigate } from 'react-router-dom'
import { useSettings } from '../lib/hooks/useSettings'
import { ToolsOverview } from '../components/tools/ToolsOverview'

export function ToolsPage() {
  const { wellnessToolsEnabled } = useSettings()
  if (!wellnessToolsEnabled) return <Navigate to="/" replace />
  return <ToolsOverview />
}

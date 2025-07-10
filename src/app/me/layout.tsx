"use client"
import { withAuthLayout } from '@/backend/withAuth'
import React, { ReactNode } from 'react'

type ProtectedLayoutProps = {
  children?: ReactNode
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({
  children,
}: ProtectedLayoutProps) => {

  return (
    <div className="protected-layout">
      <main>{children}</main>
    </div>
  )
}

export default withAuthLayout({
  role: 'user',
  redirectTo: '/signin',
  unauthorizedRedirect: '/admin/forbidden',
})(ProtectedLayout)

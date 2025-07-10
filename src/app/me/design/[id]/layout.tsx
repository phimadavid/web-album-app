"use client"
import { withAuthLayout } from '@/backend/withAuth'
import React, { ReactNode } from 'react'

type DesignLayoutProps = {
    children?: ReactNode
}

const DesignLayout: React.FC<DesignLayoutProps> = ({
    children,
}: DesignLayoutProps) => {

    return (
        <div className="design-layout">
            <main>{children}</main>
        </div>
    )
}

export default withAuthLayout({
    role: 'user',
    redirectTo: '/signin',
    unauthorizedRedirect: '/admin/forbidden',
})(DesignLayout)

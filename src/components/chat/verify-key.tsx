'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'

const VerifyKey = () => {
    const router = useRouter()
    const pathname = usePathname()
    useEffect(() => {
        const apiKey = localStorage.getItem('gemini_api_key')
        if (!apiKey?.trim()) {
            router.push('/connect')
        }
    }, [pathname])
    return null
}

export default VerifyKey
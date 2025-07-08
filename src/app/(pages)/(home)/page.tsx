import React from 'react'
import ChatInput from '@/components/chat/chat-input'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

const page = async () => {
  const session = await auth()
  if (!session) {
    redirect('/auth')
  }
  return (
    <div className='flex flex-col h-full gap-4 justify-center items-center'>
      <p className='text-3xl mb-8'>What are you working on?</p>
      <ChatInput isNewThread={true}/>
    </div>
  )
}

export default page
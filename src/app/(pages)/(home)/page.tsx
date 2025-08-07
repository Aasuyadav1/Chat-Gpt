import React from 'react'
import ChatInput from '@/components/chat/chat-input'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ShinyText from '@/components/global/shinny-text'

const page = async () => {
  const session = await auth()
  if (!session) {
    redirect('/auth')
  }
  return (
    <div className='flex flex-col h-full gap-4 justify-center items-center p-2 md:p-0'>
      <ShinyText text="What are you working on?" disabled={false} speed={3} className='text-3xl mb-8' />
      <ChatInput isNewThread={true}/>
    </div>
  )
}

export default page
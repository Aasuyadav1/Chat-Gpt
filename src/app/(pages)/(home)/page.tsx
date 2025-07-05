import React from 'react'
import ChatInput from '@/components/chat/chat-input'

const page = () => {
  return (
    <div className='flex flex-col h-full gap-4 justify-center items-center'>
      <p className='text-3xl mb-8'>What are you working on?</p>
      <ChatInput isNewThread={true}/>
    </div>
  )
}

export default page
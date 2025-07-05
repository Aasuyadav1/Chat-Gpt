'use client'
import chatStore from '@/stores/chat.store'
import React from 'react'

const PresetMsg = ({presetMessages, tab}: {presetMessages: { [key: string]: { text: string }[] }, tab: { value: string }}) => {
    const {setQuery} = chatStore()
  return (
    presetMessages[tab.value].map((message, index) => (
        <div
          key={index}
          onClick={() => setQuery(message.text)}
          className="flex  items-start gap-2 border-t border-secondary/40 py-1 first:border-none"
        >
          <button className="w-full rounded-md py-2 text-left text-secondary-foreground hover:bg-secondary/50 sm:px-3">
            <span>{message.text}</span>
          </button>
        </div>
      ))
  )
}

export default PresetMsg
export interface MemoryType {
    id: string
    memory: string
    user_id: string
    metadata: any
    categories: string[]
    created_at: string
    updated_at: string
    expiration_date: string | null
    is_updated: boolean
    structured_attributes: any
}
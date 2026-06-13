import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>Supabase Connected: Todos List</h1>
      <ul style={{ listStyleType: "disc", paddingLeft: 20 }}>
        {todos?.map((todo) => (
          <li key={todo.id} style={{ marginBottom: 8, fontSize: 16 }}>
            {todo.name}
          </li>
        ))}
      </ul>
      {(!todos || todos.length === 0) && (
        <p style={{ color: "#666" }}>No todos found or todos table is empty.</p>
      )}
    </div>
  )
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

export async function POST() {
  try {
    // Create admin client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Read SQL file
    const sqlPath = path.join(process.cwd(), 'supabase-schema.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Split SQL into individual statements (crude but effective)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`Executing ${statements.length} SQL statements...`)

    const results = []
    const errors = []

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement,
        })

        if (error) {
          console.error(`Statement ${i + 1} failed:`, error.message)
          errors.push({ statement: i + 1, error: error.message })
        } else {
          results.push({ statement: i + 1, success: true })
        }
      } catch (err) {
        console.error(`Statement ${i + 1} exception:`, err)
        errors.push({
          statement: i + 1,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    // Try direct approach using pg-like syntax
    await supabase.from('_migrations').select('*').limit(1)

    return NextResponse.json({
      message: 'Database setup attempted',
      results,
      errors,
      note: 'If this fails, please run the SQL manually in Supabase SQL Editor',
    })
  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json(
      {
        error: 'Failed to setup database',
        message: error instanceof Error ? error.message : 'Unknown error',
        note: 'Please run supabase-schema.sql manually in Supabase SQL Editor',
      },
      { status: 500 }
    )
  }
}

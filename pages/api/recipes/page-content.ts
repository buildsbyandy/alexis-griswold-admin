import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Get the current recipe page content
      const { data, error } = await supabaseAdmin
        .from('recipes_page_content')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching recipe page content:', error)
        return res.status(500).json({ error: 'Failed to fetch recipe page content' })
      }
      
      // If no content exists yet, return default values
      if (!data) {
        return res.status(200).json({
          content: {
            hero_title: 'RECIPES & TUTORIALS',
            hero_subtitle: 'Living with passion, energy, and confidence starts from within.',
            hero_body_paragraph: 'The recipes and rituals I share here are the foundation of how I fuel my body, mind, and spirit everyday. Every smoothie, every meal, and every moment of self-care is designed to support a vibrant, fast-paced life where you feel light, alive, and ready for anything. This is more than food and tutorials, this is a lifestyle rooted in vitality.',
            hero_background_image: null,
            hero_cta_text: null,
            hero_cta_url: null,
            beginner_section_title: 'Just Starting Out',
            beginner_section_subtitle: 'Simple recipes for beginners',
            show_beginner_section: true,
            page_seo_title: 'Recipes & Tutorials - Alexis Griswold',
            page_seo_description: 'Discover vibrant recipes and wellness tutorials designed to fuel your body, mind, and spirit.'
          }
        })
      }
      
      return res.status(200).json({ content: data })
    } catch (error) {
      console.error('Error in recipe page content API:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const {
        hero_title,
        hero_subtitle,
        hero_body_paragraph,
        hero_background_image,
        hero_cta_text,
        hero_cta_url,
        beginner_section_title,
        beginner_section_subtitle,
        show_beginner_section,
        page_seo_title,
        page_seo_description
      } = req.body

      // Check if content already exists
      const { data: existing } = await supabaseAdmin
        .from('recipes_page_content')
        .select('id')
        .limit(1)
        .single()

      let result
      if (existing) {
        // Update existing content
        const { data, error } = await supabaseAdmin
          .from('recipes_page_content')
          .update({
            hero_title,
            hero_subtitle,
            hero_body_paragraph,
            hero_background_image,
            hero_cta_text,
            hero_cta_url,
            beginner_section_title,
            beginner_section_subtitle,
            show_beginner_section,
            page_seo_title,
            page_seo_description,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select('*')
          .single()

        if (error) {
          console.error('Error updating recipe page content:', error)
          return res.status(500).json({ error: 'Failed to update recipe page content' })
        }
        result = data
      } else {
        // Create new content
        const { data, error } = await supabaseAdmin
          .from('recipes_page_content')
          .insert({
            hero_title,
            hero_subtitle,
            hero_body_paragraph,
            hero_background_image,
            hero_cta_text,
            hero_cta_url,
            beginner_section_title,
            beginner_section_subtitle,
            show_beginner_section,
            page_seo_title,
            page_seo_description
          })
          .select('*')
          .single()

        if (error) {
          console.error('Error creating recipe page content:', error)
          return res.status(500).json({ error: 'Failed to create recipe page content' })
        }
        result = data
      }
      
      return res.status(200).json({ content: result })
    } catch (error) {
      console.error('Error saving recipe page content:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT'])
  return res.status(405).json({ error: 'Method Not Allowed' })
}
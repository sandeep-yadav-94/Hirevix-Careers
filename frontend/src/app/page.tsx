import CarrerGuide from '@/components/carrer-guide'
import Hero from '@/components/hero'
import { Button } from '@/components/ui/button'
import { Ghost } from 'lucide-react'
import React from 'react'

const Home = () => {
  return (
    <div>
       <Hero />
       <CarrerGuide />
    </div>
  )
}

export default Home
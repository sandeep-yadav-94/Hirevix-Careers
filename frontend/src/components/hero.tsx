import Link from 'next/link'
import { Button } from './ui/button'
import { ArrowRight, Briefcase, Search, SearchIcon, TrendingUp } from 'lucide-react'
import React from 'react'

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-secondary">
        <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl">

            </div>
            <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl">
                
            </div>
        </div>

        <div className="container mx-auto px-5 py-16 md:py-24 relative">
            <div className="flex flex-col-reverse md:flex-row items-center gap-12 md:gap-16">
                <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-6">
                    {/* badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/50 backdrop-blur-sm">
                          <TrendingUp size={16} className="text-blue-600" />
                            <span className="text-sm text-muted-foreground">We are hiring!</span>
                    </div> 
                     {/* main heading  */}

                     <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                        Find Your Dream Job with <span className='inline-block '>Hire<span className='text-red-600'>vix</span></span> 
                     </h1>

                     {/* description */}

                     <p className="text-lg md:text-xl leading-relaxed opacity-80 max-w-2xl">
                        More than a job portal—Hirevix Careers is the gateway to your professional future. Explore verified opportunities, showcase your talent, connect with trusted employers, and experience a smarter, faster, and more transparent hiring journey. Proudly built as the official career platform of the Hirevix Ecosystem.
                     </p>

                     {/* stats */}

                     <div className="flex flex-wrap justify-center md:justify-start gap-8 py-4 ">
                        <div className="text-center md:text-left">
                            <p className="text-3xl font-bold text-blue-600">10k+</p>
                            <p className="text-sm opacity-70">Active Jobs</p>
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-3xl font-bold text-blue-600">6k+</p>
                            <p className="text-sm opacity-70">Companies</p>
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-3xl font-bold text-blue-600">50k+</p>
                            <p className="text-sm opacity-70">Job Seekers</p>
                        </div>
                     </div>

                     <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <Link href={'/jobs'} >
                        <Button size={'lg'} className=' text-base px-8 h-12 gap-2 group transition-all'>
                            <SearchIcon size={18} />
                            Browse Jobs <ArrowRight size={18} className='group-hover:translate-x-1 transition-transform' />
                        </Button>
                        </Link>
                        <Link href={'/about'}>
                        <Button variant={'outline'} size={'lg'} className=' text-base px-8 h-12 gap-2'>
                            <Briefcase size={18}/>
                            Learn More
                        </Button>
                        </Link>
                     </div>


                     {/* trust indicators section */}

                     <div className="flex items-center gap-2 text-sm opacity-60 pt-4">
                        <span>✔️ Free to Use</span>
                        <span>•</span>
                        <span>🔒 Secure & Private</span>
                        <span>•</span>
                        <span>💼 Trusted by Professionals</span>
                     </div>


                </div>


                {/* image section */}

                <div className="flex-1 relative">
                    <div className="relative group ">
                        <div className="absolute inset-4 group-hover:opacity-30 transition-opacity blur-xl"></div>
                        <div className="relative rounded-2xl overflow-hidden ">
                            <img src="/Hirevix2.png" className='object-cover object-center w-full h-full transform transition-transform duration-500 group hover:scale-105' alt="" />
                        </div>
                    </div>
                </div>



            </div>
        </div>


    </section>
  )
}

export default Hero
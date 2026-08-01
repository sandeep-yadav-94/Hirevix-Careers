 "use client"

import { CareerGuideResponse, utils_service } from '@/type'
import axios from 'axios'
 import { ArrowRight, Sparkles, X } from 'lucide-react'
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Input } from './ui/input'

const CarrerGuide = () => {

    const [open, setOpen] = useState(false)
    const [skills, setSkills] = useState<string[]>([])
    const [currentSkill, setCurrentSkill] = useState("")
    const [loading, setLoading] = useState(false)
    const [response, setResponse] = useState<CareerGuideResponse | null>(null)

    const addSkill = () => {

        if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
            setSkills([...skills, currentSkill.trim()])
            setCurrentSkill("")
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setSkills(skills.filter((s) => s !== skillToRemove));
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            addSkill();
        }
    };

    const getCarrerGuide = async () => {
        if (skills.length === 0) {
            alert("Please add at least one skill.");
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.post(`${utils_service}/api/utils/career`, { skills: skills });
            setResponse(data);
            alert("Career guide generated successfully!");
        } catch (error) {
            alert("Failed to generate career guide.");
        } finally {
            setLoading(false);
        }
    };

    const resetDialog = () => {
        setOpen(false);
        setSkills([]);
        setCurrentSkill("");
        setResponse(null);
    };

  return (
    <div className='max-w-7xl mx-auto px-4 py-16'>
        <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-blue-50 dark:bg-blue-950 mb-4">
                <Sparkles size={16} className="text-blue-600" />
                <span className="text-sm font-medium">AI-Powered Career Guide</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Career, Our Guidance</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                Navigate your career path with our AI-driven insights. From resume optimization to interview prep, we provide the tools and guidance you need to succeed in today's competitive job market.
            </p>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger
                    render={
                        <Button size={'lg'} className=' px-8 h-12 gap-2'>
                            <Sparkles size={18} />
                            Get Career Guidence
                            <ArrowRight size={18} />
                        </Button>
                    }
                />
                <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
                    {
                        !response ? <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl flex items-center gap-2">
                                <Sparkles  className="text-blue-600" />
                                Tell us about your skills
                            </DialogTitle>
                            <DialogDescription>
                                Add your skills to get a personalized career guide. You can add multiple skills and remove them if needed. Once you're ready, click "Generate Career Guide" to receive insights tailored to your skill set.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className='space-y-2'>
                                <Label htmlFor="skill">Add Skills</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        id="skill"
                                        placeholder="Enter a skill"
                                        value={currentSkill}
                                        onChange={(e) => setCurrentSkill(e.target.value)}
                                        className="h-11"
                                    />
                                    <Button 
                                        onClick={addSkill}
                                        className="gap-2"
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>

                            {
                                skills.length > 0 && <div className="space-y-2">
                                    <Label>Added Skills</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((skill, index) => (
                                            <div
                                                key={index}
                                                className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                                            >
                                                <span className="text-sm font-medium">{skill}</span>
                                                <button
                                                    onClick={() => removeSkill(skill)}
                                                    className="h-5 w-5 rounded-full bg-red-500 text-white flex in-checked:justify-center"
                                                >
                                                    <X size={13} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            }


                        </div>
                        </> : <>

                        </>
                    }
                </DialogContent>
            </Dialog>
                

        </div>
    </div>
  )
}

export default CarrerGuide
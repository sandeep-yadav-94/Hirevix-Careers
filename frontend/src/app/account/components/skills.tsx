"use client"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAppData } from '@/context/AppContext'
import { AccountProps } from '@/type'
import { Award, Plus, Sparkle, Sparkles, X } from 'lucide-react'
import React, { useState } from 'react'

const Skills:React.FC<AccountProps> = ({user, isYourAccount}) => {
    const {addSkill, btnLoading, removeSkill} = useAppData()
    const [skill, setSkill] = useState("");

    const addSkillHandler = () => {
        if(!skill.trim()){
            alert("Please enter a skill");
            return
        }
        addSkill(skill);
        setSkill("");
    }

    const handleKeyPress = (e:React.KeyboardEvent<HTMLInputElement>) =>{
        if(e.key === "Enter"){
            addSkillHandler();
        }
    }

    const removeSkillHandler = (skillToRemove:string) => {
        if(confirm(`Are you sure to remove ${skillToRemove} ?`)){
            removeSkill(skillToRemove)
        }
    }
  return (
    <div className='mx-auto max-w-5xl'>
        <Card className='overflow-hidden border border-slate-200/80 bg-white shadow-[0_24px_80px_-30px_rgba(2,6,23,0.2)]'>
            <div className='border-b border-slate-200 bg-[linear-gradient(135deg,_#eff6ff_0%,_#f8fbff_100%)] p-6'>
                <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='flex items-center gap-3'>
                        <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600'>
                            <Award size={20} />
                        </div>
                        <div>
                            <CardTitle className='text-2xl text-slate-950'>{isYourAccount ? 'Your skills' : 'User skills'}</CardTitle>
                            {isYourAccount && <CardDescription className='mt-1 text-sm text-slate-600'>Showcase your expertise and abilities</CardDescription>}
                        </div>
                    </div>
                    <div className='inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-sm font-medium text-blue-700'>
                        <Sparkles size={15} />
                        {user.skills?.length || 0} strengths
                    </div>
                </div>
            </div>

            {isYourAccount && (
                <div className='border-b border-slate-200 bg-white/80 p-6'>
                    <div className='flex flex-col gap-3 sm:flex-row'>
                        <div className='relative flex-1'>
                            <Sparkle size={18} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'/>
                            <Input type='text' placeholder='e.g. CCC, Tally, Excel...' className='h-11 bg-slate-50 pl-10' value={skill} onChange={e=>setSkill(e.target.value)} onKeyPress={handleKeyPress} />
                        </div>
                        <Button onClick={addSkillHandler} className='h-11 gap-2 px-6' disabled={!skill.trim() || btnLoading}>
                            <Plus size={18} />
                            Add skills
                        </Button>
                    </div>
                </div>
            )}

            <CardContent className='p-6'>
              {user.skills?.length > 0 ? (
                <div className='flex flex-wrap gap-2'>
                  {user.skills.map((skill, index) => (
                    <div
                      key={index}
                      className='flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm'
                    >
                      <span>{skill}</span>

                      {isYourAccount && (
                        <button
                          type='button'
                          className='rounded-full p-0.5 transition-colors hover:bg-slate-200'
                          onClick={() => removeSkillHandler(skill)}
                        >
                          <X className='h-3.5 w-3.5' />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-10 text-center'>
                  <Sparkles className='mb-3 h-10 w-10 text-blue-500' />

                  {isYourAccount ? (
                    <>
                      <p className='text-base font-semibold text-slate-900'>No skills added yet</p>
                      <p className='mt-1 text-sm text-slate-500'>Start building your profile by adding your skills.</p>
                    </>
                  ) : (
                    <>
                      <p className='text-base font-semibold text-slate-900'>No skills added</p>
                      <p className='mt-1 text-sm text-slate-500'>This user hasn't added any skills yet.</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
        </Card>
    </div>
  )
}

export default Skills
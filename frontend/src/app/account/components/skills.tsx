"use client"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAppData } from '@/context/AppContext'
import { AccountProps } from '@/type'
import { div } from 'framer-motion/client'
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
    <div className='max-w-5xl mx-auto px-4 py-6 '>
        <Card className='shadow-lg border-2 overflow-hidden'>
            <div className="bg-blue-500 p-6 border-b ">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <Award size={20} className='text-blue-600'/>
                    </div>
                    <CardTitle className='text-2xl text-white '>{isYourAccount ? "Your skills" : "User skills"}</CardTitle>
                {
                    isYourAccount && <CardDescription className='text-sm mt-1 text-white'>
                        Showcase your expertise and abilities
                    </CardDescription>
                }
                </div>
                
            </div>

            {/* add skills input */}

            {
                isYourAccount && <div className='flex gap-3 flex-col sm:flex-row'>
                    <div className="relative flex-1">
                        <Sparkle size={18} className='absolute left-3 top-1/2 -translate-y-1/2 opacity-50'/>
                        <Input type='text' placeholder='e.g. CCC, Tally, Excel...' className='h-11 pl-10 bg-background' value={skill} onChange={e=>setSkill(e.target.value)} onKeyPress={handleKeyPress} />
                    </div>
                    <Button onClick={addSkillHandler} className='h-11 gap-2 px-6' disabled={!skill.trim() || btnLoading}>
                        <Plus size={18} />
                        Add skills
                    </Button>
                </div>
            }

            {/* skills displayed */}

<CardContent className="p-6">
  {user.skills?.length > 0 ? (
    <div className="flex flex-wrap gap-2">
      {user.skills.map((skill, index) => (
        <div
          key={index}
          className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
        >
          <span>{skill}</span>

          {isYourAccount && (
            <button
              type="button"
              className="ml-1 rounded-full p-0.5 transition-colors hover:bg-blue-200"
              onClick={() => removeSkillHandler(skill)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Sparkles className="mb-3 h-10 w-10 text-blue-500" />

      {isYourAccount ? (
        <>
          <p className="text-base font-semibold text-gray-800">
            No skills added yet
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Start building your profile by adding your skills.
          </p>
        </>
      ) : (
        <>
          <p className="text-base font-semibold text-gray-800">
            No skills added
          </p>
          <p className="mt-1 text-sm text-gray-500">
            This user hasn't added any skills yet.
          </p>
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
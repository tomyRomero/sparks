import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { storyTabs, galleryTabs, literatureTabs } from "@/constants";
import Image from "next/image";
import AIForm from '../forms/AIForm';

interface Props{
  data: string,
  type: string,
}

const getTabs= (type: string)=> {
  switch (type){
    case "Regular":
      return []
    case "Story":
      return storyTabs;
    case "Gallery":
      return galleryTabs;
    case "Literature":
      return literatureTabs;
  }
}

const Studio = ({data, type} : Props) => {
  const tabs = getTabs(type)
  return (
    <>
    <h2 className='text-center text-heading4-medium w-36 mx-auto lg:hidden'><span className='blue_gradient'>{type} Post</span></h2>
    <div className="mt-4">
      
    <div className={`${type === 'Regular' ? '' : 'hidden'}`}>
      <AIForm name='Regular' userId={data} />
    </div>

    <Tabs defaultValue=
    {
      //@ts-ignore
      `${tabs[0] === undefined ? '' : tabs[0].value}`
    } 
      className={`w-full`}>
      <TabsList className={`
      ${type === 'Regular' ? 'hidden': ''}
      ${type === 'Story'? 'w-full grid grid-cols-2' : ''}
      ${type === 'Gallery'? 'w-full grid grid-cols-3' : ''}
      ${type === 'Literature'? 'w-full grid grid-cols-4' : ''}
      `}>
      {tabs?.map((tab) => (
              <TabsTrigger key={tab.label} value={tab.value} className="text-black data-[state=active]:bg-primary-500 data-[state=active]:text-light-2">
                 <p className='max-lg:hidden'>{tab.label}</p>
                <Image
                  src={tab.icon}
                  alt={tab.label}
                  width={24}
                  height={24}
                  className='object-contain'
                />
              </TabsTrigger>
            ))}
      </TabsList>
      {tabs?.map((tab) => (
        <TabsContent key={`content-${tab.label}`} value={tab.value} className="w-full text-black">
          <AIForm name={tab.value} userId={data}/>
        </TabsContent>
          ))}
    </Tabs>
    </div>
    </>
  )
}

export default Studio
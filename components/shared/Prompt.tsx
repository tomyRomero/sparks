"use client"

import React, { useState, Fragment } from 'react'
import { Dialog, Transition} from '@headlessui/react'
import Image from 'next/image'

const Prompt = ({title, prompt}: {title: string, prompt: string}) => {

    const [isOpen, setIsOpen] = useState(false);
   
    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

  return (
    <>
    <div className={`${title !=="Regular" && title !== "Comment" ? '' : 'hidden'} `}>
        <button type="button" onClick={openModal}>
                    <h1 className="text-base-semibold teal_gradient cursor-pointer hover:text-light-1 ml-2">{title}</h1>
        </button>
    </div>
   

    <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" onClose={closeModal} className="dialog-container">
            <div className="min-h-screen px-4 text-center">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <Dialog.Overlay className="fixed inset-0" />
                </Transition.Child>
                
                {/* Trick for headless UI to center img */}
                <span
                    className="inline-block h-screen align-middle"
                    aria-hidden="true"
                 /> 
                   
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                <div className="dialog-content">
                <div className="flex flex-col">
                        <Image
                            src="/assets/close.svg"
                            alt="close"
                            width={24}
                            height={24}
                            className="cursor-pointer ml-auto"
                            onClick={closeModal}
                            />

                        <div className="flex pt-5 gap-3 justify-center align-middle">
                            <div className="rounded-10" >
                                <Image 
                                src="/assets/logo.svg"
                                alt="logo"
                                width={35}
                                height={35}
                                />
                            </div>
                            <h4 className="text-heading2-bold">
                                Prompt That Was Used:
                            </h4>
                        </div>  
                    </div>
                    <div className='text-heading3-bold pt-10'>
                    {prompt &&  <p className='text-center'>{prompt}</p>}
                    {!prompt && <p className='text-center'>This post was made when prompt saving was not a feature, sorry for the inconvenience and please check out newer posts.</p>}
                    
                    </div>
                </div>
                </Transition.Child>
            </div>
        </Dialog>
    </Transition>
  </>
  )
}

export default Prompt
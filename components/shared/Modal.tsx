"use client"

import { useState, Fragment, FormEvent, useEffect } from "react"
import { Dialog, Transition} from '@headlessui/react'
import Image from "next/image"
import { fetchUsers } from "@/lib/actions/user.actions"
import { Input } from "../ui/input";
import UserCard from "../cards/UserCard"

interface Props {
    postId: string
    user: string;
}

const Modal = ({postId, user} : Props) => {

 const [isOpen, setIsOpen] = useState(false);
 const [search, setSearch] = useState("");

 const [result, setResult] = useState({
    users: [],
    isNext: false
 });

 const openModal = () => setIsOpen(true);
 const closeModal = () => setIsOpen(false);


useEffect(()=> {

    if(isOpen)
    {
         setTimeout(() => {
            getUsers();
          }, 300);
    }
}
, [search, setSearch, isOpen])


 const getUsers = async () => {
    const result = await fetchUsers({
        userId: user,
        searchString: search,
        pageNumber: 1,
        pageSize: 5,
      });

    setResult(result)
 }

  return (
  <>
    <button type="button" onClick={openModal}>
                <Image
                  src='/assets/share.svg'
                  alt='share'
                  width={24}
                  height={24}
                  className='cursor-pointer object-contain'
                />
    </button>

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

                        <div className="flex justify-between">
                            <div className="p-3 rounded-10" >
                                <Image 
                                src="/assets/logo.svg"
                                alt="logo"
                                width={35}
                                height={35}
                                />
                                 
                            </div>
                            <h4 className="text-heading2-bold">
                                    Share This Post With Other Users!
                            </h4>
                        </div>  
                        <p className="text-sm text-gray-600 mt-2 text-center">Send it directly to their inboxes! </p>
                         {/* Search Bar Logic */}
                         <div className='searchbar mt-5'>
                        <Image
                            src='/assets/search.svg'
                            alt='search'
                            width={24}
                            height={24}
                            className='object-contain'
                        />
                        <Input
                            id='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Search Users`}
                            className='no-focus searchbar_input'
                        />
                        </div>
                        <div className='mt-14 flex flex-col gap-9'>
                            {result.users.length === 0 ? (
                            <p className='no-result'>No Result</p>
                            ) : (
                            <>
                                {result.users.map((person: any) => (
                                <UserCard
                                    key={person.id}
                                    id={person.id}
                                    name={person.name}
                                    username={person.username}
                                    imgUrl={person.image}
                                    type="share"
                                    postId={postId}
                                    sender={user}
                                />
                                ))}
                            </>
                            )}
                        </div>
                       
                    </div>
                </div>
                </Transition.Child>
            </div>
        </Dialog>
    </Transition>
  </>
  )
}

export default Modal
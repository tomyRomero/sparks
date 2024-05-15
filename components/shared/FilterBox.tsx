"use client"

import { Fragment, useEffect, useRef, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/lib/AppContext'

const people = [
  { name: 'Home: Click to Filter Posts' },
  { name: 'Regular Posts' },
  { name: 'Movie Sparks' },
  { name: 'Novel Sparks' },
  { name: 'Artwork Sparks' },
  { name: 'Fashion Sparks' },
  { name: 'Photography Sparks' },
  { name: 'Haikus Sparks' },
  { name: 'Quote Sparks' },
  { name: 'Joke Sparks' },
  { name: 'Aphorism Sparks' },
]

const FilterBox = ()=> {

  const determinecase = ( title: string ) => {
    switch(title) {
      case "":
        return 0;
      case "Regular":
        return 1;
      case "Movie Spark":
        return 2;
      case "Novel Spark":
        return 3;
      case "Artwork Spark":
        return 4;
      case "Fashion Spark":
        return 5;
      case "Photography Spark":
        return 6;
      case "Haikus Spark":
        return 7;
      case "Quote Spark":
        return 8;
      case "Joke Spark":
        return 9;
      case "Aphorism Spark":
        return 10
      default:
        return 0;
    }
  }

  const {title, setTitle} = useAppContext();

  const [selected, setSelected] = useState(people[determinecase(title)])

  const isMounted = useRef(true);

  useEffect(() => {
    const handleFilterChange = () => {
      switch (selected.name) {
        case 'Home: Click to Filter Posts':
          setTitle('')
          break;
        case 'Regular Posts':
          setTitle('Regular')
          break;
        case 'Movie Sparks':
          setTitle("Movie Spark")
          break;
        case 'Novel Sparks':
          setTitle("Novel Spark")
          break;
        case 'Artwork Sparks':
          setTitle("Artwork Spark")
          break;
        case 'Fashion Sparks':
          setTitle("Fashion Spark")
          break;
        case 'Photography Sparks':
          setTitle("Photography Spark")
          break;
        case 'Haikus Sparks':
          setTitle("Haikus Spark")
          break;
        case 'Quote Sparks':
          setTitle("Quote Spark")
          break;
        case 'Joke Sparks':
          setTitle("Joke Spark")
          break;
        case 'Aphorism Sparks':
          setTitle("Aphorism Spark")
          break;
        default:
          // Default case, redirect to home
          setTitle('')
          break;
      }
    };
  
    // Skip the effect on initial render
      if (isMounted.current) {
        isMounted.current = false;
        return;
      }
      
    handleFilterChange();
  }, [selected]);

  return (
    <div className=" w-72">
      <Listbox value={selected} onChange={setSelected}>
        <div className="relative mt-1">
          <Listbox.Button className="text-white relative w-full cursor-pointer rounded-lg bg-black py-2 pl-3 pr-10 text-left z-20 shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
            <span className="block truncate">{selected.name}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 z-10 ring-black/5 focus:outline-none sm:text-sm">
              {people.map((person, personIdx) => (
                <Listbox.Option
                  key={personIdx}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-primary-500 text-light-1' : 'text-black'
                    }`
                  }
                  value={person}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {person.name}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-light">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}

export default FilterBox;
